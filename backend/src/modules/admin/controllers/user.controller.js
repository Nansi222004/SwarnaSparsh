const mongoose = require("mongoose");
const User = require("../../../models/User");
const Order = require("../../../models/Order");
const Address = require("../../../models/Address");
const { success, error } = require("../../../utils/apiResponse");
const auditLogger = require("../../../utils/auditLogger");

const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(String(value || ""));

const parseBooleanQuery = (value) => {
  if (typeof value === "boolean") return value;
  const normalized = String(value || "").trim().toLowerCase();
  if (["true", "1", "yes"].includes(normalized)) return true;
  if (["false", "0", "no"].includes(normalized)) return false;
  return null;
};

const buildUserMetrics = async (userIds = []) => {
  const normalizedIds = userIds
    .filter(Boolean)
    .map((id) => new mongoose.Types.ObjectId(String(id)));

  if (!normalizedIds.length) return new Map();

  const [orderMetrics, addressMetrics] = await Promise.all([
    Order.aggregate([
      {
        $match: {
          userId: { $in: normalizedIds }
        }
      },
      {
        $group: {
          _id: "$userId",
          ordersCount: { $sum: 1 },
          spentAmount: {
            $sum: {
              $cond: [
                { $eq: ["$status", "Cancelled"] },
                0,
                { $ifNull: ["$total", 0] }
              ]
            }
          },
          lastOrderAt: { $max: "$createdAt" }
        }
      }
    ]),
    Address.aggregate([
      {
        $match: {
          userId: { $in: normalizedIds }
        }
      },
      {
        $group: {
          _id: "$userId",
          addressCount: { $sum: 1 }
        }
      }
    ])
  ]);

  const metricsMap = new Map();

  orderMetrics.forEach((item) => {
    metricsMap.set(String(item._id), {
      ordersCount: item.ordersCount || 0,
      spentAmount: Math.round(item.spentAmount || 0),
      lastOrderAt: item.lastOrderAt || null,
      addressCount: 0
    });
  });

  addressMetrics.forEach((item) => {
    const existing = metricsMap.get(String(item._id)) || {
      ordersCount: 0,
      spentAmount: 0,
      lastOrderAt: null,
      addressCount: 0
    };
    existing.addressCount = item.addressCount || 0;
    metricsMap.set(String(item._id), existing);
  });

  return metricsMap;
};

exports.getUsers = async (req, res) => {
  try {
    const { role, search, isBlocked, status, page, limit } = req.query;
    const query = { role: role || "user" };
    const blockedFlag = parseBooleanQuery(isBlocked);

    if (blockedFlag !== null) {
      query.isBlocked = blockedFlag;
    } else if (status) {
      const normalizedStatus = String(status).trim().toLowerCase();
      if (normalizedStatus === "active") query.isBlocked = false;
      if (normalizedStatus === "blocked") query.isBlocked = true;
    }

    if (search) {
      const escaped = escapeRegex(search.trim());
      query.$or = [
        { name: { $regex: escaped, $options: "i" } },
        { email: { $regex: escaped, $options: "i" } },
        { phone: { $regex: escaped, $options: "i" } }
      ];
    }

    const shouldPaginate = page !== undefined || limit !== undefined;
    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const pageLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 200);

    const total = shouldPaginate ? await User.countDocuments(query) : null;

    const usersQuery = User.find(query).select("-password").sort({ createdAt: -1 });
    if (shouldPaginate) {
      usersQuery.skip((pageNumber - 1) * pageLimit).limit(pageLimit);
    }

    const users = await usersQuery.lean();
    const metricsMap = await buildUserMetrics(users.map((user) => user._id));

    const enrichedUsers = users.map((user) => {
      const metrics = metricsMap.get(String(user._id)) || {
        ordersCount: 0,
        spentAmount: 0,
        lastOrderAt: null,
        addressCount: 0
      };

      return {
        ...user,
        ordersCount: metrics.ordersCount,
        spentAmount: metrics.spentAmount,
        lastOrderAt: metrics.lastOrderAt,
        addressCount: metrics.addressCount,
        wishlistCount: Array.isArray(user.wishlist) ? user.wishlist.length : 0
      };
    });

    const payload = { users: enrichedUsers };
    if (shouldPaginate) {
      payload.pagination = {
        total,
        page: pageNumber,
        limit: pageLimit,
        pages: Math.ceil(total / pageLimit)
      };
    }

    return success(res, payload, "Users retrieved");
  } catch (err) {
    return error(res, err.message);
  }
};

exports.getUserDetail = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return error(res, "Invalid user id", 400);
    }

    const user = await User.findById(req.params.id)
      .select("-password")
      .populate({
        path: "wishlist",
        select: "name images slug variants"
      })
      .lean();

    if (!user) return error(res, "User not found", 404);

    const [addresses, recentOrders, metricsMap] = await Promise.all([
      Address.find({ userId: user._id }).sort({ isDefault: -1, createdAt: -1 }).lean(),
      Order.find({ userId: user._id })
        .select("orderId total status createdAt shippingAddress paymentStatus paymentMethod")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      buildUserMetrics([user._id])
    ]);

    const metrics = metricsMap.get(String(user._id)) || {
      ordersCount: 0,
      spentAmount: 0,
      lastOrderAt: null,
      addressCount: 0
    };

    return success(
      res,
      {
        user: {
          ...user,
          wishlistCount: Array.isArray(user.wishlist) ? user.wishlist.length : 0
        },
        metrics: {
          ...metrics,
          couponsUsed: Array.isArray(user.usedCoupons) ? user.usedCoupons.length : 0
        },
        addresses,
        recentOrders,
        lastAddress:
          addresses.find((address) => address.isDefault) ||
          addresses[0] ||
          recentOrders[0]?.shippingAddress ||
          null
      },
      "User details retrieved"
    );
  } catch (err) {
    return error(res, err.message);
  }
};

exports.blockUser = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return error(res, "Invalid user id", 400);
    }

    const user = await User.findById(req.params.id).select("-password");
    if (!user) return error(res, "User not found", 404);

    if (String(user._id) === String(req.user.userId)) {
      return error(res, "You cannot block your own admin account", 400);
    }

    const previousState = user.isBlocked;
    user.isBlocked = !user.isBlocked;
    await user.save();

    // Audit log — non-blocking
    auditLogger.log(req, {
      action:      user.isBlocked ? "BLOCK" : "UNBLOCK",
      entity:      "User",
      entityId:    String(user._id),
      entityLabel: user.email || user.name || "",
      before:      { isBlocked: previousState },
      after:       { isBlocked: user.isBlocked }
    });

    return success(
      res,
      { user },
      `User ${user.isBlocked ? "blocked" : "unblocked"} successfully`
    );
  } catch (err) {
    return error(res, err.message);
  }
};
