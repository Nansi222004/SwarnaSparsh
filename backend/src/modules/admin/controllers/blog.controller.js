const Blog = require("../../../models/Blog");
const slugify = require("../../../utils/slugify");
const { success, error } = require("../../../utils/apiResponse");

const parseBoolean = (value, fallback = undefined) => {
  if (value === undefined) return fallback;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value === "true";
  return Boolean(value);
};

exports.getBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    return success(res, { blogs }, "Blogs retrieved successfully");
  } catch (err) {
    return error(res, err.message);
  }
};

exports.getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return error(res, "Blog not found", 404);
    return success(res, { blog }, "Blog retrieved successfully");
  } catch (err) {
    return error(res, err.message);
  }
};

exports.createBlog = async (req, res) => {
  try {
    const { title, slug, content, category, excerpt, author, tags, isPublished, coverImage } = req.body;
    if (!String(title || "").trim()) return error(res, "Blog title is required", 400);
    if (!String(content || "").trim()) return error(res, "Blog content is required", 400);
    if (!String(category || "").trim()) return error(res, "Blog category is required", 400);
    
    const blogSlug = slug ? slugify(slug) : slugify(title);
    
    // Check for duplicate slug
    const existing = await Blog.findOne({ slug: blogSlug });
    if (existing) return error(res, "A blog with this title/slug already exists", 409);
    const published = parseBoolean(isPublished, true);

    const blog = await Blog.create({
      title: String(title).trim(),
      slug: blogSlug,
      content: String(content).trim(),
      category: String(category).trim(),
      excerpt: String(excerpt || "").trim(),
      coverImage: req.file ? req.file.path : String(coverImage || "").trim() || null,
      author: author || "Swarna Sparsh Editorial",
      tags: tags ? (Array.isArray(tags) ? tags : JSON.parse(tags)) : [],
      isPublished: published,
      publishedAt: published ? new Date() : null
    });

    return success(res, { blog }, "Blog created successfully", 201);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, slug, content, category, excerpt, author, tags, isPublished, coverImage } = req.body;

    const blog = await Blog.findById(id);
    if (!blog) return error(res, "Blog not found", 404);

    if (title) {
        blog.title = String(title).trim();
        if (!slug) blog.slug = slugify(title);
    }
    if (slug) blog.slug = slugify(slug);

    const duplicate = await Blog.findOne({ slug: blog.slug, _id: { $ne: id } });
    if (duplicate) return error(res, "A blog with this title/slug already exists", 409);
    
    if (content !== undefined) blog.content = String(content).trim();
    if (category !== undefined) blog.category = String(category).trim();
    if (excerpt !== undefined) blog.excerpt = String(excerpt || "").trim();
    if (author !== undefined) blog.author = author;
    if (tags !== undefined) blog.tags = Array.isArray(tags) ? tags : JSON.parse(tags);
    
    if (isPublished !== undefined) {
        const published = parseBoolean(isPublished, blog.isPublished);
        if (published && !blog.isPublished) blog.publishedAt = new Date();
        if (!published) blog.publishedAt = null;
        blog.isPublished = published;
    }

    if (req.file) {
      blog.coverImage = req.file.path;
    } else if (coverImage !== undefined) {
      blog.coverImage = String(coverImage || "").trim() || null;
    } else if (req.body.removeImage === 'true') {
      blog.coverImage = null;
    }

    if (!String(blog.title || "").trim()) return error(res, "Blog title is required", 400);
    if (!String(blog.content || "").trim()) return error(res, "Blog content is required", 400);
    if (!String(blog.category || "").trim()) return error(res, "Blog category is required", 400);

    await blog.save();
    return success(res, { blog }, "Blog updated successfully");
  } catch (err) {
    return error(res, err.message);
  }
};

exports.deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findByIdAndDelete(id);
    if (!blog) return error(res, "Blog not found", 404);
    
    return success(res, {}, "Blog deleted successfully");
  } catch (err) {
    return error(res, err.message);
  }
};
