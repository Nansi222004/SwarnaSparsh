const Product = require("../../../models/Product");
const StockLog = require("../../../models/StockLog");
const mongoose = require("mongoose");
const { success, error } = require("../../../utils/apiResponse");
const { isSerializedVariant, setSerializedVariantStock } = require("../../../utils/inventorySync");
const { notifySellerLowStock, DEFAULT_LOW_STOCK_THRESHOLD } = require("../../../services/sellerNotificationService");

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const toRegex = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(String(value || ""));

exports.getInventory = async (req, res) => {
  try {
    const {
      search,
      category,
      lowStock,
      threshold,
      sortBy = "updatedAt",
      sortOrder = "desc",
      page = 1,
      limit = 500
    } = req.query;

    const query = { sellerId: req.user.userId };
    const currentPage = parsePositiveInt(page, 1);
    const pageLimit = Math.min(parsePositiveInt(limit, 500), 1000);

    if (search) {
      const escaped = toRegex(search);
      query.name = { $regex: escaped, $options: "i" };
    }
    if (category) {
      if (!isValidObjectId(category)) return error(res, "Invalid category id", 400);
      query.categories = new mongoose.Types.ObjectId(category);
    }
    if (lowStock === "true") {
      const lowStockThreshold = parsePositiveInt(threshold, 10);
      query["variants.stock"] = { $lte: lowStockThreshold };
    }

    const sortableFields = new Set(["name", "createdAt", "updatedAt"]);
    const safeSortBy = sortableFields.has(sortBy) ? sortBy : "updatedAt";
    const safeSortOrder = String(sortOrder).toLowerCase() === "asc" ? 1 : -1;
    const total = await Product.countDocuments(query);

    const products = await Product.find(query)
      .select("name images variants categories sellerId")
      .populate("categories", "name")
      .sort({ [safeSortBy]: safeSortOrder })
      .skip((currentPage - 1) * pageLimit)
      .limit(pageLimit);

    return success(res, {
      inventory: products,
      pagination: {
        total,
        page: currentPage,
        limit: pageLimit,
        pages: Math.ceil(total / pageLimit) || 1
      }
    }, "Inventory retrieved");
  } catch (err) { return error(res, err.message); }
};

const parseStockInt = (value) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
};

exports.adjustStock = async (req, res) => {
  try {
    const sellerId = req.user.userId;
    const rawAdjustments = Array.isArray(req.body.adjustments) ? req.body.adjustments : [req.body];

    const adjustments = rawAdjustments
      .map((entry = {}) => ({
        productId: entry.productId,
        variantId: entry.variantId,
        newStock: entry.newStock,
        reason: entry.reason
      }))
      .filter((entry) => entry.productId && entry.variantId);

    if (adjustments.length === 0) {
      return error(res, "No valid stock adjustments provided", 400);
    }

    for (const entry of adjustments) {
      if (!isValidObjectId(entry.productId)) return error(res, "Invalid product id", 400);
      if (!isValidObjectId(entry.variantId)) return error(res, "Invalid variant id", 400);

      const parsed = parseStockInt(entry.newStock);
      if (parsed === null) return error(res, "Invalid stock value", 400);
      if (parsed < 0) return error(res, "Stock cannot be negative", 400);
      entry.newStock = parsed;
    }

    const productIds = [...new Set(adjustments.map((a) => String(a.productId)))];
    const products = await Product.find({
      _id: { $in: productIds },
      sellerId
    });

    if (products.length === 0) return error(res, "No matching products found", 404);

    const productsById = new Map(products.map((p) => [String(p._id), p]));
    const logs = [];
    const failures = [];

    // Apply all adjustments in-memory first, then save each product once.
    for (const entry of adjustments) {
      const product = productsById.get(String(entry.productId));
      if (!product) {
        failures.push({ productId: entry.productId, variantId: entry.variantId, message: "Product not found" });
        continue;
      }

      const variant = product.variants.id(entry.variantId);
      if (!variant) {
        failures.push({ productId: entry.productId, variantId: entry.variantId, message: "Variant not found" });
        continue;
      }

      const previousStock = Number(variant.stock) || 0;
      const variantIndex = product.variants.findIndex(v => String(v._id) === String(entry.variantId));

      try {
        if (isSerializedVariant(product, variant)) {
          setSerializedVariantStock({
            product,
            variant,
            desiredStock: entry.newStock,
            variantIndex
          });
        } else {
          variant.stock = entry.newStock;
        }
      } catch (err) {
        failures.push({ productId: entry.productId, variantId: entry.variantId, message: err.message || "Failed to adjust stock" });
        continue;
      }

      logs.push({
        productId: product._id,
        variantId: variant._id,
        changeType: "adjustment",
        previousStock,
        newStock: Number(variant.stock) || 0,
        change: (Number(variant.stock) || 0) - previousStock,
        reason: entry.reason || "Manual adjustment by Seller",
        sellerId
      });

      // Low stock alert (best-effort, de-duped).
      await notifySellerLowStock({
        sellerId,
        productId: product._id,
        variantId: variant._id,
        productName: product.name,
        variantName: variant.name,
        currentStock: Number(variant.stock) || 0,
        threshold: DEFAULT_LOW_STOCK_THRESHOLD
      });
    }

    // Save all touched products.
    const touchedIds = new Set(logs.map((l) => String(l.productId)));
    for (const product of products) {
      if (!touchedIds.has(String(product._id))) continue;
      await product.save();
    }

    if (logs.length > 0) {
      await StockLog.insertMany(logs);
    }

    const message = failures.length > 0
      ? `Stock adjusted with ${failures.length} issue(s)`
      : "Stock adjusted successfully";

    return success(res, {
      updated: logs.length,
      failures
    }, message);
  } catch (err) { return error(res, err.message); }
};

