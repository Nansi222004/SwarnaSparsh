/**
 * Commission Doctor — read-only ledger health check.
 *
 * Audits the Commission collection against a set of invariants and prints
 * a sectioned report. The script NEVER writes to the database; it can be
 * scheduled (cron / CI) without risk.
 *
 * Invariants checked:
 *   I1  Every Commission row references an existing Order document.
 *   I2  Every Delivered order has either zero entries or fully confirmed entries
 *       (no orphaned "pending" entries left behind after delivery).
 *   I3  Every Cancelled/Returned/Refunded order has its commission fully reversed
 *       (net = 0) or has no entries at all.
 *   I4  Order.commissionSummary.totalCommission matches the live ledger sum
 *       (within ±₹1 tolerance for rounding drift).
 *   I5  At most one OPEN accrual/backfill row exists per (orderId, sellerId).
 *   I6  Every reversal row points at a real prior entry via reversesEntryId,
 *       and that prior entry is marked status="reversed".
 *
 * Usage:
 *   node scripts/commission-doctor.js
 *   node scripts/commission-doctor.js --from=2025-01-01 --to=2026-01-01
 *   node scripts/commission-doctor.js --json           (machine-readable)
 *   node scripts/commission-doctor.js --fail-fast      (exit non-zero on first issue)
 *
 * Exit codes:
 *   0  all invariants passed
 *   1  one or more invariants violated
 *   2  script-level failure (DB connection, etc.)
 */
"use strict";

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const connectDB  = require("../src/config/db");
const Order      = require("../src/models/Order");
const Commission = require("../src/models/Commission");

// ─────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────

const DELIVERED_STATUSES = new Set(["Delivered"]);
const TERMINATED_STATUSES = new Set(["Cancelled", "Returned", "Refunded"]);
const SUMMARY_TOLERANCE_INR = 1;
const SAMPLE_SIZE = 5; // sample violators to print per invariant

// ─────────────────────────────────────────────────────────────────────────
// CLI parsing
// ─────────────────────────────────────────────────────────────────────────

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { from: null, to: null, json: args.includes("--json"), failFast: args.includes("--fail-fast") };
  for (const raw of args) {
    if (raw.startsWith("--from=")) {
      const d = new Date(raw.slice("--from=".length));
      if (!Number.isNaN(d.getTime())) opts.from = d;
    } else if (raw.startsWith("--to=")) {
      const d = new Date(raw.slice("--to=".length));
      if (!Number.isNaN(d.getTime())) opts.to = d;
    }
  }
  return opts;
};

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────

const formatINR = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const pad = (s, n) => String(s).padEnd(n, " ");
const fail = (issue, ctx = {}) => ({ ok: false, issue, ctx });
const pass = () => ({ ok: true });

const buildOrderDateMatch = (from, to) => {
  if (!from && !to) return {};
  const m = {};
  if (from) m.$gte = from;
  if (to)   m.$lte = to;
  return { createdAt: m };
};

const buildCommissionDateMatch = (from, to) => {
  if (!from && !to) return {};
  const m = {};
  if (from) m.$gte = from;
  if (to)   m.$lte = to;
  return { createdAt: m };
};

// ─────────────────────────────────────────────────────────────────────────
// Invariant runners — each returns { name, total, violations: [{...}] }
// ─────────────────────────────────────────────────────────────────────────

const checkI1_orphanCommissions = async ({ from, to }) => {
  // Commission rows whose orderId no longer exists in Order collection.
  const match = buildCommissionDateMatch(from, to);
  const orphans = await Commission.aggregate([
    { $match: match },
    {
      $lookup: {
        from: Order.collection.name,
        localField: "orderId",
        foreignField: "_id",
        as: "order",
      },
    },
    { $match: { order: { $size: 0 } } },
    {
      $project: {
        _id: 1,
        orderId: 1,
        orderNumber: 1,
        sellerId: 1,
        type: 1,
        status: 1,
        commissionAmount: 1,
        createdAt: 1,
      },
    },
    { $limit: 1000 },
  ]);

  return {
    name: "I1 — orphan commission rows (no matching order)",
    total: orphans.length,
    violations: orphans,
  };
};

const checkI2_deliveredOrdersHaveNoPending = async ({ from, to }) => {
  // Delivered orders should not have OPEN pending entries.
  const orderMatch = { status: { $in: [...DELIVERED_STATUSES] }, ...buildOrderDateMatch(from, to) };
  const orderIds = await Order.distinct("_id", orderMatch);
  if (orderIds.length === 0) return { name: "I2 — Delivered orders have no pending entries", total: 0, violations: [] };

  const pendingRows = await Commission.aggregate([
    { $match: { orderId: { $in: orderIds }, type: { $in: ["accrual", "backfill"] }, status: "pending" } },
    {
      $group: {
        _id: "$orderId",
        rows: { $sum: 1 },
        sample: { $first: { orderNumber: "$orderNumber", commissionAmount: "$commissionAmount", sellerId: "$sellerId" } },
      },
    },
    { $limit: 1000 },
  ]);

  return {
    name: "I2 — Delivered orders have no pending entries",
    total: pendingRows.length,
    violations: pendingRows.map((r) => ({
      orderId: r._id,
      orderNumber: r.sample?.orderNumber,
      sellerId: r.sample?.sellerId,
      pendingRowCount: r.rows,
    })),
  };
};

