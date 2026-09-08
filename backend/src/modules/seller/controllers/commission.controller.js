/**
 * Seller Commission Controller
 *
 * All routes are scoped to req.user.userId so a seller can only see their own
 * commission ledger. There is no admin-only data here.
 *
 *   GET /seller/commission/summary
 *   GET /seller/commission/ledger
 *   GET /seller/commission/orders/:id
 */
"use strict";

const mongoose = require("mongoose");
const Commission = require("../../../models/Commission");
const Order = require("../../../models/Order");
const { success, error } = require("../../../utils/apiResponse");

const parsePage  = (v, fallback = 1)              => Math.max(1, Number.parseInt(v, 10) || fallback);
const parseLimit = (v, fallback = 25, max = 200)  =>
  Math.min(max, Math.max(1, Number.parseInt(v, 10) || fallback));

const buildDateRangeMatch = (from, to) => {
  if (!from && !to) return {};
  const match = {};
  if (from) {
    const d = new Date(from);
    if (!Number.isNaN(d.getTime())) match.$gte = d;
  }
  if (to) {
    const d = new Date(to);
    if (!Number.isNaN(d.getTime())) {
      d.setHours(23, 59, 59, 999);
      match.$lte = d;
    }
  }
  return Object.keys(match).length === 0 ? {} : { createdAt: match };
};

// ─────────────────────────────────────────────────────────────────────
// Summary KPIs
// ─────────────────────────────────────────────────────────────────────

exports.getSummary = async (req, res) => {
  try {
    const sellerId = new mongoose.Types.ObjectId(req.user.userId);
    const { from, to } = req.query || {};
    const baseMatch = { sellerId, ...buildDateRangeMatch(from, to) };

    const totalsAgg = await Commission.aggregate([
      { $match: baseMatch },
      {
        $group: {
          _id: { type: "$type", status: "$status" },
          amount: { $sum: "$commissionAmount" },
          rows:   { $sum: 1 },
        },
      },
    ]);

    let confirmed = 0, pending = 0, reversed = 0, gross = 0;
    for (const row of totalsAgg) {
      const a = Number(row.amount) || 0;
      gross += row._id?.type === "reversal" ? 0 : a;
      if (row._id?.type === "reversal" && row._id?.status === "confirmed") reversed += a;
      else if (row._id?.status === "confirmed") confirmed += a;
      else if (row._id?.status === "pending")   pending   += a;
    }
    const net = confirmed - reversed;

    // Monthly trend (last 12 months, ignore date filter so the chart stays stable)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const trendAgg = await Commission.aggregate([
      { $match: { sellerId, createdAt: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: {
            month: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
            type: "$type",
            status: "$status",
          },
          amount: { $sum: "$commissionAmount" },
        },
      },
      { $sort: { "_id.month": 1 } },
    ]);

    const trendMap = new Map();
    for (const row of trendAgg) {
      const m = row._id.month;
      if (!trendMap.has(m)) trendMap.set(m, { month: m, confirmed: 0, reversed: 0 });
      const t = trendMap.get(m);
      const a = Number(row.amount) || 0;
      if (row._id.type === "reversal" && row._id.status === "confirmed") t.reversed += a;
      else if (row._id.status === "confirmed") t.confirmed += a;
    }
    const monthlyTrend = Array.from(trendMap.values()).map((t) => ({
      ...t,
      net: t.confirmed - t.reversed,
    }));

    return success(res, {
      totals: { confirmed, pending, reversed, gross, net },
      period: { from: from || null, to: to || null },
      monthlyTrend,
    }, "Seller commission summary retrieved");
  } catch (err) { return error(res, err.message); }
};

// ─────────────────────────────────────────────────────────────────────
// Paginated ledger (this seller only)
// ─────────────────────────────────────────────────────────────────────

exports.getLedger = async (req, res) => {
  try {
    const sellerId = req.user.userId;
    const page  = parsePage(req.query.page);
    const limit = parseLimit(req.query.limit, 25);

    const query = { sellerId };

    if (req.query.orderNumber) {
      const escaped = String(req.query.orderNumber).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.orderNumber = { $regex: escaped, $options: "i" };
    }
    if (req.query.type && ["accrual", "reversal", "backfill"].includes(req.query.type)) {
      query.type = req.query.type;
    }
    if (req.query.status && ["pending", "confirmed", "reversed"].includes(req.query.status)) {
      query.status = req.query.status;
    }
    if (req.query.from || req.query.to) {
      query.createdAt = {};
      if (req.query.from) {
        const d = new Date(req.query.from);
        if (!Number.isNaN(d.getTime())) query.createdAt.$gte = d;
      }
      if (req.query.to) {
        const d = new Date(req.query.to);
        if (!Number.isNaN(d.getTime())) {
          d.setHours(23, 59, 59, 999);
          query.createdAt.$lte = d;
        }
      }
      if (Object.keys(query.createdAt).length === 0) delete query.createdAt;
    }

    const [rows, total] = await Promise.all([
      Commission.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Commission.countDocuments(query),
    ]);

    return success(res, {
      rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.max(1, Math.ceil(total / limit)),
      },
      filters: {
        orderNumber: req.query.orderNumber || null,
        type:        query.type   || null,
        status:      query.status || null,
        from:        req.query.from || null,
        to:          req.query.to   || null,
      },
    }, "Seller commission ledger retrieved");
  } catch (err) { return error(res, err.message); }
};

// ─────────────────────────────────────────────────────────────────────
// Per-order detail (only this seller's rows for the order)
// ─────────────────────────────────────────────────────────────────────

exports.getForOrder = async (req, res) => {
  try {
    const sellerId = req.user.userId;
    const sellerObjectId = new mongoose.Types.ObjectId(sellerId);
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return error(res, "Invalid order id", 400);

    // Confirm the order actually involves this seller
    const order = await Order.findOne({ _id: id, "items.sellerId": sellerObjectId })
      .select("orderId commissionSummary status items")
      .lean();

    if (!order) return error(res, "Order not found", 404);

    const rows = await Commission.find({ orderId: id, sellerId })
      .sort({ createdAt: 1 })
      .lean();

    // Net commission for this seller on this order (active accruals − reversals)
    let sellerCommission = 0;
    let sellerStatus     = "none";
    for (const r of rows) {
      const a = Number(r.commissionAmount) || 0;
      if (r.type === "reversal" && r.status === "confirmed") sellerCommission -= a;
      else if (r.status === "confirmed") sellerCommission += a;
      else if (r.status === "pending")   sellerCommission += a; // optimistic display only
    }
    const hasConfirmed = rows.some((r) => r.status === "confirmed" && r.type !== "reversal");
    const hasPending   = rows.some((r) => r.status === "pending");
    const hasReversed  = rows.some((r) => r.status === "confirmed" && r.type === "reversal");
    if (hasReversed && !hasConfirmed && !hasPending) sellerStatus = "reversed";
    else if (hasReversed && (hasConfirmed || hasPending)) sellerStatus = "partial";
    else if (hasConfirmed) sellerStatus = "confirmed";
    else if (hasPending)   sellerStatus = "pending";

    return success(res, {
      order: {
        _id: order._id,
        orderId: order.orderId,
        status: order.status,
        commissionSummary: order.commissionSummary || { totalCommission: 0, status: "none" },
      },
      sellerCommission,
      sellerStatus,
      rows,
    }, "Seller order commission retrieved");
  } catch (err) { return error(res, err.message); }
};
