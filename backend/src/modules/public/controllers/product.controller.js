const Product = require("../../../models/Product");
const Category = require("../../../models/Category");
const mongoose = require("mongoose");
const { success, error } = require("../../../utils/apiResponse");
const { normalizeProductForResponse } = require("../../../utils/productCompatibility");
const {
  buildSearchMongoFilter,
  scoreProductRelevance,
  normalizeTerm
} = require("../../../utils/searchHelper");

const getApprovedSellerScope = async () => ({
  $or: [{ sellerId: null }, { sellerId: { $exists: false } }]
});

const clampInt = (value, fallback, { min, max } = {}) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  const n = Number.isFinite(parsed) ? parsed : fallback;
  const withMin = typeof min === "number" ? Math.max(min, n) : n;
  return typeof max === "number" ? Math.min(max, withMin) : withMin;
};

const normalizeGoldKarat = (value) => {
  const digits = String(value || "").replace(/[^0-9]/g, "");
  return digits || "";
};

const normalizeSilverTier = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return "";
  if (normalized === "sterling" || normalized === "925" || normalized.includes("sterling")) return "sterling";
  if (normalized === "fine" || normalized.includes("fine")) return "fine";
  return "";
};

/**
 * GET /api/products
 * Query Params:
 * - search
 * - category (id/slug/name)
 * - metal (matches Product.material)
 * - karat (gold purity: 14/18/22/24)
 * - silver_type (fine|sterling)
 * - price_min/price_max (aliases for minPrice/maxPrice)
 * - minPrice/maxPrice
 * - audience (men,women,family,unisex)
 * - tags (isTrending,isNewArrival,...)
 * - sort (priceLtoH,priceHtoL,rating,newest,latest,most-sold,random)
 * - page, limit
 */
