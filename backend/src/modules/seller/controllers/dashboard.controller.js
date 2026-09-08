const Order = require("../../../models/Order");
const Product = require("../../../models/Product");
const Return = require("../../../models/Return");
const Category = require("../../../models/Category");
const mongoose = require("mongoose");
const { success, error } = require("../../../utils/apiResponse");

exports.getSellerStats = async (req, res) => {
  try {
    const sellerId = req.user.userId;
    const sellerObjectId = new mongoose.Types.ObjectId(sellerId);

    // ---------- Products (fast + scalable) ----------
    const [totalProducts, stockAgg, sellerProductIds] = await Promise.all([
      Product.countDocuments({ sellerId }),
      Product.aggregate([
        { $match: { sellerId } },
        { $project: { name: 1, categories: 1, variants: 1 } },
        { $unwind: { path: "$variants", preserveNullAndEmptyArrays: true } },
        {
          $facet: {
            totalStock: [
              { $group: { _id: null, value: { $sum: { $ifNull: ["$variants.stock", 0] } } } }
            ],
            lowStockCount: [
              { $match: { "variants.stock": { $lte: 5 } } },
              { $count: "count" }
            ],
            lowStockProducts: [
              { $match: { "variants.stock": { $lte: 5 } } },
              {
                $project: {
                  productId: "$_id",
                  name: "$name",
                  variantName: { $ifNull: ["$variants.name", "Standard"] },
                  stock: { $ifNull: ["$variants.stock", 0] }
                }
              },
              { $sort: { stock: 1 } },
              { $limit: 25 }
            ]
          }
        }
      ]),
      Product.find({ sellerId }).select("_id").lean()
    ]);

    const totalStock = Number(stockAgg?.[0]?.totalStock?.[0]?.value || 0);
    const lowStockProducts = stockAgg?.[0]?.lowStockProducts || [];
    const lowStockCount = Number(stockAgg?.[0]?.lowStockCount?.[0]?.count || 0);
    const productIds = (sellerProductIds || []).map(p => p._id);

    // ---------- Returns (count only) ----------
    const returnCount = productIds.length
      ? await Return.countDocuments({ "items.productId": { $in: productIds } })
      : 0;

    // ---------- Orders (aggregate; don't pull full order history into memory) ----------
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const fourWeeksAgo = new Date(now);
    fourWeeksAgo.setDate(now.getDate() - 27);
    fourWeeksAgo.setHours(0, 0, 0, 0);

    const ordersAgg = await Order.aggregate([
      { $match: { "items.sellerId": sellerObjectId } },
      {
        $addFields: {
          sellerItems: {
            $filter: {
              input: "$items",
              as: "item",
              cond: { $eq: ["$$item.sellerId", sellerObjectId] }
            }
          }
        }
      },
      {
        $addFields: {
          sellerSubtotal: {
            $sum: {
              $map: {
                input: "$sellerItems",
                as: "si",
                in: { $multiply: [{ $ifNull: ["$$si.price", 0] }, { $ifNull: ["$$si.quantity", 0] }] }
              }
            }
          },
          sellerUnits: {
            $sum: {
              $map: {
                input: "$sellerItems",
                as: "si",
                in: { $ifNull: ["$$si.quantity", 0] }
              }
            }
          }
        }
      },
      {
        $facet: {
          statusCounts: [
            { $group: { _id: "$status", count: { $sum: 1 } } }
          ],
          deliveredTotals: [
            { $match: { $or: [ { paymentStatus: "paid" }, { paymentStatus: "cod", status: "Delivered" } ] } },
            { $group: { _id: null, revenue: { $sum: "$sellerSubtotal" }, units: { $sum: "$sellerUnits" }, deliveredOrders: { $sum: 1 } } }
          ],
          recentOrders: [
            { $sort: { createdAt: -1 } },
            { $limit: 5 },
            {
              $project: {
                _id: 1,
                orderId: 1,
                createdAt: 1,
                status: 1,
                paymentStatus: 1,
                shippingAddress: 1,
                customerName: 1,
                sellerSubtotal: 1,
                sellerUnits: 1,
                firstItemName: { $ifNull: [{ $arrayElemAt: ["$sellerItems.name", 0] }, "Jewellery Item"] }
              }
            }
          ],
          dailyOrders: [
            { $match: { createdAt: { $gte: sevenDaysAgo } } },
            {
              $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                count: { $sum: 1 }
              }
            },
            { $sort: { _id: 1 } }
          ],
          weeklyRevenue: [
            { $match: { $or: [ { paymentStatus: "paid" }, { paymentStatus: "cod", status: "Delivered" } ], createdAt: { $gte: fourWeeksAgo } } },
            {
              $project: {
                createdAt: 1,
                sellerSubtotal: 1
              }
            }
          ]
        }
      }
    ]);

    const facet = ordersAgg?.[0] || {};
    const statusCounts = facet.statusCounts || [];
    const deliveredTotals = facet.deliveredTotals?.[0] || {};
    const recentOrders = facet.recentOrders || [];
    const dailyOrdersRaw = facet.dailyOrders || [];
    const weeklyRevenueRaw = facet.weeklyRevenue || [];

    const getCountByStatuses = (statuses = []) =>
      statuses.reduce((sum, st) => sum + (Number(statusCounts.find(r => r._id === st)?.count || 0)), 0);

    const pendingOrders = getCountByStatuses(["Processing", "Confirmed", "Packed"]);
    const acceptedOrders = getCountByStatuses(["Shipped", "Out for Delivery"]);
    const deliveredOrders = Number(deliveredTotals.deliveredOrders || 0);
    const totalRevenue = Number(deliveredTotals.revenue || 0);
    const totalItemsSold = Number(deliveredTotals.units || 0);

    // Normalize daily orders into last 7 days buckets (for a stable UI).
    const today = new Date(now);
    const dailyOrders = Array.from({ length: 7 }, (_, index) => {
      const day = new Date(today);
      day.setDate(today.getDate() - (6 - index));
      const key = day.toISOString().slice(0, 10);
      const count = Number(dailyOrdersRaw.find(r => r._id === key)?.count || 0);
      return { date: day.toLocaleDateString("en-US", { weekday: "short" }), count };
    });

    // Normalize weekly revenue to 4 buckets (stable UI label) grouped by 7-day relative windows.
    const weeklyRevenue = Array.from({ length: 4 }, (_, index) => {
      const start = new Date(fourWeeksAgo);
      start.setDate(fourWeeksAgo.getDate() + index * 7);
      const end = new Date(start);
      end.setDate(start.getDate() + 7);

      const matchingOrders = weeklyRevenueRaw.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= start && orderDate < end;
      });

      const revenue = matchingOrders.reduce((sum, o) => sum + (Number(o.sellerSubtotal) || 0), 0);
      return { week: `W${index + 1}`, revenue };
    });

    // ---------- Category performance (top 4) ----------
    const catAgg = await Product.aggregate([
      { $match: { sellerId } },
      { $project: { categories: 1 } },
      { $unwind: { path: "$categories", preserveNullAndEmptyArrays: true } },
      { $group: { _id: "$categories", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 4 },
      {
        $lookup: {
          from: Category.collection.name,
          localField: "_id",
          foreignField: "_id",
          as: "cat"
        }
      },
      {
        $project: {
          name: { $ifNull: [{ $arrayElemAt: ["$cat.name", 0] }, "Uncategorized"] },
          count: 1
        }
      }
    ]);
    const totalCategoryProducts = Math.max(Number(totalProducts || 0), 1);
    const categoryPerformance = (catAgg || []).map((row) => ({
      name: row.name,
      value: Math.round((Number(row.count || 0) / totalCategoryProducts) * 100)
    }));

    return success(res, {
      totalProducts,
      totalEarnings: totalRevenue,
      totalItemsSold,
      stats: {
        totalProducts,
        totalStock,
        pendingOrders,
        acceptedOrders,
        deliveredOrders,
        returnRequests: returnCount,
        totalRevenue,
        lowStockProducts,
        lowStockCount
      },
      recentOrders: recentOrders.map((order) => ({
        _id: order._id,
        orderId: order.orderId,
        createdAt: order.createdAt,
        status: order.status,
        paymentStatus: order.paymentStatus,
        shippingAddress: order.shippingAddress,
        customerName: order.customerName,
        sellerSubtotal: order.sellerSubtotal,
        sellerUnits: order.sellerUnits,
        // legacy-friendly fields
        total: order.sellerSubtotal,
        items: [{ name: order.firstItemName }]
      })),
      analytics: {
        todayStats: {
          orders: dailyOrders[dailyOrders.length - 1]?.count || 0
        },
        monthlyStats: {
          revenue: weeklyRevenue.reduce((sum, item) => sum + item.revenue, 0)
        },
        dailyOrders,
        categoryPerformance,
        weeklyRevenue
      }
    }, "Seller statistics retrieved");
  } catch (err) { return error(res, err.message); }
};

