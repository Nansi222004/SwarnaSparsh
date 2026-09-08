const Category = require("../../../models/Category");
const Product = require("../../../models/Product");
const slugify = require("../../../utils/slugify");
const { success, error } = require("../../../utils/apiResponse");
const { deleteFromCloudinary } = require("../../../utils/cloudinaryUtils");

// ── CATEGORIES ───────────────────────────────────────────────────────────────

const parseBoolean = (value) => {
  if (value === undefined) return undefined;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const lowered = value.toLowerCase();
    if (lowered === "true") return true;
    if (lowered === "false") return false;
  }
  return value;
};

const parseNumber = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

exports.createCategory = async (req, res) => {
  try {
    const { name, slug, description, bannerTitle, bannerSubtitle, showInNavbar, showInCollection, sortOrder, isActive } = req.body;
    
    // Auto-generate slug if not provided
    const categorySlug = slug ? slugify(slug) : slugify(name);

    const existing = await Category.findOne({ 
      $or: [{ slug: categorySlug }, { name: name?.trim() }]
    });
    if (existing) {
      console.warn(`[Admin] Category creation failed: Slug collision for "${categorySlug}"`);
      return error(res, `Category slug "${categorySlug}" is already taken. Please use a different name.`, 400);
    }

    const files = req.files || {};
    const imageFile = Array.isArray(files.image) ? files.image[0] : null;
    const bannerImageFile = Array.isArray(files.bannerImage) ? files.bannerImage[0] : null;

    const category = await Category.create({
      name,
      slug: categorySlug,
      description,
      bannerTitle: String(bannerTitle || "").trim(),
      bannerSubtitle: String(bannerSubtitle || "").trim(),
      showInNavbar: parseBoolean(showInNavbar) ?? true,
      showInCollection: parseBoolean(showInCollection) ?? true,
      sortOrder: parseNumber(sortOrder) ?? 0,
      isActive: parseBoolean(isActive) ?? true,
      image: imageFile?.path || req.file?.path || null, // backwards compatible
      bannerImage: bannerImageFile?.path || null,
    });

    console.log(`[Admin] Category created: ${category.name} (${category._id})`);

    return success(res, { category }, "Category created successfully", 201);
  } catch (err) { return error(res, err.message); }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find()
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();

    const categoryIds = categories.map(c => c._id);
    const counts = await Product.aggregate([
      { $match: { categories: { $in: categoryIds } } },
      { $unwind: "$categories" },
      { $group: { _id: "$categories", count: { $sum: 1 } } }
    ]);

    const countMap = counts.reduce((acc, item) => {
      acc[item._id.toString()] = item.count;
      return acc;
    }, {});

    const enriched = categories.map(cat => ({
      ...cat,
      productCount: countMap[cat._id.toString()] || 0
    }));

    return success(res, { categories: enriched }, "Categories retrieved");
  } catch (err) { return error(res, err.message); }
};

exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);
    if (!category) return error(res, "Category not found", 404);
    return success(res, { category }, "Category retrieved");
  } catch (err) { return error(res, err.message); }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description, bannerTitle, bannerSubtitle, showInNavbar, showInCollection, sortOrder, isActive } = req.body;

    const category = await Category.findById(id);
    if (!category) return error(res, "Category not found", 404);

    const nextSlug = slug ? slugify(slug) : (name ? slugify(name) : category.slug);
    if (nextSlug !== category.slug) {
      const slugCollision = await Category.findOne({ slug: nextSlug, _id: { $ne: id } });
      if (slugCollision) {
        return error(res, `Category slug "${nextSlug}" is already taken. Please use a different name.`, 400);
      }
      category.slug = nextSlug;
    }

    if (name) category.name = name;
    if (description !== undefined) category.description = description;
    if (bannerTitle !== undefined) category.bannerTitle = String(bannerTitle || "").trim();
    if (bannerSubtitle !== undefined) category.bannerSubtitle = String(bannerSubtitle || "").trim();
    if (showInNavbar !== undefined) category.showInNavbar = parseBoolean(showInNavbar);
    if (showInCollection !== undefined) category.showInCollection = parseBoolean(showInCollection);
    if (sortOrder !== undefined) category.sortOrder = parseNumber(sortOrder) ?? category.sortOrder;
    if (isActive !== undefined) category.isActive = parseBoolean(isActive);

    const deletedImages = Array.isArray(req.body.deletedImages)
      ? req.body.deletedImages
      : (() => {
          if (!req.body.deletedImages) return [];
          try { return JSON.parse(req.body.deletedImages); } catch (e) { return []; }
        })();

    const bannerDeletedImages = Array.isArray(req.body.bannerDeletedImages)
      ? req.body.bannerDeletedImages
      : (() => {
          if (!req.body.bannerDeletedImages) return [];
          try { return JSON.parse(req.body.bannerDeletedImages); } catch (e) { return []; }
        })();

    if (deletedImages.length > 0) {
      for (const imageUrl of deletedImages) {
        try {
          await deleteFromCloudinary(imageUrl);
        } catch (err) {
          console.error(`Failed to delete category image ${imageUrl}:`, err);
        }
      }
      if (category.image && deletedImages.includes(category.image)) {
        category.image = null;
      }
    }

    if (bannerDeletedImages.length > 0) {
      for (const imageUrl of bannerDeletedImages) {
        try {
          await deleteFromCloudinary(imageUrl);
        } catch (err) {
          console.error(`Failed to delete category banner image ${imageUrl}:`, err);
        }
      }
      if (category.bannerImage && bannerDeletedImages.includes(category.bannerImage)) {
        category.bannerImage = "";
      }
    }

    const files = req.files || {};
    const imageFile = Array.isArray(files.image) ? files.image[0] : null;
    const bannerImageFile = Array.isArray(files.bannerImage) ? files.bannerImage[0] : null;

    // Backwards compatibility if older route still provides req.file
    if (req.file?.path && !imageFile?.path) {
      category.image = req.file.path;
    }

    if (imageFile?.path) {
      category.image = imageFile.path;
    }
    if (bannerImageFile?.path) {
      category.bannerImage = bannerImageFile.path;
    }

    await category.save();
    return success(res, { category }, "Category updated successfully");
  } catch (err) { 
    return error(res, err.message); 
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Production Safety: Check if products are using this category
    const Product = require("../../../models/Product");
    const productCount = await Product.countDocuments({ categories: id });
    
    if (productCount > 0) {
      console.warn(`[Admin] Deletion blocked: Category ${id} has ${productCount} associated products.`);
      return error(res, `Cannot delete category. It has ${productCount} active products associated with it. Please reassign the products first.`, 400);
    }

    const category = await Category.findByIdAndDelete(id);
    if (!category) return error(res, "Category not found", 404);
    
    if (category.image) {
      try {
        await deleteFromCloudinary(category.image);
      } catch (err) {
        console.error(`Failed to delete category image ${category.image}:`, err);
      }
    }

    if (category.bannerImage) {
      try {
        await deleteFromCloudinary(category.bannerImage);
      } catch (err) {
        console.error(`Failed to delete category banner image ${category.bannerImage}:`, err);
      }
    }

    console.log(`[Admin] Category deleted: ${category.name} (${id})`);
    return success(res, {}, "Category deleted");
  } catch (err) { return error(res, err.message); }
};
