const FAQ = require("../../../models/FAQ");
const { success, error } = require("../../../utils/apiResponse");

exports.getFAQs = async (req, res) => {
  try {
    const faqs = await FAQ.find({ isActive: true }).sort({ category: 1, sortOrder: 1 });
    return success(res, { faqs });
  } catch (err) { return error(res, err.message); }
};