exports.getRecentOrders = async (req, res) => {
  try {
    const sellerId = req.user.userId;
    const sellerObjectId = new mongoose.Types.ObjectId(sellerId);
    const orders = await Order.aggregate([
      { $match: { "items.sellerId": sellerObjectId } },
      {
        $addFields: {
          sellerItems: {
            $filter: {
              input: "$items",
              as: "item",
              cond: { $eq: ["$$item.sellerId", sellerObjectId] }
            }
          }
        }
      },
      {
        $addFields: {
          sellerSubtotal: {
            $sum: {
              $map: {
                input: "$sellerItems",
                as: "si",
                in: { $multiply: [{ $ifNull: ["$$si.price", 0] }, { $ifNull: ["$$si.quantity", 0] }] }
              }
            }
          }
        }
      },
      { $sort: { createdAt: -1 } },
      { $limit: 5 },
      {
        $project: {
          _id: 1,
          orderId: 1,
          createdAt: 1,
          status: 1,
          paymentStatus: 1,
          shippingAddress: 1,
          customerName: 1,
          total: "$sellerSubtotal",
          items: [{ name: { $ifNull: [{ $arrayElemAt: ["$sellerItems.name", 0] }, "Jewellery Item"] } }]
        }
      }
    ]);

    return success(res, { recentOrders: orders }, "Recent seller orders retrieved");
  } catch (err) { return error(res, err.message); }
};
