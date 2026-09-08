/**
 * Commission Backfill Migration
 * ─────────────────────────────────────────────────────────────────────────
 * Walks historical Order documents and creates `Commission` ledger entries
 * for orders that pre-date the commission system. Designed to be safe to
 * re-run: every write is gated by an idempotency check that consults the
 * existing ledger before inserting.
 *
 * ELIGIBILITY (default policy):
 *   • Order has at least one line item with sellerId set
 *   • Order.status ∈ ELIGIBLE_STATUSES (configurable below)
 *   • No active (pending|confirmed) Commission row already exists for that
 *     (orderId, sellerId) pair — checked per-seller, not per-order
 *
 * STATUS MAPPING:
 *   • Delivered      → backfill entry status = "confirmed"
 *   • All other live → backfill entry status = "pending"
 *   • Cancelled/Returned/Refunded → skipped (never get backfilled)
 *
 * MODES:
 *   --dry-run          (default OFF) compute & report, no DB writes
 *   --rollback         delete every type="backfill" row, regardless of status
 *   --confirm          required guard for live runs (write or rollback)
 *   --limit=N          process only the first N eligible orders
 *   --from=YYYY-MM-DD  only consider orders createdAt >= this date
 *   --to=YYYY-MM-DD    only consider orders createdAt <= this date
 *   --order-id=...     restrict to a single Mongo order id (debug helper)
 *
 * EXIT CODES:
 *   0 success
 *   1 invalid arguments or runtime failure
 *   2 confirm guard missing on a write/rollback invocation
 *
 * Usage:
 *   # Dry run (recommended first step) — prints a per-order plan + totals
 *   node scripts/backfill-commissions.js --dry-run
 *
 *   # Live migration (writes type="backfill" rows + updates Order.commissionSummary)
 *   node scripts/backfill-commissions.js --confirm
 *
 *   # Rollback (deletes every backfill row; existing accruals untouched)
 *   node scripts/backfill-commissions.js --rollback --confirm
 *
 *   # Slice for staging tests
 *   node scripts/backfill-commissions.js --dry-run --limit=50 --from=2025-01-01
 */
"use strict";

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const connectDB  = require("../src/config/db");
const Order      = require("../src/models/Order");
const Setting    = require("../src/models/Setting");
const Commission = require("../src/models/Commission");
const {
  backfillCommissionsForOrder,
  recomputeOrderSummary,
} = require("../src/services/commissionService");

// ─────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────

const ELIGIBLE_STATUSES = new Set([
  "Processing",
  "Confirmed",
  "Packed",
  "Partially Shipped",
  "Shipped",
  "Out for Delivery",
  "Delivered",
]);

const SKIPPED_STATUSES = new Set([
  "Cancelled",
  "Returned",
  "Return Requested",
  "Refunded",
  "Pending",
]);

const BATCH_SIZE = 200;

// ─────────────────────────────────────────────────────────────────────────
// CLI parsing
// ─────────────────────────────────────────────────────────────────────────

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = {
    dryRun:   args.includes("--dry-run"),
    rollback: args.includes("--rollback"),
    confirm:  args.includes("--confirm"),
    limit:    null,
    from:     null,
    to:       null,
    orderId:  null,
  };

  for (const raw of args) {
    if (raw.startsWith("--limit=")) {
      const n = Number.parseInt(raw.slice("--limit=".length), 10);
      if (Number.isFinite(n) && n > 0) opts.limit = n;
    } else if (raw.startsWith("--from=")) {
      const d = new Date(raw.slice("--from=".length));
      if (!Number.isNaN(d.getTime())) opts.from = d;
    } else if (raw.startsWith("--to=")) {
      const d = new Date(raw.slice("--to=".length));
      if (!Number.isNaN(d.getTime())) opts.to = d;
    } else if (raw.startsWith("--order-id=")) {
      const v = raw.slice("--order-id=".length);
      if (mongoose.Types.ObjectId.isValid(v)) opts.orderId = v;
    }
  }
  return opts;
};

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────

const formatINR = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const pad = (s, n) => String(s).padEnd(n, " ");

const buildQuery = ({ from, to, orderId }) => {
  const q = { "items.sellerId": { $exists: true, $ne: null } };
  if (orderId) q._id = new mongoose.Types.ObjectId(orderId);
  if (from || to) {
    q.createdAt = {};
    if (from) q.createdAt.$gte = from;
    if (to)   q.createdAt.$lte = to;
  }
  return q;
};