exports.getStockHistory = async (req, res) => {
  try {
    const {
      productId,
      variantId,
      changeType,
      actorType,
      search,
      startDate,
      endDate,
      page = 1,
      limit = 500
    } = req.query;

    const currentPage = parsePositiveInt(page, 1);
    const pageLimit = Math.min(parsePositiveInt(limit, 500), 1000);
    const productQuery = { sellerId: req.user.userId };
    if (productId) {
      if (!isValidObjectId(productId)) return error(res, "Invalid product id", 400);
      productQuery._id = productId;
    }

    const productsAll = await Product.find(productQuery).select("_id name");
    const productIdsAll = productsAll.map(p => p._id);
    if (productIdsAll.length === 0) {
      return success(res, {
        logs: [],
        pagination: { total: 0, page: currentPage, limit: pageLimit, pages: 1 }
      }, "Stock history retrieved");
    }

    const query = { productId: { $in: productIdsAll } };
    if (variantId) {
      if (!isValidObjectId(variantId)) return error(res, "Invalid variant id", 400);
      query.variantId = variantId;
    }
    if (changeType) query.changeType = changeType;

    if (actorType === "admin") query.adminId = { $exists: true, $ne: null };
    if (actorType === "seller") query.sellerId = { $exists: true, $ne: null };
    if (actorType === "user") query.userId = { $exists: true, $ne: null };

    if (search) {
      const escaped = toRegex(search);
      const byName = productsAll
        .filter((p) => new RegExp(escaped, "i").test(String(p.name || "")))
        .map((p) => p._id);

      query.$or = [
        { reason: { $regex: escaped, $options: "i" } },
        { productId: { $in: byName } }
      ];
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const total = await StockLog.countDocuments(query);

    const logs = await StockLog.find(query)
      .populate("productId", "name images variants sellerId")
      .populate({ path: "productId", populate: { path: "sellerId", select: "fullName shopName" } })
      .populate("adminId", "name")
      .populate("sellerId", "fullName shopName")
      .populate("userId", "name")
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * pageLimit)
      .limit(pageLimit);

    return success(res, {
      logs,
      pagination: {
        total,
        page: currentPage,
        limit: pageLimit,
        pages: Math.ceil(total / pageLimit) || 1
      }
    }, "Stock history retrieved");
  } catch (err) { return error(res, err.message); }
};

