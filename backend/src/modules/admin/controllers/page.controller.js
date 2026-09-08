const Page = require("../../../models/Page");
const { success, error } = require("../../../utils/apiResponse");
const { sanitizePageHtml, getPlainTextFromHtml } = require("../../../utils/pageSanitizer");

const normalizePagePayload = (body = {}) => ({
  slug: String(body.slug || "").trim().toLowerCase(),
  title: String(body.title || "").trim(),
  content: sanitizePageHtml(body.content || ""),
});

const { defaultPages } = require("../../../utils/defaultPages");

// Public: Get page content by slug
exports.getPageBySlug = async (req, res) => {
  try {
    const slug = String(req.params.slug || "").trim().toLowerCase();
    let page = await Page.findOne({ slug }).lean();
    if (!page && defaultPages[slug]) {
      page = defaultPages[slug];
    }
    const safePage = page
      ? {
          ...page,
          content: sanitizePageHtml(page.content || "")
        }
      : null;
    return success(res, { page: safePage }, "Page retrieval status");
  } catch (err) {
    return error(res, err.message);
  }
};

// Admin: Get all pages
exports.getAllPages = async (req, res) => {
  try {
    const dbPages = await Page.find().sort({ title: 1 }).lean();
    const existingSlugs = new Set(dbPages.map((p) => p.slug));

    // Merge in default pages that are not yet saved in DB
    const mergedPages = [...dbPages];
    for (const [slug, defPage] of Object.entries(defaultPages)) {
      if (!existingSlugs.has(slug)) {
        mergedPages.push({
          _id: `default-${slug}`,
          slug: defPage.slug,
          title: defPage.title,
          content: defPage.content,
          lastUpdated: defPage.lastUpdated || new Date(),
          isDefault: true,
        });
      }
    }

    return success(res, { pages: mergedPages }, "Pages retrieved successfully");
  } catch (err) {
    return error(res, err.message);
  }
};

// Admin: Upsert page (Create or Update)
exports.upsertPage = async (req, res) => {
  try {
    const { slug, title, content } = normalizePagePayload(req.body);
    const plainTextContent = getPlainTextFromHtml(content);

    if (!slug) return error(res, "Page slug is required", 400);
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return error(res, "Page slug can only contain lowercase letters, numbers, and hyphens", 400);
    }
    if (!title) return error(res, "Page title is required", 400);
    if (!plainTextContent) return error(res, "Page content is required", 400);

    const page = await Page.findOneAndUpdate(
      { slug },
      { 
        title, 
        content, 
        updatedBy: req.user?.userId || null,
        lastUpdated: Date.now()
      },
      { new: true, upsert: true, runValidators: true }
    );

    return success(res, { page }, "Page saved successfully");
  } catch (err) {
    return error(res, err.message);
  }
};

// Admin: Delete page
exports.deletePage = async (req, res) => {
  try {
    const slug = String(req.params.slug || "").trim().toLowerCase();
    if (!slug) return error(res, "Page slug is required", 400);
    const page = await Page.findOneAndDelete({ slug });
    if (!page) return error(res, "Page not found", 404);
    
    return success(res, {}, "Page deleted successfully");
  } catch (err) {
    return error(res, err.message);
  }
};