const summariseTotals = (rows) =>
  rows.reduce(
    (acc, r) => {
      acc.entriesPlanned += r.entriesPlanned;
      acc.amountPlanned  += r.amountPlanned;
      acc.entriesWritten += r.entriesWritten || 0;
      acc.amountWritten  += r.amountWritten  || 0;
      return acc;
    },
    { entriesPlanned: 0, amountPlanned: 0, entriesWritten: 0, amountWritten: 0 }
  );

// ─────────────────────────────────────────────────────────────────────────
// Rollback path
// ─────────────────────────────────────────────────────────────────────────

const runRollback = async ({ dryRun, from, to, orderId }) => {
  console.log("───────────────────────────────────────────────────────────");
  console.log("ROLLBACK  Removing type=\"backfill\" ledger entries");
  if (from)    console.log(`         createdAt >= ${from.toISOString()}`);
  if (to)      console.log(`         createdAt <= ${to.toISOString()}`);
  if (orderId) console.log(`         orderId   == ${orderId}`);
  console.log("───────────────────────────────────────────────────────────");

  const filter = { type: "backfill" };
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = from;
    if (to)   filter.createdAt.$lte = to;
  }
  if (orderId) filter.orderId = new mongoose.Types.ObjectId(orderId);

  const count = await Commission.countDocuments(filter);
  console.log(`Found ${count} backfill row(s) matching the filter.\n`);

  if (count === 0) return { rowsDeleted: 0, ordersTouched: 0 };

  if (dryRun) {
    const sample = await Commission.find(filter).sort({ createdAt: -1 }).limit(5).lean();
    console.log("Sample rows that would be deleted:");
    for (const r of sample) {
      console.log(`  • ${r._id}  order=${r.orderNumber}  seller=${r.sellerId}  ${formatINR(r.commissionAmount)}  status=${r.status}`);
    }
    return { rowsDeleted: 0, ordersTouched: 0, dryRun: true };
  }

  // Capture affected order IDs so we can recompute their summaries afterwards.
  const orderIds = await Commission.distinct("orderId", filter);
  const result = await Commission.deleteMany(filter);
  console.log(`Deleted ${result.deletedCount} row(s).`);
  console.log(`Recomputing commissionSummary for ${orderIds.length} order(s)…`);

  let recomputed = 0;
  for (const id of orderIds) {
    try {
      await recomputeOrderSummary(id);
      recomputed++;
    } catch (e) {
      console.log(`  ! Failed to recompute summary for ${id}: ${e.message}`);
    }
  }
  console.log(`Recomputed ${recomputed} of ${orderIds.length} affected orders.`);

  // Clear settings.commissionBackfilledAt so we can rerun cleanly.
  await Setting.updateOne({}, { $set: { commissionBackfilledAt: null } });
  return { rowsDeleted: result.deletedCount, ordersTouched: orderIds.length };
};

// ─────────────────────────────────────────────────────────────────────────
// Backfill (forward) path
// ─────────────────────────────────────────────────────────────────────────

