const Page = require("../../../models/Page");
const { success, error } = require("../../../utils/apiResponse");
const { sanitizePageHtml } = require("../../../utils/pageSanitizer");
const { defaultPages } = require("../../../utils/defaultPages");

exports.getPageBySlug = async (req, res) => {
  try {
    const slug = String(req.params.slug || "").trim().toLowerCase();
    let page = await Page.findOne({ slug }).lean();

    if (!page && defaultPages[slug]) {
      try {
        const created = await Page.create({
          slug: defaultPages[slug].slug,
          title: defaultPages[slug].title,
          content: defaultPages[slug].content,
          lastUpdated: new Date()
        });
        page = created.toObject();
      } catch (createErr) {
        page = defaultPages[slug];
      }
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
