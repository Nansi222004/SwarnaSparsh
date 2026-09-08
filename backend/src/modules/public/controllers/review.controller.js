const mongoose = require("mongoose");
const Review = require("../../../models/Review");
const Product = require("../../../models/Product");
const Order = require("../../../models/Order");
const { success, error } = require("../../../utils/apiResponse");
const { APPROVED_REVIEW_QUERY, syncProductReviewStats } = require("../../../utils/reviewMetrics");

exports.getReviews = async (req, res) => {
  try {
    const { productId } = req.query;
    const query = { ...APPROVED_REVIEW_QUERY };

    if (productId) {
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return error(res, "Invalid product", 400);
      }
      query.productId = productId;
    }

    const reviews = await Review.find(query)
      .populate("userId", "name")
      .sort({ createdAt: -1 });

    return success(res, { reviews });
  } catch (err) {
    return error(res, err.message);
  }
};

exports.createReview = async (req, res) => {
  try {
    const { productId, rating, title, body, images = [] } = req.body;
    const userId = req.user.userId;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return error(res, "Invalid product", 400);
    }

    const numericRating = Number(rating);
    if (!numericRating || numericRating < 1 || numericRating > 5) {
      return error(res, "Rating must be between 1 and 5", 400);
    }

    if (!String(body || "").trim()) {
      return error(res, "Review comment is required", 400);
    }

    const product = await Product.findById(productId).select("_id name");
    if (!product) {
      return error(res, "Product not found", 404);
    }

    const hasPurchasedProduct = await Order.exists({
      userId,
      status: "Delivered",
      "items.productId": product._id
    });

    if (!hasPurchasedProduct) {
      return error(res, "You can review only delivered purchases for this product", 400);
    }

    const existingReview = await Review.findOne({ productId, userId });
    if (existingReview) {
      existingReview.rating = numericRating;
      existingReview.title = String(title || "").trim() || "Review";
      existingReview.body = String(body || "").trim();
      existingReview.images = Array.isArray(images) ? images : [];
      existingReview.status = "pending";
      existingReview.isApproved = false;
      await existingReview.save();
      await syncProductReviewStats(product._id);

      return success(res, { review: existingReview }, "Review updated and sent for approval");
    }

    const review = await Review.create({
      productId,
      userId,
      rating: numericRating,
      title: String(title || "").trim() || "Review",
      body: String(body || "").trim(),
      images: Array.isArray(images) ? images : [],
      status: "pending",
      isApproved: false
    });

    return success(res, { review }, "Review submitted for approval", 201);
  } catch (err) {
    return error(res, err.message);
  }
};
