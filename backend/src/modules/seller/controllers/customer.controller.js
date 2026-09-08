const mongoose = require("mongoose");
const Order = require("../../../models/Order");
const User = require("../../../models/User");
const { success, error } = require("../../../utils/apiResponse");

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const escapeRegex = (value = "") => String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

exports.getMyCustomers = async (req, res) => {
  try {
    const sellerId = req.user.userId;
    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return error(res, "Invalid seller id", 400);
    }
    const sellerObjectId = new mongoose.Types.ObjectId(sellerId);

    const page = parsePositiveInt(req.query.page, 1);
    const limit = Math.min(parsePositiveInt(req.query.limit, 10), 100);
    const search = String(req.query.search || "").trim();
    const skip = (page - 1) * limit;

    const base = [
      { $match: { "items.sellerId": sellerObjectId, userId: { $ne: null } } },
      { $sort: { createdAt: -1 } },
      {
        $addFields: {
          sellerItems: {
            $filter: {
              input: "$items",
              as: "it",
              cond: { $eq: ["$$it.sellerId", sellerObjectId] }
            }
          }
        }
      },
      {
        $addFields: {
          sellerSpend: {
            $sum: {
              $map: {
                input: "$sellerItems",
                as: "s",
                in: {
                  $multiply: [
                    { $ifNull: ["$$s.price", 0] },
                    { $ifNull: ["$$s.quantity", 0] }
                  ]
                }
              }
            }
          }
        }
      },
      {
        $group: {
          _id: "$userId",
          totalOrders: { $sum: 1 },
          totalSpend: { $sum: "$sellerSpend" },
          lastOrderDate: { $first: "$createdAt" },
          fallbackName: {
            $first: {
              $ifNull: [
                "$customerName",
                {
                  $trim: {
                    input: {
                      $concat: [
                        { $ifNull: ["$shippingAddress.firstName", ""] },
                        " ",
                        { $ifNull: ["$shippingAddress.lastName", ""] }
                      ]
                    }
                  }
                }
              ]
            }
          },
          fallbackEmail: {
            $first: {
              $ifNull: ["$customerEmail", { $ifNull: ["$shippingAddress.email", ""] }]
            }
          }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userDoc"
        }
      },
      {
        $addFields: {
          userName: { $arrayElemAt: ["$userDoc.name", 0] },
          userEmail: { $arrayElemAt: ["$userDoc.email", 0] }
        }
      },
      {
        $project: {
          _id: 0,
          id: "$_id",
          name: { $ifNull: ["$userName", { $ifNull: ["$fallbackName", "Customer"] }] },
          email: { $ifNull: ["$userEmail", { $ifNull: ["$fallbackEmail", ""] }] },
          totalOrders: 1,
          totalSpend: 1,
          lastOrderDate: 1
        }
      }
    ];

    const pipeline = [...base];
    if (search) {
      const escaped = escapeRegex(search);
      pipeline.push({
        $match: {
          $or: [
            { name: { $regex: escaped, $options: "i" } },
            { email: { $regex: escaped, $options: "i" } }
          ]
        }
      });
    }

    pipeline.push({
      $facet: {
        data: [{ $skip: skip }, { $limit: limit }],
        meta: [{ $count: "totalItems" }]
      }
    });

    const result = await Order.aggregate(pipeline);
    const customers = result?.[0]?.data || [];
    const totalItems = result?.[0]?.meta?.[0]?.totalItems || 0;
    const totalPages = Math.max(1, Math.ceil(totalItems / limit));

    return success(res, {
      customers,
      pagination: { page, limit, totalItems, totalPages }
    });
  } catch (err) { return error(res, err.message); }
};

exports.getMyCustomerDetails = async (req, res) => {
  try {
    const sellerId = req.user.userId;
    const { id: customerId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return error(res, "Invalid seller id", 400);
    }
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return error(res, "Invalid customer id", 400);
    }

    const sellerObjectId = new mongoose.Types.ObjectId(sellerId);
    const customerObjectId = new mongoose.Types.ObjectId(customerId);
    const page = parsePositiveInt(req.query.page, 1);
    const limit = Math.min(parsePositiveInt(req.query.limit, 10), 50);
    const skip = (page - 1) * limit;

    const pipeline = [
      {
        $match: {
          userId: customerObjectId,
          "items.sellerId": sellerObjectId
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $addFields: {
          sellerItems: {
            $filter: {
              input: "$items",
              as: "it",
              cond: { $eq: ["$$it.sellerId", sellerObjectId] }
            }
          }
        }
      },
      {
        $addFields: {
          amount: {
            $sum: {
              $map: {
                input: "$sellerItems",
                as: "s",
                in: {
                  $multiply: [
                    { $ifNull: ["$$s.price", 0] },
                    { $ifNull: ["$$s.quantity", 0] }
                  ]
                }
              }
            }
          },
          itemsSummary: {
            $reduce: {
              input: {
                $map: {
                  input: "$sellerItems",
                  as: "s",
                  in: { $ifNull: ["$$s.name", "Item"] }
                }
              },
              initialValue: "",
              in: {
                $cond: [
                  { $eq: ["$$value", ""] },
                  "$$this",
                  { $concat: ["$$value", ", ", "$$this"] }
                ]
              }
            }
          }
        }
      },
      {
        $facet: {
          orders: [
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                _id: 0,
                id: { $ifNull: ["$orderId", "$_id"] },
                date: "$createdAt",
                items: { $ifNull: ["$itemsSummary", "Items"] },
                amount: 1,
                status: { $toUpper: { $ifNull: ["$status", "Processing"] } }
              }
            }
          ],
          stats: [
            {
              $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                totalSpend: { $sum: "$amount" },
                lastOrderDate: { $first: "$createdAt" },
                fallbackName: { $first: "$customerName" },
                fallbackEmail: { $first: "$customerEmail" },
                shippingEmail: { $first: "$shippingAddress.email" },
                shipFirst: { $first: "$shippingAddress.firstName" },
                shipLast: { $first: "$shippingAddress.lastName" }
              }
            }
          ],
          meta: [{ $count: "totalItems" }]
        }
      }
    ];

    const result = await Order.aggregate(pipeline);
    const orders = result?.[0]?.orders || [];
    const stats = result?.[0]?.stats?.[0] || null;
    const totalItems = result?.[0]?.meta?.[0]?.totalItems || 0;
    const totalPages = Math.max(1, Math.ceil(totalItems / limit));

    if (!stats) {
      return success(res, { customer: null, orders: [], pagination: { page, limit, totalItems, totalPages } });
    }

    const user = await User.findById(customerObjectId).select("name email");
    const shipName = [stats.shipFirst, stats.shipLast].filter(Boolean).join(" ").trim();
    const name = user?.name || shipName || stats.fallbackName || "Customer";
    const email = user?.email || stats.fallbackEmail || stats.shippingEmail || "";
    const averageOrder = stats.totalOrders ? Math.round((stats.totalSpend || 0) / stats.totalOrders) : 0;

    return success(res, {
      customer: {
        id: customerId,
        name,
        email,
        totalOrders: stats.totalOrders || 0,
        totalSpend: stats.totalSpend || 0,
        averageOrder
      },
      orders,
      pagination: { page, limit, totalItems, totalPages }
    });
  } catch (err) { return error(res, err.message); }
};
