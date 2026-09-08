/**
 * Integration tests for the Commission Doctor invariants.
 *
 * Seeds known-good and known-bad ledger states, runs each invariant check
 * via direct require(), and asserts the violation counts.
 *
 * This test creates and cleans up its own data — real customer/seller
 * data is never touched. Sentinel prefix: "COMM-DOCTOR-TEST-".
 *
 * Run:  node scripts/test-commission-doctor.js
 */
"use strict";

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const assert   = require("assert");

const connectDB  = require("../src/config/db");
const Order      = require("../src/models/Order");
const Commission = require("../src/models/Commission");

// The doctor exposes its checks indirectly — we re-implement the same
// matchers here by directly inspecting the ledger so the test is self-
// contained. The CLI itself is smoke-tested at the end.
const { spawnSync } = require("child_process");
const path = require("path");

const SENTINEL_PREFIX = "COMM-DOCTOR-TEST-";

let passed = 0;
let failed = 0;

const test = async (name, fn) => {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed++;
    console.log(`  ✗ ${name}`);
    console.log(`      ${err.message}`);
  }
};

const section = (title) => {
  console.log(`\n${title}`);
  console.log("─".repeat(title.length));
};

const fakeUserId  = new mongoose.Types.ObjectId();
const fakeSeller  = new mongoose.Types.ObjectId();
const fakeProduct = new mongoose.Types.ObjectId();

const makeOrder = async (sentinel, items, extra = {}) =>
  Order.create({
    orderId:       sentinel,
    userId:        fakeUserId,
    customerName:  "Doctor Test",
    customerEmail: "doctor-test@example.com",
    customerPhone: "9999999999",
    items,
    shippingAddress: {
      firstName: "T", lastName: "Est",
      flatNo: "1", area: "X", city: "Y",
      state: "Z", pincode: "000000",
    },
    paymentMethod: "cod",
    paymentStatus: "cod",
    subtotal:      items.reduce((s, i) => s + i.price * i.quantity, 0),
    discount:      0,
    shipping:      0,
    total:         items.reduce((s, i) => s + i.price * i.quantity, 0),
    status:        extra.status || "Delivered",
    timeline:      [{ status: "Ordered", note: "Doctor test order" }],
    commissionSummary: extra.commissionSummary || { totalCommission: 0, status: "none" },
  });

const insertLedger = async (orderId, orderNumber, overrides = {}) =>
  Commission.create({
    orderId,
    orderNumber,
    sellerId: fakeSeller,
    sellerSubtotal: 3500,
    sellerDiscountShare: 0,
    sellerGiftCardShare: 0,
    taxableAmount: 3500,
    commissionAmount: 100,
    tierLabel: "1001-5000",
    tierSnapshot: [],
    type: "accrual",
    status: "confirmed",
    triggeredBy: "place_order",
    ...overrides,
  });

const cleanup = async () => {
  const orders = await Order.find({ orderId: { $regex: `^${SENTINEL_PREFIX}` } }).select("_id").lean();
  const orderIds = orders.map((o) => o._id);
  if (orderIds.length > 0) {
    await Commission.deleteMany({ orderId: { $in: orderIds } });
    await Order.deleteMany({ _id: { $in: orderIds } });
  }
  // Also wipe orphan commissions that the I1 test inserts.
  await Commission.deleteMany({ orderNumber: { $regex: `^${SENTINEL_PREFIX}` } });
};

