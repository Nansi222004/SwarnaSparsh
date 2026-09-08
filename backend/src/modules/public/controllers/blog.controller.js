const Blog = require("../../../models/Blog");
const { success, error } = require("../../../utils/apiResponse");

exports.getBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ isPublished: true }).sort({ createdAt: -1 });
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
