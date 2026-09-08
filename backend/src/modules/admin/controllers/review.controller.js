const Review = require("../../../models/Review");
const mongoose = require("mongoose");
const { success, error } = require("../../../utils/apiResponse");
const { syncProductReviewStats } = require("../../../utils/reviewMetrics");

exports.getReviews = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;
    const query = {};

    if (status && ["pending", "approved", "rejected"].includes(status)) {
      query.status = status;
    }

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [
        { title: { $regex: escaped, $options: "i" } },
        { body: { $regex: escaped, $options: "i" } }
      ];
    }

    const safePage = Math.max(Number(page) || 1, 1);
    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);

    const [reviews, total] = await Promise.all([
      Review.find(query)
      .populate("userId", "name phone email")
      .populate("productId", "name images")
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit),
      Review.countDocuments(query)
    ]);

    return success(res, {
      reviews,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        pages: Math.ceil(total / safeLimit)
      }
    }, "Reviews retrieved");
  } catch (err) {
    return error(res, err.message);
  }
};

exports.deleteReview = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return error(res, "Invalid review id", 400);
    }

    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return error(res, "Review not found", 404);

    await syncProductReviewStats(review.productId);

    return success(res, {}, "Review deleted successfully");
  } catch (err) {
    return error(res, err.message);
  }
};

exports.toggleReview = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return error(res, "Invalid review id", 400);
    }

    const review = await Review.findById(req.params.id);
    if (!review) return error(res, "Review not found", 404);

    const action = req.body?.action;

    if (action === "approve") {
      review.status = "approved";
      review.isApproved = true;
    } else if (action === "reject") {
      review.status = "rejected";
      review.isApproved = false;
    } else if (action === "pending") {
      review.status = "pending";
      review.isApproved = false;
    } else {
      const nextStatus = review.status === "approved" ? "pending" : "approved";
      review.status = nextStatus;
      review.isApproved = nextStatus === "approved";
    }

    await review.save();
    await syncProductReviewStats(review.productId);

    return success(res, { review }, `Review marked as ${review.status}`);
  } catch (err) {
    return error(res, err.message);
  }
};
