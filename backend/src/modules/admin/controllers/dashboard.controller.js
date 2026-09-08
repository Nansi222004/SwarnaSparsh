const Order   = require("../../../models/Order");
const User    = require("../../../models/User");
const Product = require("../../../models/Product");
const Seller  = require("../../../models/Seller");
const Commission     = require("../../../models/Commission");
const PayoutRequest  = require("../../../models/PayoutRequest");
const { success, error } = require("../../../utils/apiResponse");

exports.getStats = async (req, res) => {
  try {
    const includeAnalytics = String(req.query.includeAnalytics || "").trim().toLowerCase() === "true";

    // 1. Core Counts
    const totalOrders = await Order.countDocuments();
    const totalUsers = await User.countDocuments({ role: "user" });
    const totalProducts = await Product.countDocuments();
    const totalSellers = await Seller.countDocuments();

    // 2. Revenue Aggregation
    const revenueData = await Order.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, totalRevenue: { $sum: "$total" } } }
    ]);
    const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

    // 2.1 Pending orders summary for dashboard cards
    const pendingStatuses = ["Processing", "Confirmed", "Packed"];
    const pendingOrders = await Order.countDocuments({ status: { $in: pendingStatuses } });

    // 3. Order Status Distribution
    const statusDistribution = await Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    // 4.1 Latest orders list for dashboard table
    const recentOrders = await Order.find({})
      .select("orderId createdAt total status customerName userId shippingAddress")
      .sort({ createdAt: -1 })
      .limit(8)
      .populate({ path: "userId", select: "name" })
      .lean();

    let salesOverTime = [];
    let categoryStats = [];

    if (includeAnalytics) {
      // 4. Recent Sales (Last 30 Days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      salesOverTime = await Order.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo }, paymentStatus: "paid" } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            revenue: { $sum: "$total" },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      // 5. Category Distribution (Top 5 categories by revenue)
      categoryStats = await Order.aggregate([
        { $match: { paymentStatus: "paid" } },
        { $unwind: "$items" },
        { $lookup: { from: "products", localField: "items.productId", foreignField: "_id", as: "product" } },
        { $unwind: "$product" },
        { $unwind: "$product.categories" }, // Product schema has [{ categoryId, ... }]
        {
          $group: {
            _id: "$product.categories.categoryId",
            revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
          }
        },
        { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "catInfo" } },
        { $unwind: "$catInfo" },
        { $project: { name: "$catInfo.name", revenue: 1 } },
        { $sort: { revenue: -1 } },
        { $limit: 5 }
      ]);
    }

    // 6. Admin commission earnings
    const [commissionEarningsData] = await Commission.aggregate([
      {
        $match: {
          type:   { $in: ["accrual", "backfill"] },
          status: "confirmed",
        },
      },
      {
        $group: {
          _id:  null,
          totalCommissionsEarned: { $sum: "$commissionAmount" },
        },
      },
    ]);
    const totalCommissionsEarned = Math.round(commissionEarningsData?.totalCommissionsEarned || 0);

    // 7. Pending payout requests count (action required)
    const pendingPayoutRequests = await PayoutRequest.countDocuments({
      status: { $in: ["PENDING", "PROCESSING"] },
    });

    return success(res, {
      summary: { totalOrders, totalUsers, totalProducts, totalRevenue, totalSellers },
      pendingOrders,
      recentOrders,
      includeAnalytics,
      salesOverTime,
      statusDistribution,
      categoryStats,
      // Admin earnings & wallet alerts
      totalCommissionsEarned,
      pendingPayoutRequests,
    }, "Dashboard stats retrieved");

  } catch (err) { return error(res, err.message); }
};