const checkI3_terminatedOrdersNetZero = async ({ from, to }) => {
  // Cancelled/Returned/Refunded orders should net to 0 (either no entries
  // or every accrual is reversed).
  const orderMatch = { status: { $in: [...TERMINATED_STATUSES] }, ...buildOrderDateMatch(from, to) };
  const orderIds = await Order.distinct("_id", orderMatch);
  if (orderIds.length === 0) return { name: "I3 — Terminated orders net to 0", total: 0, violations: [] };

  // For each terminated order: sum(accrual+backfill where status IN active) > 0 = violation.
  const offenders = await Commission.aggregate([
    {
      $match: {
        orderId: { $in: orderIds },
        type:   { $in: ["accrual", "backfill"] },
        status: { $in: ["pending", "confirmed"] },
      },
    },
    {
      $group: {
        _id: "$orderId",
        openAmount: { $sum: "$commissionAmount" },
        rows: { $sum: 1 },
        sample: { $first: { orderNumber: "$orderNumber", status: "$status", sellerId: "$sellerId" } },
      },
    },
    { $match: { openAmount: { $gt: 0 } } },
    { $limit: 1000 },
  ]);

  return {
    name: "I3 — Terminated orders net to 0",
    total: offenders.length,
    violations: offenders.map((r) => ({
      orderId: r._id,
      orderNumber: r.sample?.orderNumber,
      openRowCount: r.rows,
      openAmount: r.openAmount,
    })),
  };
};

const checkI4_summaryCacheMatchesLedger = async ({ from, to }) => {
  // Order.commissionSummary.totalCommission should equal the live ledger
  // computation (active accruals + backfills − reversals) within tolerance.
  const orderMatch = { ...buildOrderDateMatch(from, to) };

  // Ledger totals grouped by order
  const ledgerTotals = await Commission.aggregate([
    {
      $lookup: {
        from: Order.collection.name,
        localField: "orderId",
        foreignField: "_id",
        as: "order",
      },
    },
    { $unwind: "$order" },
    ...(Object.keys(orderMatch).length > 0 ? [{ $match: Object.fromEntries(Object.entries(orderMatch).map(([k, v]) => [`order.${k}`, v])) }] : []),
    {
      $group: {
        _id: "$orderId",
        ledgerTotal: {
          $sum: {
            $cond: [
              { $eq: ["$type", "reversal"] },
              {
                $cond: [
                  { $ne: ["$status", "reversed"] },
                  { $multiply: ["$commissionAmount", -1] },
                  0,
                ],
              },
              {
                $cond: [
                  { $in: ["$status", ["pending", "confirmed"]] },
                  "$commissionAmount",
                  0,
                ],
              },
            ],
          },
        },
        cached: { $first: "$order.commissionSummary.totalCommission" },
        orderNumber: { $first: "$order.orderId" },
      },
    },
    {
      $project: {
        orderNumber: 1,
        ledgerTotal: 1,
        cached: 1,
        delta: { $subtract: [{ $ifNull: ["$cached", 0] }, "$ledgerTotal"] },
      },
    },
    { $match: { $expr: { $gt: [{ $abs: "$delta" }, SUMMARY_TOLERANCE_INR] } } },
    { $sort: { delta: -1 } },
    { $limit: 1000 },
  ]);

  return {
    name: "I4 — Order.commissionSummary cache matches ledger",
    total: ledgerTotals.length,
    violations: ledgerTotals.map((r) => ({
      orderId: r._id,
      orderNumber: r.orderNumber,
      ledgerTotal: r.ledgerTotal,
      cached: r.cached || 0,
      delta: r.delta,
    })),
  };
};

const checkI5_uniqueOpenAccrual = async () => {
  // Duplicate open accruals/backfills for the same (orderId, sellerId)
  // would defeat the partial unique index. Direct aggregation check.
  const dupes = await Commission.aggregate([
    {
      $match: {
        type:   { $in: ["accrual", "backfill"] },
        status: { $in: ["pending", "confirmed"] },
      },
    },
    {
      $group: {
        _id: { orderId: "$orderId", sellerId: "$sellerId" },
        count: { $sum: 1 },
        rowIds: { $push: "$_id" },
      },
    },
    { $match: { count: { $gt: 1 } } },
    { $limit: 1000 },
  ]);

  return {
    name: "I5 — at most one open accrual per (order, seller)",
    total: dupes.length,
    violations: dupes.map((r) => ({
      orderId: r._id.orderId,
      sellerId: r._id.sellerId,
      duplicateCount: r.count,
      rowIds: r.rowIds.slice(0, 4),
    })),
  };
};

