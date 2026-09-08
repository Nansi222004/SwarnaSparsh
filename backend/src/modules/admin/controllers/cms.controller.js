const Banner = require("../../../models/Banner");
const Blog = require("../../../models/Blog");
const FAQ = require("../../../models/FAQ");
const slugify = require("../../../utils/slugify");
const { deleteFromCloudinary } = require("../../../utils/cloudinaryUtils");
const { success, error } = require("../../../utils/apiResponse");

const normalizeBannerSortOrders = async (placement, preferredBannerId = null, preferredSortOrder = null) => {
  const placementQuery = placement === "hero"
    ? { $or: [{ placement: "hero" }, { placement: { $exists: false } }, { placement: null }] }
    : { placement };
  const banners = await Banner.find(placementQuery).sort({ sortOrder: 1, createdAt: 1 });
  const preferred = preferredBannerId
    ? banners.find((banner) => String(banner._id) === String(preferredBannerId))
    : null;

  const remaining = preferred
    ? banners.filter((banner) => String(banner._id) !== String(preferredBannerId))
    : banners;

  const ordered = [];
  const desiredIndex = preferred ? Math.max(0, Number(preferredSortOrder) || 0) : null;
  let inserted = false;

  remaining.forEach((banner) => {
    if (preferred && !inserted && ordered.length === desiredIndex) {
      ordered.push(preferred);
      inserted = true;
    }
    ordered.push(banner);
  });

  if (preferred && !inserted) {
    ordered.push(preferred);
  }

  await Promise.all(
    ordered.map((banner, index) => {
      if (banner.sortOrder === index) return Promise.resolve();
      return Banner.updateOne({ _id: banner._id }, { $set: { sortOrder: index } });
    })
  );
};

const normalizeBannerPayload = (body = {}, existingBanner = null) => {
  const data = {
    title: String(body.title || "").trim(),
    subtitle: String(body.subtitle || "").trim(),
    link: String(body.link || "").trim(),
    placement: body.placement === "promo" ? "promo" : (existingBanner?.placement || "hero"),
  };

  if (Object.prototype.hasOwnProperty.call(body, "isActive")) {
    data.isActive = body.isActive === true || body.isActive === "true";
  } else {
    data.isActive = existingBanner ? existingBanner.isActive : true;
  }

  if (Object.prototype.hasOwnProperty.call(body, "sortOrder")) {
    const parsed = Number(body.sortOrder);
    data.sortOrder = Number.isFinite(parsed) ? parsed : 0;
  } else {
    data.sortOrder = existingBanner?.sortOrder || 0;
  }

  if (Object.prototype.hasOwnProperty.call(body, "validFrom")) {
    data.validFrom = body.validFrom ? new Date(body.validFrom) : null;
  } else {
    data.validFrom = existingBanner?.validFrom || null;
  }

  if (Object.prototype.hasOwnProperty.call(body, "validUntil")) {
    data.validUntil = body.validUntil ? new Date(body.validUntil) : null;
  } else {
    data.validUntil = existingBanner?.validUntil || null;
  }

  if (body.mobileImage !== undefined) {
    data.mobileImage = String(body.mobileImage || "").trim();
  } else {
    data.mobileImage = existingBanner?.mobileImage || "";
  }

  return data;
};

const validateBannerPayload = (data) => {
  if (!data.title) return "Banner title is required";
  if (!data.image) return "Banner image is required";
  if (!["hero", "promo"].includes(data.placement)) return "Banner placement is invalid";
  if (data.validFrom && Number.isNaN(data.validFrom.getTime())) return "Enter a valid start date";
  if (data.validUntil && Number.isNaN(data.validUntil.getTime())) return "Enter a valid end date";
  if (data.validFrom && data.validUntil && data.validUntil < data.validFrom) {
    return "End date must be after start date";
  }
  return null;
};

// ── Banners ──────────────────────────────────────────────────────────────────
exports.createBanner = async (req, res) => {
  try {
    const data = normalizeBannerPayload(req.body);
    if (req.file) data.image = req.file.path;
    const validationError = validateBannerPayload(data);
    if (validationError) return error(res, validationError, 400);
    const banner = await Banner.create(data);
    await normalizeBannerSortOrders(banner.placement, banner._id, banner.sortOrder);
    const normalizedBanner = await Banner.findById(banner._id);
    return success(res, { banner: normalizedBanner }, "Banner created", 201);
  } catch (err) { return error(res, err.message); }
};