exports.getLowStockAlerts = async (req, res) => {
  try {
    const {
      threshold = 5,
      search,
      category,
      sortBy = "currentStock",
      sortOrder = "asc",
      page = 1,
      limit = 500
    } = req.query;

    const currentPage = parsePositiveInt(page, 1);
    const pageLimit = Math.min(parsePositiveInt(limit, 500), 1000);
    const lowStockThreshold = parsePositiveInt(threshold, 5);

    const productMatch = { sellerId: new mongoose.Types.ObjectId(req.user.userId) };
    if (search) productMatch.name = { $regex: toRegex(search), $options: "i" };
    if (category) {
      if (!mongoose.Types.ObjectId.isValid(category)) {
        return error(res, "Invalid category id", 400);
      }
      productMatch.categories = new mongoose.Types.ObjectId(category);
    }

    const sortableFields = new Set(["currentStock", "productName", "variantName"]);
    const safeSortBy = sortableFields.has(sortBy) ? sortBy : "currentStock";
    const safeSortOrder = String(sortOrder).toLowerCase() === "desc" ? -1 : 1;

    const basePipeline = [
      { $match: productMatch },
      { $unwind: "$variants" },
      { $match: { "variants.stock": { $lte: lowStockThreshold } } },
      {
        $lookup: {
          from: "categories",
          localField: "categories",
          foreignField: "_id",
          as: "categoryDocs"
        }
      },
      {
        $project: {
          _id: 0,
          productId: "$_id",
          productName: "$name",
          productImage: {
            $ifNull: [
              { $arrayElemAt: ["$variants.variantImages", 0] },
              { $ifNull: [{ $arrayElemAt: ["$images", 0] }, ""] }
            ]
          },
          categoryName: {
            $ifNull: [{ $arrayElemAt: ["$categoryDocs.name", 0] }, "Uncategorized"]
          },
          variantId: "$variants._id",
          variantName: "$variants.name",
          currentStock: "$variants.stock",
          threshold: { $literal: lowStockThreshold }
        }
      }
    ];

    const countResult = await Product.aggregate([
      ...basePipeline,
      { $count: "total" }
    ]);
    const total = countResult[0]?.total || 0;

    const alerts = await Product.aggregate([
      ...basePipeline,
      { $sort: { [safeSortBy]: safeSortOrder, productName: 1 } },
      { $skip: (currentPage - 1) * pageLimit },
      { $limit: pageLimit }
    ]);

    return success(res, {
      alerts,
      pagination: {
        total,
        page: currentPage,
        limit: pageLimit,
        pages: Math.ceil(total / pageLimit) || 1
      }
    }, "Low stock alerts retrieved");
  } catch (err) { return error(res, err.message); }
};

exports.serializeStock = async (req, res) => {
  try {
    const { productId, variantId, productCodes } = req.body;
    const sellerId = req.user.userId;

    if (!Array.isArray(productCodes) || productCodes.length === 0) {
      return error(res, "Missing serial codes", 400);
    }

    const product = await Product.findOne({ _id: productId, sellerId });
    if (!product) return error(res, "Product not found", 404);

    const variant = product.variants.id(variantId);
    if (!variant) return error(res, "Variant not found", 404);

    if (variant.stock < productCodes.length) {
      return error(res, "Insufficient stock to serialize", 400);
    }

    // Capture original properties
    const originalStock = variant.stock;
    
    // Create new products based on the original template
    const productsToCreate = [];
    for (const code of productCodes) {
      const pData = product.toObject();
      delete pData._id;
      delete pData.__v;
      delete pData.createdAt;
      delete pData.updatedAt;
      
      const newProduct = {
        ...pData,
        name: `${product.name} - ${code}`,
        slug: `${product.slug}-${code}-${Math.floor(1000 + Math.random() * 9000)}`,
        productCode: code,
        sku: code,
        status: "Active",
        active: true,
        variants: pData.variants.map(v => ({
           ...v,
           _id: undefined, 
           stock: v._id.toString() === variantId.toString() ? 1 : 0
        }))
      };
      productsToCreate.push(newProduct);
    }

    const createResult = await Product.insertMany(productsToCreate);

    // Update original product stock
    variant.stock -= productCodes.length;
    await product.save();

    // Log the reduction on original
    await StockLog.create({
      productId,
      variantId,
      changeType: "adjustment",
      previousStock: originalStock,
      newStock: variant.stock,
      change: -productCodes.length,
      reason: "Converted items to individual serialized listings",
      sellerId
    });

    // Logs for new products
    const newStockLogs = [];
    createResult.forEach(p => {
       const v = p.variants.find(nv => nv.stock === 1);
       if(v) {
         newStockLogs.push({
           productId: p._id,
           variantId: v._id,
           changeType: "purchase",
           previousStock: 0,
           newStock: 1,
           change: 1,
           reason: "Individual item created from stock serialization",
           sellerId
         });
       }
    });
    if (newStockLogs.length > 0) {
      await StockLog.insertMany(newStockLogs);
    }

    return success(res, { newProducts: createResult }, `Successfully converted ${productCodes.length} items to serialized listings.`, 201);
  } catch (err) {
    return error(res, err.message);
  }
};