const checkI6_reversalsReferToRealEntries = async ({ from, to }) => {
  // Every reversal must point at a real prior entry, and that prior entry
  // must be in status="reversed".
  const match = { type: "reversal", ...buildCommissionDateMatch(from, to) };

  const allReversals = await Commission.aggregate([
    { $match: match },
    {
      $lookup: {
        from: Commission.collection.name,
        localField: "reversesEntryId",
        foreignField: "_id",
        as: "parent",
      },
    },
    {
      $project: {
        _id: 1,
        orderNumber: 1,
        reversesEntryId: 1,
        parentExists: { $gt: [{ $size: "$parent" }, 0] },
        parentStatus: { $arrayElemAt: ["$parent.status", 0] },
      },
    },
    {
      $match: {
        $or: [
          { reversesEntryId: null },
          { parentExists: false },
          { parentStatus: { $ne: "reversed" } },
        ],
      },
    },
    { $limit: 1000 },
  ]);

  return {
    name: "I6 — reversals reference a valid reversed parent",
    total: allReversals.length,
    violations: allReversals.map((r) => ({
      rowId: r._id,
      orderNumber: r.orderNumber,
      reversesEntryId: r.reversesEntryId,
      reason: !r.reversesEntryId
        ? "reversesEntryId is null"
        : !r.parentExists
          ? "parent commission row missing"
          : `parent status='${r.parentStatus}' (expected 'reversed')`,
    })),
  };
};

// ─────────────────────────────────────────────────────────────────────────
// Renderer
// ─────────────────────────────────────────────────────────────────────────

const renderReport = (results) => {
  console.log("\n═══════════════════════════════════════════════════════════════════════");
  console.log("COMMISSION DOCTOR  —  Invariant Audit");
  console.log("═══════════════════════════════════════════════════════════════════════\n");

  let totalIssues = 0;
  for (const r of results) {
    const marker = r.total === 0 ? "✓" : "✗";
    const tone   = r.total === 0 ? "PASS" : "FAIL";
    console.log(`${marker} ${tone}  ${r.name}`);
    console.log(`         violations: ${r.total}`);
    totalIssues += r.total;

    if (r.total > 0) {
      const sample = r.violations.slice(0, SAMPLE_SIZE);
      console.log(`         sample (${sample.length} of ${r.total}):`);
      for (const v of sample) {
        const summary = Object.entries(v)
          .map(([k, val]) => `${k}=${typeof val === "object" ? JSON.stringify(val) : val}`)
          .join("  ");
        console.log(`           - ${summary}`);
      }
    }
    console.log("");
  }

  console.log("───────────────────────────────────────────────────────────────────────");
  console.log(totalIssues === 0
    ? "All invariants passed. Ledger is healthy."
    : `Found ${totalIssues} invariant violation(s) across ${results.filter((r) => r.total > 0).length} check(s).`);
  console.log("───────────────────────────────────────────────────────────────────────\n");
  return totalIssues;
};

// ─────────────────────────────────────────────────────────────────────────
// Entry point
// ─────────────────────────────────────────────────────────────────────────

const main = async () => {
  const opts = parseArgs();

  try {
    await connectDB();
  } catch (e) {
    console.error("Failed to connect to MongoDB:", e.message);
    process.exit(2);
  }

  const checks = [
    () => checkI1_orphanCommissions(opts),
    () => checkI2_deliveredOrdersHaveNoPending(opts),
    () => checkI3_terminatedOrdersNetZero(opts),
    () => checkI4_summaryCacheMatchesLedger(opts),
    () => checkI5_uniqueOpenAccrual(),
    () => checkI6_reversalsReferToRealEntries(opts),
  ];

  const results = [];
  for (const fn of checks) {
    try {
      const r = await fn();
      results.push(r);
      if (opts.failFast && r.total > 0) break;
    } catch (err) {
      console.error(`\n✗ Check threw an error: ${err.message}`);
      console.error(err.stack);
      await mongoose.disconnect();
      process.exit(2);
    }
  }

  let exitCode = 0;
  if (opts.json) {
    const payload = {
      ranAt: new Date().toISOString(),
      filters: { from: opts.from || null, to: opts.to || null },
      results,
      summary: {
        totalChecks: results.length,
        failedChecks: results.filter((r) => r.total > 0).length,
        totalViolations: results.reduce((s, r) => s + r.total, 0),
      },
    };
    console.log(JSON.stringify(payload, null, 2));
    exitCode = payload.summary.totalViolations > 0 ? 1 : 0;
  } else {
    exitCode = renderReport(results) > 0 ? 1 : 0;
  }

  await mongoose.disconnect();
  process.exit(exitCode);
};

main();