exports.getProducts = async (req, res) => {
  try {
    const { 
      search,
      category,
      metal,
      tone,
      settingMetal,
      karat,
      silver_type,
      purity,
      stone,
      audience,
      diamondType,
      tags,
      sort,
      availability,
      inStockOnly,
      page = 1,
      limit = 20
    } = req.query;

    const query = { status: "Active", active: { $ne: false } };
    const andFilters = [await getApprovedSellerScope()];

    const effectiveMinPrice = req.query.minPrice ?? req.query.price_min ?? req.query.priceMin ?? null;
    const effectiveMaxPrice = req.query.maxPrice ?? req.query.price_max ?? req.query.priceMax ?? null;

    const cleanSearch = String(search || "").trim();
    const resolvedPage = clampInt(page, 1, { min: 1, max: 100000 });
    const resolvedLimit = clampInt(limit, 20, { min: 1, max: 60 });

    // 1. Text Search across name, category, material, settingMetal, tags, description
    if (cleanSearch) {
      const searchMongoFilter = buildSearchMongoFilter(cleanSearch);
      if (searchMongoFilter) {
        andFilters.push(searchMongoFilter);
      }
    }

    // 2. Category Filter
    if (category) {
      let categoryId = category;
      if (!mongoose.isValidObjectId(category)) {
        const resolved = await Category.findOne({
          $or: [{ slug: category }, { name: new RegExp(`^${category}$`, "i") }],
          isActive: true
        }).select("_id");
        categoryId = resolved?._id || new mongoose.Types.ObjectId("000000000000000000000000");
      }
      query.categories = categoryId;
    }

    // 3. Price Range Filter (matches any variant price)
    if (effectiveMinPrice || effectiveMaxPrice) {
      query["variants.price"] = {};
      if (effectiveMinPrice) query["variants.price"].$gte = Number(effectiveMinPrice);
      if (effectiveMaxPrice) query["variants.price"].$lte = Number(effectiveMaxPrice);
    }

    // Exclude unrelated categories (e.g. bags, clutches, potlis) unless explicitly searched for
    const isBagExplicitlySearched = cleanSearch && /\b(bag|clutch|potli|sling)\b/i.test(cleanSearch);
    if (!isBagExplicitlySearched) {
      const excludedCategorySlugs = ["hand-bags", "clutches", "potli-bag", "sling-bag"];
      andFilters.push({
        categorySlug: { $nin: excludedCategorySlugs },
        category: { $not: { $regex: "\\b(bag|clutch|potli|sling)\\b", $options: "i" } },
        name: { $not: { $regex: "\\b(bag|clutch|potli|sling)\\b", $options: "i" } }
      });
    }

    // When NOT searching, exclude oxidised imitation items if desired.
    // When a search query is active, DO NOT block valid silver-plated / oxidised jewellery products!
    if (!cleanSearch) {
      andFilters.push({
        material: { $not: { $regex: "oxidi|oxydis", $options: "i" } },
        name: { $not: { $regex: "oxidi|oxydis", $options: "i" } }
      });
    }

    // Exclude Mala Set products from general All Jewellery storefront results
    // They remain active in MongoDB and accessible if category=malas or search=mala is specifically requested
    const isMalaExplicitlyRequested = Boolean(
      (category && /^(malas?|mala-set)$/i.test(String(category).trim())) ||
      (cleanSearch && /\bmala\b/i.test(cleanSearch))
    );
    const isChokerOrNecklaceSearch = cleanSearch && /\b(choker|chokar|necklace)\b/i.test(cleanSearch);

    if (!isMalaExplicitlyRequested) {
      if (isChokerOrNecklaceSearch) {
        // Allow choker necklaces with beads/moti mala in name, but exclude standalone mala sets
        andFilters.push({
          categorySlug: { $ne: "malas" },
          category: { $not: { $regex: "^malas?$", $options: "i" } },
          name: { $not: { $regex: "\\bmala\\s*set\\b", $options: "i" } }
        });
      } else {
        andFilters.push({
          categorySlug: { $ne: "malas" },
          category: { $not: { $regex: "^malas?$", $options: "i" } },
          name: { $not: { $regex: "\\bmala(\\s*set)?\\b", $options: "i" } }
        });
      }
    }

    // 3.1 Metal + purity filters
    // Backwards-compat: older links may pass karat/silver_type without metal.
    // In that case, infer metal from the purity param to avoid silently returning all products.
    const effectivePurity = purity || karat || silver_type;
    const inferredMetal = !metal
      ? (karat ? "gold" : (silver_type ? "silver" : ""))
      : "";

    const effectiveMetal = metal || inferredMetal;
    if (effectiveMetal) {
      const normalized = String(effectiveMetal || "").trim().toLowerCase();

      if (normalized === "diamond") {
        andFilters.push({
          $and: [
            {
              $or: [
                { diamondType: { $in: ["lab_grown", "natural"] } },
                { "variants.diamondType": { $in: ["lab_grown", "natural"] } },
                { "variants.diamondPrice": { $gt: 0 } },
                { material: { $regex: "\\bdiamond\\b", $options: "i" } },
                { name: { $regex: "\\bdiamond\\b", $options: "i" } }
              ]
            },
            { material: { $not: { $regex: "plated|alloy|imitation|antique finish", $options: "i" } } },
            { name: { $not: { $regex: "plated|alloy|imitation|oxydis|oxidi", $options: "i" } } }
          ]
        });

        if (effectivePurity) {
          andFilters.push({
            $or: [
              { settingPurity: { $regex: effectivePurity, $options: "i" } },
              { purity: { $regex: effectivePurity, $options: "i" } }
            ]
          });
        }
      } else if (normalized === "gold") {
        andFilters.push({
          $and: [
            {
              $or: [
                { material: { $in: ["Gold", "14K Gold", "18K Gold", "22K Gold", "24K Gold", "Solid Gold", "Yellow Gold", "White Gold", "Rose Gold"] } },
                { goldCategory: { $in: ["14", "18", "22", "24"] } },
                { settingMetal: { $in: ["Gold", "White Gold", "Rose Gold"] } }
              ]
            },
            { material: { $not: { $regex: "plated|alloy|imitation|antique finish", $options: "i" } } },
            { name: { $not: { $regex: "plated|alloy|imitation|oxydis|oxidi", $options: "i" } } },
            { name: { $not: { $regex: "\\bdiamond\\b", $options: "i" } } },
            { diamondType: { $nin: ["lab_grown", "natural"] } }
          ]
        });

        // Specific Gold Tone filter (White Gold, Rose Gold, Gold)
        const effectiveTone = String(tone || settingMetal || "").trim().toLowerCase();
        if (effectiveTone === "white-gold" || effectiveTone === "white" || effectiveTone === "white gold") {
          andFilters.push({
            $or: [
              { settingMetal: { $regex: "white[\\s-]*gold", $options: "i" } },
              { material: { $regex: "white[\\s-]*gold", $options: "i" } }
            ]
          });
        } else if (effectiveTone === "rose-gold" || effectiveTone === "rose" || effectiveTone === "rose gold") {
          andFilters.push({
            $or: [
              { settingMetal: { $regex: "rose[\\s-]*gold", $options: "i" } },
              { material: { $regex: "rose[\\s-]*gold", $options: "i" } }
            ]
          });
        } else if (effectiveTone === "gold" || effectiveTone === "yellow-gold" || effectiveTone === "yellow" || effectiveTone === "yellow gold") {
          andFilters.push({
            $and: [
              {
                $or: [
                  { settingMetal: { $regex: "^(gold|yellow[\\s-]*gold)$", $options: "i" } },
                  { material: { $regex: "^(gold|yellow[\\s-]*gold|22k[\\s-]*gold|18k[\\s-]*gold|24k[\\s-]*gold|14k[\\s-]*gold|solid[\\s-]*gold)$", $options: "i" } },
                  { goldCategory: { $in: ["14", "18", "22", "24"] } }
                ]
              },
              { settingMetal: { $not: { $regex: "white|rose", $options: "i" } } },
              { material: { $not: { $regex: "white[\\s-]*gold|rose[\\s-]*gold", $options: "i" } } }
            ]
          });
        }

        const normalizedKarat = normalizeGoldKarat(effectivePurity);
        if (normalizedKarat) {
          andFilters.push({
            $or: [
              { goldCategory: String(normalizedKarat) },
              { settingPurity: { $regex: String(normalizedKarat), $options: "i" } },
              { name: { $regex: `\\b${normalizedKarat}\\s*k\\b`, $options: "i" } }
            ]
          });
        }
      } else if (normalized === "silver") {
        andFilters.push({
          $and: [
            {
              $or: [
                { material: { $in: ["Silver", "925 Silver", "Sterling Silver", "Fine Silver", "925 sterling silver"] } },
                { silverCategory: { $in: ["800", "835", "925", "925 sterling silver", "958", "970", "990", "999", "fine", "sterling"] } },
                { settingMetal: "Silver" }
              ]
            },
            { material: { $not: { $regex: "plated|alloy|imitation|antique finish", $options: "i" } } },
            { name: { $not: { $regex: "plated|alloy|imitation|oxydis|oxidi", $options: "i" } } },
            { name: { $not: { $regex: "\\bdiamond\\b", $options: "i" } } }
          ]
        });

        const tier = normalizeSilverTier(effectivePurity);
        if (tier === "sterling" || effectivePurity === "925") {
          andFilters.push({
            $or: [
              { silverCategory: { $in: ["925", "925 sterling silver", "sterling", "Sterling", "925 Sterling Silver"] } },
              { material: { $in: ["925 Silver", "Sterling Silver", "925 sterling silver"] } },
              { silverCategory: { $regex: "^925", $options: "i" } }
            ]
          });
        } else if (tier === "fine" || effectivePurity === "999") {
          andFilters.push({
            $or: [
              { silverCategory: { $in: ["999", "fine", "958", "970", "990"] } },
              { name: { $regex: "999|fine\\s*silver", $options: "i" } }
            ]
          });
        } else if (effectivePurity === "800") {
          andFilters.push({
            $or: [
              { silverCategory: { $in: ["800", "835"] } },
              { name: { $regex: "\\b800\\b", $options: "i" } }
            ]
          });
        }
      }
    } else if (effectivePurity) {
      // General purity filter when metal is not strictly filtered
      const digits = normalizeGoldKarat(effectivePurity);
      if (digits) {
        query.goldCategory = String(digits);
      } else if (effectivePurity === "925" || normalizeSilverTier(effectivePurity) === "sterling") {
        query.silverCategory = { $regex: "925", $options: "i" };
      }
    }

    // 3.2 Audience scope (men/women/family/unisex). Include unisex by default.
    if (audience) {
      const requested = String(audience || "")
        .split(",")
        .map((v) => String(v || "").trim().toLowerCase())
        .filter(Boolean);
      if (requested.length > 0) {
        // If requesting men/women, include unisex too (matches frontend logic).
        const expanded = new Set(requested);
        expanded.add("unisex");
        query.audience = { $in: Array.from(expanded) };
      }
    }

    // 3.3 Stone / Diamond Type Filter
    const effectiveStone = stone || diamondType;
    if (effectiveStone && effectiveStone !== "All" && effectiveStone !== "all") {
      const requested = String(effectiveStone).trim().toLowerCase();
      if (requested === "none") {
        andFilters.push({
          diamondType: { $in: ["none", null, ""] },
          "variants.diamondType": { $in: ["none", null, ""] },
          name: { $not: { $regex: "\\bAD\\b|american\\s*diamond|\\bdiamond\\b|\\bpearl\\b|\\bmoti\\b|\\bkundan\\b", $options: "i" } }
        });
      } else if (requested === "ad") {
        andFilters.push({
          $or: [
            { name: { $regex: "\\bAD\\b|american\\s*diamond", $options: "i" } },
            { description: { $regex: "\\bAD\\b|american\\s*diamond", $options: "i" } }
          ]
        });
      } else if (requested === "natural") {
        andFilters.push({
          $or: [
            { diamondType: "natural" },
            { "variants.diamondType": "natural" }
          ]
        });
      } else if (requested === "lab_grown") {
        andFilters.push({
          $or: [
            { diamondType: "lab_grown" },
            { "variants.diamondType": "lab_grown" }
          ]
        });
      } else if (requested === "pearl_kundan") {
        andFilters.push({
          $or: [
            { material: "Kundan & Pearls" },
            { name: { $regex: "pearl|moti|kundan|emerald|ruby", $options: "i" } }
          ]
        });
      }
    }

    // 4. Tags Filter (e.g. tags=isTrending,isNewArrival)
    if (tags) {
      const tagList = tags.split(",");
      tagList.forEach(t => {
        if (["isNewArrival", "isMostGifted", "isNewLaunch", "isTrending", "isPremium"].includes(t)) {
          query[`tags.${t}`] = true;
        }
      });
    }

    // 5. Availability Filter
    if (availability === "in_stock" || (!availability && String(inStockOnly).toLowerCase() === "true")) {
      query["variants.stock"] = { $gt: 0 };
    } else if (availability === "out_of_stock") {
      query["variants.stock"] = { $lte: 0 };
    }
    // Note: availability === "all" applies no stock constraint

    // 5. Sorting
    let sortOption = { createdAt: -1 }; // Default: Newest
    if (sort) {
      switch (sort) {
        case "price-asc": sortOption = { "variants.0.price": 1 }; break;   // legacy frontend links
        case "price-desc": sortOption = { "variants.0.price": -1 }; break; // legacy frontend links
        case "priceLtoH": sortOption = { "variants.0.price": 1 }; break;
        case "priceHtoL": sortOption = { "variants.0.price": -1 }; break;
        case "rating":    sortOption = { rating: -1 }; break;
        case "newest":    sortOption = { createdAt: -1 }; break;
        case "latest":    sortOption = { createdAt: -1 }; break;
        case "discount":  sortOption = { "variants.discount": -1, createdAt: -1 }; break;
        case "most-sold": sortOption = { sold: -1, createdAt: -1 }; break;
        case "random":    sortOption = null; break;
      }
    }

    if (andFilters.length) {
      query.$and = andFilters;
    }

    const selectFields = "name slug productCode brand images videoUrl variants tags rating reviewCount categories category categorySlug categoryId navShopByCategory weight weightUnit goldCategory silverCategory material settingMetal settingPurity diamondType audience sold createdAt updatedAt description";

    let products = [];
    let total = 0;

    if (cleanSearch) {
      // 6a. Search Mode: Retrieve candidates matching Mongo filter, score them for relevance, and sort
      const candidates = await Product.find(query)
        .select(selectFields)
        .populate("categories", "name slug")
        .lean();

      // Score candidates and remove non-relevant (score === 0)
      const scoredCandidates = candidates
        .map((p) => {
          const relevanceScore = scoreProductRelevance(p, cleanSearch);
          return { product: p, relevanceScore };
        })
        .filter((item) => item.relevanceScore > 0);

      // Helper to compute effective display/min price
      const getMinPrice = (p) => {
        if (Array.isArray(p.variants) && p.variants.length > 0) {
          const prices = p.variants.map((v) => Number(v.price || 0)).filter((pr) => pr > 0);
          if (prices.length > 0) return Math.min(...prices);
        }
        return Number(p.price || 0);
      };

      // Apply Sort:
      // If user specified an explicit sort (e.g. priceLtoH, priceHtoL), respect it.
      // Otherwise, default to relevance-based ranking (highest relevance score first).
      if (sort === "priceLtoH" || sort === "price-asc") {
        scoredCandidates.sort((a, b) => getMinPrice(a.product) - getMinPrice(b.product));
      } else if (sort === "priceHtoL" || sort === "price-desc") {
        scoredCandidates.sort((a, b) => getMinPrice(b.product) - getMinPrice(a.product));
      } else if (sort === "rating") {
        scoredCandidates.sort((a, b) => (Number(b.product.rating) || 0) - (Number(a.product.rating) || 0));
      } else if (sort === "most-sold") {
        scoredCandidates.sort((a, b) => (Number(b.product.sold) || 0) - (Number(a.product.sold) || 0));
      } else if (sort === "discount") {
        scoredCandidates.sort((a, b) => {
          const discA = Number(a.product.variants?.[0]?.discount || 0);
          const discB = Number(b.product.variants?.[0]?.discount || 0);
          return discB - discA;
        });
      } else {
        // Default search ranking: Highest relevance score first, tie-break by newest
        scoredCandidates.sort((a, b) => {
          if (b.relevanceScore !== a.relevanceScore) {
            return b.relevanceScore - a.relevanceScore;
          }
          return new Date(b.product.createdAt || 0) - new Date(a.product.createdAt || 0);
        });
      }

      total = scoredCandidates.length;
      products = scoredCandidates
        .slice((resolvedPage - 1) * resolvedLimit, resolvedPage * resolvedLimit)
        .map((item) => item.product);
    } else {
      // 6b. Standard Catalogue Browsing: Database-level pagination & sort
      if (sortOption) {
        products = await Product.find(query)
          .select(selectFields)
          .populate("categories", "name slug")
          .sort(sortOption)
          .limit(resolvedLimit)
          .skip((resolvedPage - 1) * resolvedLimit)
          .lean();
      } else {
        products = await Product.aggregate([
          { $match: query },
          { $sample: { size: resolvedLimit } },
        ]);
      }
      total = await Product.countDocuments(query);
    }

    const isDiamondOriginFilter = effectiveStone === "natural" || effectiveStone === "lab_grown";

    const normalizedProducts = products.map((product) => {
      const normalized = normalizeProductForResponse(product);
      if (isDiamondOriginFilter) {
        const targetOrigin = effectiveStone;
        if (Array.isArray(normalized.variants) && normalized.variants.length > 0) {
          const matchingVariants = normalized.variants.filter((v) => {
            const vType = String(v?.diamondType || "").trim().toLowerCase();
            if (vType === targetOrigin) return true;
            if (!vType || vType === "none") {
              return String(product?.diamondType || "").trim().toLowerCase() === targetOrigin;
            }
            return false;
          });
          if (matchingVariants.length > 0) {
            normalized.variants = matchingVariants;
          }
        }
      }
      return normalized;
    });

    return success(res, {
      products: normalizedProducts,
      pagination: {
        total,
        page: Number(resolvedPage),
        limit: Number(resolvedLimit),
        pages: Math.ceil(total / resolvedLimit)
      }
    }, "Products retrieved successfully");

  } catch (err) { return error(res, err.message); }
};

