const Review = require("../models/Review");
const Product = require("../models/Product");

const APPROVED_REVIEW_QUERY = {
  $or: [
    { status: "approved" },
    { status: { $exists: false }, isApproved: true }
  ]
};

const syncProductReviewStats = async (productId) => {
  const [stats] = await Review.aggregate([
    {
      $match: {
        productId,
        ...APPROVED_REVIEW_QUERY
      }
    },
    {
      $group: {
        _id: "$productId",
        reviewCount: { $sum: 1 },
        averageRating: { $avg: "$rating" }
      }
    }
  ]);

  await Product.findByIdAndUpdate(productId, {
    reviewCount: stats?.reviewCount || 0,
    rating: stats?.averageRating ? Number(stats.averageRating.toFixed(1)) : 0
  });
};

module.exports = {
  APPROVED_REVIEW_QUERY,
  syncProductReviewStats
};