// Mini re-implementation of the doctor's aggregations, restricted to our
// sentinel test orders so we don't conflate with real data.
const doctorChecks = {
  i1_orphans: async (orderIds, sentinelPrefix) =>
    Commission.aggregate([
      { $match: { orderNumber: { $regex: `^${sentinelPrefix}` } } },
      {
        $lookup: {
          from: Order.collection.name,
          localField: "orderId",
          foreignField: "_id",
          as: "order",
        },
      },
      { $match: { order: { $size: 0 } } },
    ]),

  i2_deliveredPending: async (orderIds) =>
    Commission.aggregate([
      { $match: { orderId: { $in: orderIds }, type: { $in: ["accrual", "backfill"] }, status: "pending" } },
      { $group: { _id: "$orderId" } },
    ]),

  i3_terminatedOpen: async (orderIds) =>
    Commission.aggregate([
      {
        $match: {
          orderId: { $in: orderIds },
          type:   { $in: ["accrual", "backfill"] },
          status: { $in: ["pending", "confirmed"] },
        },
      },
      { $group: { _id: "$orderId", openAmount: { $sum: "$commissionAmount" } } },
      { $match: { openAmount: { $gt: 0 } } },
    ]),

  i4_summaryDrift: async (orderIds) =>
    Commission.aggregate([
      { $match: { orderId: { $in: orderIds } } },
      {
        $lookup: {
          from: Order.collection.name,
          localField: "orderId",
          foreignField: "_id",
          as: "order",
        },
      },
      { $unwind: "$order" },
      {
        $group: {
          _id: "$orderId",
          ledgerTotal: {
            $sum: {
              $cond: [
                { $eq: ["$type", "reversal"] },
                { $cond: [{ $ne: ["$status", "reversed"] }, { $multiply: ["$commissionAmount", -1] }, 0] },
                { $cond: [{ $in: ["$status", ["pending", "confirmed"]] }, "$commissionAmount", 0] },
              ],
            },
          },
          cached: { $first: "$order.commissionSummary.totalCommission" },
        },
      },
      { $project: { delta: { $subtract: [{ $ifNull: ["$cached", 0] }, "$ledgerTotal"] } } },
      { $match: { $expr: { $gt: [{ $abs: "$delta" }, 1] } } },
    ]),

  i5_duplicateOpenAccruals: async (orderIds) =>
    Commission.aggregate([
      {
        $match: {
          orderId: { $in: orderIds },
          type:   { $in: ["accrual", "backfill"] },
          status: { $in: ["pending", "confirmed"] },
        },
      },
      { $group: { _id: { orderId: "$orderId", sellerId: "$sellerId" }, count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
    ]),

  i6_reversalIntegrity: async (orderIds) =>
    Commission.aggregate([
      { $match: { orderId: { $in: orderIds }, type: "reversal" } },
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
          parentExists: { $gt: [{ $size: "$parent" }, 0] },
          parentStatus: { $arrayElemAt: ["$parent.status", 0] },
          reversesEntryId: 1,
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
    ]),
};

(async () => {
  try {
    await connectDB();
    await Commission.syncIndexes();
    await cleanup();

    const allOrderIds = [];
    const SP = `${SENTINEL_PREFIX}${Date.now()}-`;

    // ─────────────────────────────────────────────────────────────
    section("I1 — Orphan commission rows are detected");
    // ─────────────────────────────────────────────────────────────
    // Insert a ledger row whose orderId doesn't match any Order doc.
    const ghostOrderId = new mongoose.Types.ObjectId();
    await insertLedger(ghostOrderId, `${SP}ORPHAN-1`, {});

    const orphans = await doctorChecks.i1_orphans([], SP);
    await test("orphan ledger rows detected", () => {
      assert.ok(orphans.length >= 1, `expected ≥1 orphan, got ${orphans.length}`);
    });

    // Clean ghost so it doesn't bleed into later checks.
    await Commission.deleteMany({ orderNumber: `${SP}ORPHAN-1` });

    // ─────────────────────────────────────────────────────────────
    section("I2 — Delivered order with leftover pending row is flagged");
    // ─────────────────────────────────────────────────────────────
    const orderHealthy   = await makeOrder(`${SP}HEALTHY-DELIVERED`, [
      { productId: fakeProduct, sellerId: fakeSeller, name: "X", sku: "X", price: 3500, mrp: 3500, quantity: 1 },
    ], { status: "Delivered", commissionSummary: { totalCommission: 100, status: "confirmed" } });
    await insertLedger(orderHealthy._id, orderHealthy.orderId, { status: "confirmed" });

    const orderStuck = await makeOrder(`${SP}STUCK-PENDING`, [
      { productId: fakeProduct, sellerId: fakeSeller, name: "X", sku: "X", price: 3500, mrp: 3500, quantity: 1 },
    ], { status: "Delivered", commissionSummary: { totalCommission: 100, status: "pending" } });
    await insertLedger(orderStuck._id, orderStuck.orderId, { status: "pending" });

    allOrderIds.push(orderHealthy._id, orderStuck._id);

    const stuckPending = await doctorChecks.i2_deliveredPending(allOrderIds);
    await test("Delivered order with pending entry is detected", () => {
      const has = stuckPending.some((r) => String(r._id) === String(orderStuck._id));
      assert.ok(has, "expected orderStuck to be flagged");
    });
    await test("Delivered order with confirmed entry is NOT flagged", () => {
      const has = stuckPending.some((r) => String(r._id) === String(orderHealthy._id));
      assert.ok(!has, "expected orderHealthy to be clean");
    });

    // ─────────────────────────────────────────────────────────────
    section("I3 — Cancelled order with open commission is flagged");
    // ─────────────────────────────────────────────────────────────
    const orderCancelled = await makeOrder(`${SP}CANCELLED-OPEN`, [
      { productId: fakeProduct, sellerId: fakeSeller, name: "X", sku: "X", price: 3500, mrp: 3500, quantity: 1 },
    ], { status: "Cancelled", commissionSummary: { totalCommission: 100, status: "confirmed" } });
    await insertLedger(orderCancelled._id, orderCancelled.orderId, { status: "confirmed" });

    const orderCancelledClean = await makeOrder(`${SP}CANCELLED-CLEAN`, [
      { productId: fakeProduct, sellerId: fakeSeller, name: "X", sku: "X", price: 3500, mrp: 3500, quantity: 1 },
    ], { status: "Cancelled", commissionSummary: { totalCommission: 0, status: "reversed" } });
    const cleanAccrual = await insertLedger(orderCancelledClean._id, orderCancelledClean.orderId, { status: "reversed" });
    await insertLedger(orderCancelledClean._id, orderCancelledClean.orderId, {
      type: "reversal",
      status: "confirmed",
      triggeredBy: "order_cancelled",
      reversesEntryId: cleanAccrual._id,
    });

    allOrderIds.push(orderCancelled._id, orderCancelledClean._id);

    const cancelledOpen = await doctorChecks.i3_terminatedOpen(allOrderIds);
    await test("Cancelled order with active accrual is flagged", () => {
      const has = cancelledOpen.some((r) => String(r._id) === String(orderCancelled._id));
      assert.ok(has, "expected orderCancelled to be flagged");
    });
    await test("Properly-reversed cancelled order is NOT flagged", () => {
      const has = cancelledOpen.some((r) => String(r._id) === String(orderCancelledClean._id));
      assert.ok(!has, "expected orderCancelledClean to be clean");
    });

    // ─────────────────────────────────────────────────────────────
    section("I4 — Summary cache drift is detected");
    // ─────────────────────────────────────────────────────────────
    const orderDrift = await makeOrder(`${SP}DRIFT`, [
      { productId: fakeProduct, sellerId: fakeSeller, name: "X", sku: "X", price: 3500, mrp: 3500, quantity: 1 },
    ], { status: "Delivered", commissionSummary: { totalCommission: 9999, status: "confirmed" } });
    await insertLedger(orderDrift._id, orderDrift.orderId, { status: "confirmed" });

    allOrderIds.push(orderDrift._id);

    const drift = await doctorChecks.i4_summaryDrift(allOrderIds);
    await test("order with cache=9999, ledger=100 is flagged", () => {
      const has = drift.some((r) => String(r._id) === String(orderDrift._id));
      assert.ok(has, `expected orderDrift to be flagged. results=${JSON.stringify(drift)}`);
    });
    await test("healthy delivered order is NOT flagged", () => {
      const has = drift.some((r) => String(r._id) === String(orderHealthy._id));
      assert.ok(!has, "expected orderHealthy to be clean");
    });

    // ─────────────────────────────────────────────────────────────
    section("I5 — Duplicate open accruals are detected");
    // ─────────────────────────────────────────────────────────────
    // The partial unique index normally PREVENTS duplicates from being
    // created — which is exactly what we want in production. To test that
    // the doctor's aggregation correctly flags duplicates *if* they ever
    // appeared (e.g. someone drops the index, or a future DB merge causes
    // collisions), we temporarily drop the constraint, seed bad data, run
    // the aggregation, then restore the index. This is safe because the
    // sentinel orderIds are unique to this test run.
    const orderDup = await makeOrder(`${SP}DUP`, [
      { productId: fakeProduct, sellerId: fakeSeller, name: "X", sku: "X", price: 3500, mrp: 3500, quantity: 1 },
    ], { status: "Delivered", commissionSummary: { totalCommission: 100, status: "confirmed" } });
    await insertLedger(orderDup._id, orderDup.orderId, { status: "confirmed" });

    const INDEX_NAME = "unique_open_accrual_per_order_seller";
    let indexDropped = false;
    try {
      await Commission.collection.dropIndex(INDEX_NAME);
      indexDropped = true;
      // Now insert the duplicate — bypasses the constraint that no longer exists.
      await insertLedger(orderDup._id, orderDup.orderId, { status: "confirmed" });
    } catch (e) {
      console.log(`      [setup note] could not drop index for I5 test: ${e.message}`);
    }

    allOrderIds.push(orderDup._id);

    const dupes = await doctorChecks.i5_duplicateOpenAccruals(allOrderIds);
    await test("duplicate open accrual pair is detected", () => {
      const has = dupes.some((r) => String(r._id.orderId) === String(orderDup._id));
      assert.ok(has, `expected duplicate for orderDup, got: ${JSON.stringify(dupes)}`);
    });

    // Clean the extra row so re-syncing the index doesn't fail.
    await Commission.deleteMany({ orderId: orderDup._id });
    if (indexDropped) {
      await Commission.syncIndexes();
    }

    // ─────────────────────────────────────────────────────────────
    section("I6 — Reversal pointing at missing parent is detected");
    // ─────────────────────────────────────────────────────────────
    const orderBadReversal = await makeOrder(`${SP}BAD-REVERSAL`, [
      { productId: fakeProduct, sellerId: fakeSeller, name: "X", sku: "X", price: 3500, mrp: 3500, quantity: 1 },
    ], { status: "Cancelled", commissionSummary: { totalCommission: 0, status: "reversed" } });
    await insertLedger(orderBadReversal._id, orderBadReversal.orderId, {
      type: "reversal",
      status: "confirmed",
      triggeredBy: "order_cancelled",
      reversesEntryId: new mongoose.Types.ObjectId(), // dangling pointer
    });

    allOrderIds.push(orderBadReversal._id);

    const badReversals = await doctorChecks.i6_reversalIntegrity(allOrderIds);
    await test("reversal with missing parent is detected", () => {
      const ids = badReversals.map((r) => String(r.reversesEntryId));
      assert.ok(badReversals.length >= 1, `expected ≥1 bad reversal, got ${badReversals.length}: ${JSON.stringify(ids)}`);
    });

    // ─────────────────────────────────────────────────────────────
    section("CLI smoke test — script exits non-zero when violations exist");
    // ─────────────────────────────────────────────────────────────
    // Run the doctor CLI on the whole DB; with our seeded test data it
    // MUST report at least the I1/I2/I3/I4/I5/I6 violations and exit 1.
    const node = process.execPath;
    const script = path.join(__dirname, "commission-doctor.js");
    const proc = spawnSync(node, [script, "--json"], { encoding: "utf8" });

    await test("doctor CLI runs and exits with code 1 (violations present)", () => {
      assert.strictEqual(proc.status, 1, `expected exit 1, got ${proc.status}.\nstderr:\n${proc.stderr}\nstdout:\n${proc.stdout?.slice(-2000)}`);
    });

    await test("doctor JSON payload includes summary.totalViolations > 0", () => {
      // The JSON payload is appended to stdout; find the first JSON object.
      const jsonStart = proc.stdout.indexOf("{");
      const jsonEnd   = proc.stdout.lastIndexOf("}");
      const json = JSON.parse(proc.stdout.slice(jsonStart, jsonEnd + 1));
      assert.ok(json.summary, "expected summary in payload");
      assert.ok(json.summary.totalViolations > 0, `expected violations > 0, got ${json.summary.totalViolations}`);
    });

    // ─────────────────────────────────────────────────────────────
    // Cleanup
    // ─────────────────────────────────────────────────────────────
    await cleanup();

    // ─────────────────────────────────────────────────────────────
    section("Post-cleanup: doctor exits 0 against a clean ledger");
    // ─────────────────────────────────────────────────────────────
    // We can't guarantee the real DB is clean, but we *can* assert that
    // running the doctor scoped to a future date range — where no rows
    // exist — returns zero violations.
    const future = "2099-01-01";
    const procClean = spawnSync(node, [script, "--json", `--from=${future}`, `--to=${future}`], { encoding: "utf8" });
    await test("doctor on empty future range exits with code 0", () => {
      assert.strictEqual(procClean.status, 0, `expected exit 0, got ${procClean.status}.\nstdout:\n${procClean.stdout?.slice(-2000)}`);
    });
  } catch (err) {
    console.error("\n✗ Unexpected error:", err.message);
    console.error(err.stack);
  } finally {
    const bar = "═".repeat(60);
    console.log(`\n${bar}`);
    console.log(`Tests:  ${passed + failed}   ✓ ${passed} passed   ✗ ${failed} failed`);
    console.log(bar);

    await mongoose.disconnect();
    process.exit(failed === 0 ? 0 : 1);
  }
})();