/**
 * GET /api/products/:slug
 * Supports slug or ObjectId.
 */
exports.getProductDetail = async (req, res) => {
  try {
    const identifier = req.params.slug;
    const baseQuery = { status: "Active", active: { $ne: false } };
    const inStockOnly = String(req.query?.inStockOnly || "false").toLowerCase() === "true";
    const lookup = mongoose.isValidObjectId(identifier)
      ? { ...baseQuery, _id: identifier }
      : { ...baseQuery, slug: identifier };

    const product = await Product.findOne(lookup)
      .populate("categories", "name slug")
      .lean();

    if (!product) return error(res, "Product not found", 404);

    if (inStockOnly) {
      const hasStock = (product.variants || []).some((variant) => Number(variant?.stock || 0) > 0);
      if (!hasStock) return error(res, "Product not found", 404);
    }

    return success(res, { product: normalizeProductForResponse(product) }, "Product details retrieved");
  } catch (err) { return error(res, err.message); }
};

/**
 * GET /api/public/products/by-ids?ids=a,b,c&inStockOnly=false
 * Returns products in the same order as requested ids (when possible).
 * Use this for pinned CMS sections so they don't disappear due to catalogue paging.
 */
exports.getProductsByIds = async (req, res) => {
  try {
    const idsParam = String(req.query?.ids || "").trim();
    if (!idsParam) return success(res, { products: [] });

    const ids = idsParam
      .split(",")
      .map((id) => String(id || "").trim())
      .filter((id) => mongoose.isValidObjectId(id));

    if (ids.length === 0) return success(res, { products: [] });

    const approvedScope = await getApprovedSellerScope();
    const query = {
      status: "Active",
      active: { $ne: false },
      _id: { $in: ids },
      ...approvedScope
    };

    const inStockOnly = String(req.query?.inStockOnly || "false").toLowerCase() === "true";
    if (inStockOnly) {
      query["variants.stock"] = { $gt: 0 };
    }

    const found = await Product.find(query)
      .select("name slug productCode brand images videoUrl variants tags rating reviewCount categories category categorySlug categoryId navShopByCategory weight weightUnit goldCategory silverCategory material audience")
      .populate("categories", "name slug")
      .lean();

    const foundMap = new Map(found.map((p) => [String(p._id), p]));
    const ordered = ids.map((id) => foundMap.get(String(id))).filter(Boolean);

    return success(res, {
      products: ordered.map((product) => normalizeProductForResponse(product))
    });
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * GET /api/public/products/search
 * Returns relevance-ranked product suggestions for header autocomplete.
 */
exports.searchProducts = async (req, res) => {
  try {
    const rawQ = req.query.q || req.query.search || "";
    const cleanSearch = String(rawQ).trim();
    if (!cleanSearch) return success(res, { suggestions: [] });

    const approvedSellerScope = await getApprovedSellerScope();
    const searchFilter = buildSearchMongoFilter(cleanSearch);
    if (!searchFilter) return success(res, { suggestions: [] });

    const query = {
      status: "Active",
      active: { $ne: false },
      ...approvedSellerScope,
      $and: [searchFilter]
    };

    // Exclude bags unless explicitly searched
    if (!/\b(bag|clutch|potli|sling)\b/i.test(cleanSearch)) {
      query.$and.push({
        categorySlug: { $nin: ["hand-bags", "clutches", "potli-bag", "sling-bag"] },
        name: { $not: { $regex: "\\b(bag|clutch|potli|sling)\\b", $options: "i" } }
      });
    }

    // Exclude malas unless explicitly searched
    const isMalaExplicit = /\bmala\b/i.test(cleanSearch);
    const isChokerOrNecklace = /\b(choker|chokar|necklace)\b/i.test(cleanSearch);
    if (!isMalaExplicit) {
      if (isChokerOrNecklace) {
        query.$and.push({
          categorySlug: { $ne: "malas" },
          name: { $not: { $regex: "\\bmala\\s*set\\b", $options: "i" } }
        });
      } else {
        query.$and.push({
          categorySlug: { $ne: "malas" },
          name: { $not: { $regex: "\\bmala(\\s*set)?\\b", $options: "i" } }
        });
      }
    }

    const candidates = await Product.find(query)
      .select("name slug brand images variants tags rating reviewCount categories category categorySlug material settingMetal settingPurity diamondType goldCategory silverCategory description")
      .populate("categories", "name slug")
      .lean();

    const scored = candidates
      .map((p) => {
        const score = scoreProductRelevance(p, cleanSearch);
        return { product: p, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((item) => {
        const p = item.product;
        const normalized = normalizeProductForResponse(p);
        const firstVariant = normalized.variants?.[0] || {};
        const catName =
          p.category ||
          (Array.isArray(p.categories) && p.categories[0]?.name) ||
          "";
        return {
          _id: p._id,
          id: p._id,
          name: p.name,
          slug: p.slug,
          category: catName,
          categorySlug: p.categorySlug || (Array.isArray(p.categories) && p.categories[0]?.slug) || "",
          material: p.material || "",
          images: p.images || [],
          primaryImage: p.images?.[0] || "",
          price: Number(firstVariant.price || p.price || 0),
          mrp: Number(firstVariant.mrp || p.mrp || 0),
          relevanceScore: item.score
        };
      });

    return success(res, { suggestions: scored });
  } catch (err) {
    return error(res, err.message);
  }
};
