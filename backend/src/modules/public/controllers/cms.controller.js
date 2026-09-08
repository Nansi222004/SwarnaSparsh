const Blog = require("../../../models/Blog");
const FAQ = require("../../../models/FAQ");
const Banner = require("../../../models/Banner");
const HomepageSection = require("../../../models/HomepageSection");
const { success, error } = require("../../../utils/apiResponse");
const { normalizeProductForResponse } = require("../../../utils/productCompatibility");

const getActiveBannerQuery = (now = new Date()) => ({
  isActive: true,
  $and: [
    {
      $or: [
        { validFrom: { $exists: false } },
        { validFrom: null },
        { validFrom: { $lte: now } },
      ],
    },
    {
      $or: [
        { validUntil: { $exists: false } },
        { validUntil: null },
        { validUntil: { $gte: now } },
      ],
    },
  ],
});

exports.getBanners = async (req, res) => {
  try {
    const banners = await Banner.find(getActiveBannerQuery()).sort({ sortOrder: 1, createdAt: -1 });
    return success(res, { banners });
  } catch (err) { return error(res, err.message); }
};

exports.getBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ isPublished: true }).sort({ publishedAt: -1, createdAt: -1 });
    return success(res, { blogs });
  } catch (err) { return error(res, err.message); }
};

exports.getBlogDetail = async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug, isPublished: true });
    if (!blog) return error(res, "Blog not found", 404);
    return success(res, { blog });
  } catch (err) { return error(res, err.message); }
};

exports.getFAQs = async (req, res) => {
  try {
    const faqs = await FAQ.find({ isActive: true }).sort({ category: 1, sortOrder: 1 });
    return success(res, { faqs });
  } catch (err) { return error(res, err.message); }
};

exports.getHomepageData = async (req, res) => {
  try {
    const banners = await Banner.find(getActiveBannerQuery()).sort({ sortOrder: 1, createdAt: -1 });
    const sections = await HomepageSection.find({
      isActive: true,
      $or: [
        { pageKey: "home" },
        { pageKey: { $exists: false } },
        { pageKey: null }
      ]
    })
      .populate({
        path: "items.productId",
        select: "name slug productCode brand images variants rating tags status active weight weightUnit",
        match: { status: "Active", active: { $ne: false } }
      })
      .sort({ sortOrder: 1, createdAt: 1 });

    const normalized = sections.map((section) => {
      const raw = section.toObject();
      const items = (raw.items || []).filter((item) => {
        if (item.productId) return Boolean(item.productId);
        return true;
      }).map((item) => (
        item.productId
          ? { ...item, productId: normalizeProductForResponse(item.productId) }
          : item
      ));
      return { ...raw, items };
    });

    return success(res, { banners, sections: normalized });
  } catch (err) { return error(res, err.message); }
};

exports.getPageData = async (req, res) => {
  try {
    const requestedPageKey = String(req.params.pageKey || "").trim();
    const allowedPageKeys = new Set(["home", "shop-men", "shop-women", "shop-family", "gold-collection"]);

    if (!allowedPageKeys.has(requestedPageKey)) {
      return error(res, "Invalid page key", 400);
    }

    const query = requestedPageKey === "home"
      ? {
          isActive: true,
          $or: [
            { pageKey: "home" },
            { pageKey: { $exists: false } },
            { pageKey: null }
          ]
        }
      : {
          isActive: true,
          pageKey: requestedPageKey
        };

    const sections = await HomepageSection.find(query)
      .populate({
        path: "items.productId",
        select: "name slug productCode brand images variants rating tags status active weight weightUnit",
        match: { status: "Active", active: { $ne: false } }
      })
      .sort({ sortOrder: 1, createdAt: 1 });

    const normalized = sections.map((section) => {
      const raw = section.toObject();
      const items = (raw.items || []).filter((item) => {
        if (item.productId) return Boolean(item.productId);
        return true;
      }).map((item) => (
        item.productId
          ? { ...item, productId: normalizeProductForResponse(item.productId) }
          : item
      ));
      return { ...raw, items };
    });

    return success(res, { pageKey: requestedPageKey, sections: normalized });
  } catch (err) {
    return error(res, err.message);
  }
};