const runBackfill = async ({ dryRun, from, to, orderId, limit }) => {
  console.log("───────────────────────────────────────────────────────────");
  console.log(`${dryRun ? "DRY RUN " : "BACKFILL"}  Creating type="backfill" ledger entries`);
  if (from)    console.log(`         createdAt >= ${from.toISOString()}`);
  if (to)      console.log(`         createdAt <= ${to.toISOString()}`);
  if (orderId) console.log(`         orderId   == ${orderId}`);
  if (limit)   console.log(`         limit     == ${limit}`);
  console.log("───────────────────────────────────────────────────────────");

  const query = buildQuery({ from, to, orderId });
  const total = await Order.countDocuments(query);
  console.log(`Found ${total} candidate order(s) for backfill (before status filter).\n`);

  const cursor = Order.find(query).sort({ createdAt: 1 }).cursor({ batchSize: BATCH_SIZE });

  const rows = [];
  let processed         = 0;
  let skippedStatus     = 0;
  let skippedNoSellers  = 0;
  let writtenOrders     = 0;
  let alreadyHasEntries = 0;

  for await (const order of cursor) {
    if (limit && processed >= limit) break;
    processed++;

    const status = String(order.status || "");
    if (!ELIGIBLE_STATUSES.has(status)) {
      if (SKIPPED_STATUSES.has(status)) skippedStatus++;
      else skippedStatus++; // unknown statuses also skipped, accounted separately if needed
      continue;
    }

    const items = Array.isArray(order.items) ? order.items : [];
    const sellerIds = [...new Set(items.map((i) => i?.sellerId ? String(i.sellerId) : null).filter(Boolean))];
    if (sellerIds.length === 0) {
      skippedNoSellers++;
      continue;
    }

    const statusForEntries = status === "Delivered" ? "confirmed" : "pending";

    // Per-seller pre-check: if every involved seller already has an open
    // accrual/backfill for this order, do not even invoke the service.
    const existingCount = await Commission.countDocuments({
      orderId: order._id,
      sellerId: { $in: sellerIds.map((id) => new mongoose.Types.ObjectId(id)) },
      type:   { $in: ["accrual", "backfill"] },
      status: { $in: ["pending", "confirmed"] },
    });
    if (existingCount >= sellerIds.length) {
      alreadyHasEntries++;
      continue;
    }

    const result = await backfillCommissionsForOrder(order, {
      statusForEntries,
      dryRun,
      safe: true,
    });

    if (!result.ok) {
      console.log(`  ! ${order.orderId || order._id}: ${result.error}`);
      continue;
    }

    const plan      = Array.isArray(result.plan)    ? result.plan    : [];
    const created   = Array.isArray(result.entries) ? result.entries : [];
    const newRows   = plan.filter((p) => !p.skipped);

    if (newRows.length === 0) {
      alreadyHasEntries++;
      continue;
    }

    const amountPlanned = newRows.reduce((s, p) => s + Number(p.commissionAmount || 0), 0);
    const amountWritten = created.reduce((s, c) => s + Number(c.commissionAmount || 0), 0);

    rows.push({
      orderId:        order._id,
      orderNumber:    order.orderId || String(order._id),
      orderStatus:    status,
      entryStatus:    statusForEntries,
      entriesPlanned: newRows.length,
      amountPlanned,
      entriesWritten: created.length,
      amountWritten,
    });

    if (created.length > 0) writtenOrders++;

    if (rows.length % 25 === 0) {
      const t = summariseTotals(rows);
      console.log(
        `  …processed ${pad(processed, 6)} candidates • new ledger lines: ${pad(t.entriesPlanned, 6)} • ${formatINR(t.amountPlanned)}`
      );
    }
  }

  const totals = summariseTotals(rows);

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("BACKFILL SUMMARY");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`Candidates scanned          : ${processed}`);
  console.log(`Eligible orders touched     : ${rows.length}`);
  console.log(`  → with new entries        : ${writtenOrders}`);
  console.log(`  → already fully backfilled: ${alreadyHasEntries}`);
  console.log(`Skipped (status filter)     : ${skippedStatus}`);
  console.log(`Skipped (no sellerIds)      : ${skippedNoSellers}`);
  console.log("───────────────────────────────────────────────────────────");
  console.log(`New entries planned         : ${totals.entriesPlanned}`);
  console.log(`Amount planned              : ${formatINR(totals.amountPlanned)}`);
  if (!dryRun) {
    console.log(`New entries written         : ${totals.entriesWritten}`);
    console.log(`Amount written              : ${formatINR(totals.amountWritten)}`);
  }
  console.log("═══════════════════════════════════════════════════════════\n");

  if (rows.length > 0 && rows.length <= 25) {
    console.log("Per-order detail:");
    for (const r of rows) {
      console.log(
        `  ${pad(r.orderNumber, 18)} status=${pad(r.orderStatus, 18)} entry=${pad(r.entryStatus, 9)} entries=${pad(r.entriesPlanned, 3)} amount=${formatINR(r.amountPlanned)}`
      );
    }
    console.log();
  }

  if (!dryRun && totals.entriesWritten > 0) {
    await Setting.updateOne({}, { $set: { commissionBackfilledAt: new Date() } });
    console.log("Stamped Setting.commissionBackfilledAt = now()\n");
  }

  return { processed, written: totals.entriesWritten, amount: totals.amountWritten };
};

// ─────────────────────────────────────────────────────────────────────────
// Entry point
// ─────────────────────────────────────────────────────────────────────────

const main = async () => {
  const opts = parseArgs();

  if (!opts.dryRun && !opts.confirm) {
    console.error("\n✗ Refusing to run a destructive operation without --confirm.");
    console.error("  Re-run with --dry-run to preview, or add --confirm to apply.\n");
    process.exit(2);
  }

  await connectDB();
  console.log(`Connected. Mode: ${opts.rollback ? "ROLLBACK" : "BACKFILL"} • ${opts.dryRun ? "dry-run" : "live"}`);

  try {
    // Ensure Commission indexes are live so the partial unique constraint kicks in
    await Commission.syncIndexes();

    if (opts.rollback) {
      await runRollback(opts);
    } else {
      await runBackfill(opts);
    }
  } catch (err) {
    console.error("\n✗ Backfill failed:", err.message);
    console.error(err.stack);
    await mongoose.disconnect();
    process.exit(1);
  }

  await mongoose.disconnect();
  console.log("Disconnected. Done.");
  process.exit(0);
};

main();