exports.getBanners = async (req, res) => {
  try {
    const banners = await Banner.find().sort({ sortOrder: 1 });
    return success(res, { banners });
  } catch (err) { return error(res, err.message); }
};

exports.getBannerDetail = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return error(res, "Banner not found", 404);
    return success(res, { banner });
  } catch (err) { return error(res, err.message); }
};

exports.updateBanner = async (req, res) => {
  try {
    const existingBanner = await Banner.findById(req.params.id);
    if (!existingBanner) return error(res, "Banner not found", 404);
    const previousPlacement = existingBanner.placement || "hero";

    const data = normalizeBannerPayload(req.body, existingBanner);
    data.image = req.file ? req.file.path : existingBanner.image;

    const validationError = validateBannerPayload(data);
    if (validationError) return error(res, validationError, 400);

    const oldImage = req.file ? existingBanner.image : null;
    const banner = await Banner.findByIdAndUpdate(req.params.id, data, { new: true });
    await normalizeBannerSortOrders(previousPlacement);
    await normalizeBannerSortOrders(banner.placement, banner._id, banner.sortOrder);
    if (oldImage) {
      await deleteFromCloudinary(oldImage).catch(() => null);
    }
    return success(res, { banner }, "Banner updated");
  } catch (err) { return error(res, err.message); }
};

exports.deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (!banner) return error(res, "Banner not found", 404);
    await normalizeBannerSortOrders(banner.placement || "hero");
    if (banner.image) {
      await deleteFromCloudinary(banner.image).catch(() => null);
    }
    return success(res, {}, "Banner deleted");
  } catch (err) { return error(res, err.message); }
};

// ── Blogs (Admin CRUD) ──────────────────────────────────────────────────────
exports.createBlog = async (req, res) => {
  try {
    const data = req.body;
    data.slug = data.slug ? slugify(data.slug) : slugify(data.title);
    if (req.file) data.image = req.file.path;
    data.author = req.user.name || "Admin";

    const blog = await Blog.create(data);
    return success(res, { blog }, "Blog published", 201);
  } catch (err) { return error(res, err.message); }
};

exports.getBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    return success(res, { blogs });
  } catch (err) { return error(res, err.message); }
};

exports.getBlogDetail = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return error(res, "Blog not found", 404);
    return success(res, { blog });
  } catch (err) { return error(res, err.message); }
};

exports.updateBlog = async (req, res) => {
  try {
    const data = req.body;
    if (data.title && !data.slug) data.slug = slugify(data.title);
    else if (data.slug) data.slug = slugify(data.slug);
    
    if (req.file) data.image = req.file.path;
    const blog = await Blog.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!blog) return error(res, "Blog not found", 404);
    return success(res, { blog }, "Blog updated");
  } catch (err) { return error(res, err.message); }
};

exports.deleteBlog = async (req, res) => {
  try {
    await Blog.findByIdAndDelete(req.params.id);
    return success(res, {}, "Blog deleted");
  } catch (err) { return error(res, err.message); }
};

// ── FAQs ─────────────────────────────────────────────────────────────────────
exports.createFAQ = async (req, res) => {
  try {
    const faq = await FAQ.create(req.body);
    return success(res, { faq }, "FAQ created", 201);
  } catch (err) { return error(res, err.message); }
};

exports.getFAQs = async (req, res) => {
  try {
    const faqs = await FAQ.find().sort({ category: 1, sortOrder: 1 });
    return success(res, { faqs });
  } catch (err) { return error(res, err.message); }
};

exports.updateFAQ = async (req, res) => {
  try {
    const faq = await FAQ.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!faq) return error(res, "FAQ not found", 404);
    return success(res, { faq }, "FAQ updated");
  } catch (err) { return error(res, err.message); }
};

exports.deleteFAQ = async (req, res) => {
  try {
    await FAQ.findByIdAndDelete(req.params.id);
    return success(res, {}, "FAQ deleted");
  } catch (err) { return error(res, err.message); }
};
