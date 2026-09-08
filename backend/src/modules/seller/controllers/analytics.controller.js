const Order = require("../../../models/Order");
const mongoose = require("mongoose");
const { success, error } = require("../../../utils/apiResponse");

exports.getSalesTrend = async (req, res) => {
  try {
    const sellerId = req.user.userId;
    if (!mongoose.Types.ObjectId.isValid(String(sellerId || ""))) {
      return error(res, "Invalid seller id", 400);
    }
    const sellerObjectId = new mongoose.Types.ObjectId(sellerId);

    const rawDays = Number.parseInt(req.query.days, 10);
    const days = Number.isFinite(rawDays) ? Math.min(Math.max(rawDays, 1), 365) : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const trend = await Order.aggregate([
      { $match: { "items.sellerId": sellerObjectId, $or: [ { paymentStatus: "paid" }, { paymentStatus: "cod", status: "Delivered" } ], createdAt: { $gte: startDate } } },
      { $unwind: "$items" },
      { $match: { "items.sellerId": sellerObjectId } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
          salesCount: { $sum: "$items.quantity" }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    return success(res, { trend });
  } catch (err) { return error(res, err.message); }
};

exports.getProductPerformance = async (req, res) => {
  try {
    const sellerId = req.user.userId;
    if (!mongoose.Types.ObjectId.isValid(String(sellerId || ""))) {
      return error(res, "Invalid seller id", 400);
    }
    const sellerObjectId = new mongoose.Types.ObjectId(sellerId);

    const performance = await Order.aggregate([
      { $match: { "items.sellerId": sellerObjectId, $or: [ { paymentStatus: "paid" }, { paymentStatus: "cod", status: "Delivered" } ] } },
      { $unwind: "$items" },
      { $match: { "items.sellerId": sellerObjectId } },
      {
        $group: {
          _id: "$items.productId",
          totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
          totalSold: { $sum: "$items.quantity" }
        }
      },
      { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "product" } },
      { $unwind: "$product" },
      { $project: { name: "$product.name", totalRevenue: 1, totalSold: 1 } },
      { $sort: { totalSold: -1 } }
    ]);

    return success(res, { performance });
  } catch (err) { return error(res, err.message); }
};

/**
 * Get visitor engagement insights for the seller's products
 */
exports.getVisitorInsights = async (req, res) => {
  try {
    const sellerId = new mongoose.Types.ObjectId(req.user.userId);
    const AnalyticsEvent = require("../../../models/AnalyticsEvent");

    // Get all product IDs belonging to this seller
    const Product = require("../../../models/Product");
    const sellerProducts = await Product.find({ sellerId }).select("_id").lean();
    const productIds = sellerProducts.map(p => p._id);

    const insights = await AnalyticsEvent.aggregate([
      { 
        $match: { 
          type: { $in: ["product_view", "add_to_cart"] },
          "metadata.productId": { $in: productIds }
        } 
      },
      {
        $group: {
          _id: { productId: "$metadata.productId", type: "$type" },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: "$_id.productId",
          stats: {
            $push: {
              type: "$_id.type",
              count: "$count"
            }
          }
        }
      },
      { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "product" } },
      { $unwind: "$product" },
      {
        $project: {
          name: "$product.name",
          views: {
            $let: {
              vars: { viewStat: { $filter: { input: "$stats", as: "s", cond: { $eq: ["$$s.type", "product_view"] } } } },
              in: { $ifNull: [{ $arrayElemAt: ["$$viewStat.count", 0] }, 0] }
            }
          },
          carts: {
            $let: {
              vars: { cartStat: { $filter: { input: "$stats", as: "s", cond: { $eq: ["$$s.type", "add_to_cart"] } } } },
              in: { $ifNull: [{ $arrayElemAt: ["$$cartStat.count", 0] }, 0] }
            }
          }
        }
      },
      { $sort: { views: -1 } }
    ]);

    return success(res, { insights });
  } catch (err) {
    return error(res, err.message);
  }
};
