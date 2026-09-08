/**
 * Integration tests for the backfill service path.
 *
 * Verifies (against a real Mongo connection):
 *   1. backfillCommissionsForOrder writes type="backfill" rows with the
 *      requested status and matches accrual math.
 *   2. dryRun=true never writes rows but still returns a coherent plan.
 *   3. Existing open accruals make backfill a no-op (per seller).
 *   4. Order.commissionSummary is recomputed correctly after backfill.
 *   5. Multi-seller backfill skips only the seller that already has an entry.
 *   6. Backfilled-then-reversed orders survive a re-run idempotently.
 *
 * Run:  node scripts/test-commission-backfill.js
 */
"use strict";

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const assert   = require("assert");

const connectDB  = require("../src/config/db");
const Order      = require("../src/models/Order");
const Setting    = require("../src/models/Setting");
const Commission = require("../src/models/Commission");
const {
  accrueCommissionsForOrder,
  backfillCommissionsForOrder,
  reverseCommissionsForOrder,
} = require("../src/services/commissionService");

const SENTINEL_PREFIX = "COMM-BACKFILL-TEST-";

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

const fakeUserId   = new mongoose.Types.ObjectId();
const fakeSellerA  = new mongoose.Types.ObjectId();
const fakeSellerB  = new mongoose.Types.ObjectId();
const fakeProductA = new mongoose.Types.ObjectId();
const fakeProductB = new mongoose.Types.ObjectId();
const fakeVariantA = new mongoose.Types.ObjectId();
const fakeVariantB = new mongoose.Types.ObjectId();

const makeOrder = async (sentinel, items, extra = {}) =>
  Order.create({
    orderId:       sentinel,
    userId:        fakeUserId,
    customerName:  "Backfill Test",
    customerEmail: "backfill-test@example.com",
    customerPhone: "9999999999",
    items,
    shippingAddress: {
      firstName: "T", lastName: "Est",
      flatNo: "1", area: "X", city: "Y",
      state: "Z", pincode: "000000",
    },
    paymentMethod:    "cod",
    paymentStatus:    "cod",
    subtotal:         items.reduce((s, i) => s + i.price * i.quantity, 0),
    discount:         extra.discount || 0,
    shipping:         0,
    total:            items.reduce((s, i) => s + i.price * i.quantity, 0) - (extra.discount || 0),
    giftCardDiscount: extra.giftCardDiscount || 0,
    status:           extra.status || "Delivered",
    timeline: [{ status: "Ordered", note: "Backfill test order" }],
  });

const cleanup = async () => {
  const orders   = await Order.find({ orderId: { $regex: `^${SENTINEL_PREFIX}` } }).select("_id").lean();
  const orderIds = orders.map((o) => o._id);
  if (orderIds.length > 0) {
    await Commission.deleteMany({ orderId: { $in: orderIds } });
    await Order.deleteMany({ _id: { $in: orderIds } });
  }
};

(async () => {
  try {
    await connectDB();
    await Commission.syncIndexes();
    await cleanup();

    // ─────────────────────────────────────────────────────────────────
    section("1. Backfill writes a type=\"backfill\" entry with the requested status");
    // ─────────────────────────────────────────────────────────────────
    const sentinel1 = `${SENTINEL_PREFIX}1-${Date.now()}`;
    const order1 = await makeOrder(sentinel1, [
      { productId: fakeProductA, variantId: fakeVariantA, sellerId: fakeSellerA,
        name: "Item A", sku: "A", price: 3500, mrp: 3500, quantity: 1 },
    ], { status: "Delivered" });

    const r1 = await backfillCommissionsForOrder(order1, { statusForEntries: "confirmed" });

    await test("returns ok=true with one created entry", () => {
      assert.strictEqual(r1.ok, true);
      assert.strictEqual(Array.isArray(r1.entries), true);
      assert.strictEqual(r1.entries.length, 1);
    });

    await test("ledger row has type='backfill', status='confirmed', amount=100", async () => {
      const e = await Commission.findOne({ orderId: order1._id }).lean();
      assert.strictEqual(e.type, "backfill");
      assert.strictEqual(e.status, "confirmed");
      assert.strictEqual(e.triggeredBy, "backfill");
      assert.strictEqual(e.commissionAmount, 100);    // 1K-5K tier
      assert.strictEqual(e.tierLabel, "1001-5000");
    });

    await test("Order.commissionSummary reflects the backfill (₹100, confirmed)", async () => {
      const fresh = await Order.findById(order1._id).lean();
      assert.strictEqual(fresh.commissionSummary.totalCommission, 100);
      assert.strictEqual(fresh.commissionSummary.status, "confirmed");
    });

    // ─────────────────────────────────────────────────────────────────
    section("2. dryRun=true never writes rows but returns a plan");
    // ─────────────────────────────────────────────────────────────────
    const sentinel2 = `${SENTINEL_PREFIX}2-${Date.now()}`;
    const order2 = await makeOrder(sentinel2, [
      { productId: fakeProductA, variantId: fakeVariantA, sellerId: fakeSellerA,
        name: "Item A", sku: "A", price: 8000, mrp: 8000, quantity: 1 },
    ], { status: "Shipped" });

    const r2 = await backfillCommissionsForOrder(order2, {
      statusForEntries: "pending",
      dryRun: true,
    });

    await test("dryRun returns ok=true with empty entries", () => {
      assert.strictEqual(r2.ok, true);
      assert.strictEqual(r2.entries.length, 0);
    });

    await test("dryRun plan describes the would-be insert", () => {
      assert.strictEqual(Array.isArray(r2.plan), true);
      const row = r2.plan.find((p) => !p.skipped);
      assert.ok(row, "expected a non-skipped plan row");
      assert.strictEqual(row.commissionAmount, 300);   // 5001-20000 tier
    });

    await test("no ledger row was actually written", async () => {
      const count = await Commission.countDocuments({ orderId: order2._id });
      assert.strictEqual(count, 0);
    });

    // ─────────────────────────────────────────────────────────────────
    section("3. Existing open accrual makes backfill a no-op for that seller");
    // ─────────────────────────────────────────────────────────────────
    const sentinel3 = `${SENTINEL_PREFIX}3-${Date.now()}`;
    const order3 = await makeOrder(sentinel3, [
      { productId: fakeProductA, variantId: fakeVariantA, sellerId: fakeSellerA,
        name: "Item A", sku: "A", price: 7000, mrp: 7000, quantity: 1 },
    ], { status: "Delivered" });

    // Pre-existing accrual via the normal hook
    await accrueCommissionsForOrder(order3, { triggeredBy: "place_order" });

    const before = await Commission.find({ orderId: order3._id }).lean();
    assert.strictEqual(before.length, 1);
    assert.strictEqual(before[0].type, "accrual");

    const r3 = await backfillCommissionsForOrder(order3, { statusForEntries: "confirmed" });

    await test("backfill returns ok=true but writes nothing", () => {
      assert.strictEqual(r3.ok, true);
      assert.strictEqual(r3.entries.length, 0);
    });

    await test("plan marks the seller as skipped (reason='exists')", () => {
      const row = r3.plan.find((p) => String(p.sellerId) === String(fakeSellerA));
      assert.ok(row, "expected plan row for seller A");
      assert.strictEqual(row.skipped, true);
      assert.strictEqual(row.reason, "exists");
    });

    await test("ledger still has the original accrual untouched", async () => {
      const after = await Commission.find({ orderId: order3._id }).lean();
      assert.strictEqual(after.length, 1);
      assert.strictEqual(after[0].type, "accrual");
    });

    // ─────────────────────────────────────────────────────────────────
    section("4. Multi-seller: backfill skips only the seller that already has an entry");
    // ─────────────────────────────────────────────────────────────────
    const sentinel4 = `${SENTINEL_PREFIX}4-${Date.now()}`;
    const order4 = await makeOrder(sentinel4, [
      { productId: fakeProductA, variantId: fakeVariantA, sellerId: fakeSellerA,
        name: "Item A", sku: "A", price: 6000, mrp: 6000, quantity: 1 },
      { productId: fakeProductB, variantId: fakeVariantB, sellerId: fakeSellerB,
        name: "Item B", sku: "B", price: 4000, mrp: 4000, quantity: 1 },
    ], { status: "Delivered" });

    // Pre-seed only seller A
    await Commission.create({
      orderId: order4._id,
      orderNumber: sentinel4,
      sellerId: fakeSellerA,
      sellerSubtotal: 6000,
      sellerDiscountShare: 0,
      sellerGiftCardShare: 0,
      taxableAmount: 6000,
      commissionAmount: 300,
      tierLabel: "5001-20000",
      tierSnapshot: [],
      type: "accrual",
      status: "confirmed",
      triggeredBy: "place_order",
    });

    const r4 = await backfillCommissionsForOrder(order4, { statusForEntries: "confirmed" });

    await test("backfill writes exactly one new row (seller B only)", () => {
      assert.strictEqual(r4.ok, true);
      assert.strictEqual(r4.entries.length, 1);
      assert.strictEqual(String(r4.entries[0].sellerId), String(fakeSellerB));
    });

    await test("ledger now contains both sellers' entries (A=accrual, B=backfill)", async () => {
      const all = await Commission.find({ orderId: order4._id }).sort({ createdAt: 1 }).lean();
      assert.strictEqual(all.length, 2);
      const a = all.find((r) => String(r.sellerId) === String(fakeSellerA));
      const b = all.find((r) => String(r.sellerId) === String(fakeSellerB));
      assert.strictEqual(a.type, "accrual");
      assert.strictEqual(b.type, "backfill");
      assert.strictEqual(b.commissionAmount, 100);   // 1K-5K tier (₹4000 subtotal)
    });

    await test("Order summary aggregates both (₹400, confirmed)", async () => {
      const fresh = await Order.findById(order4._id).lean();
      assert.strictEqual(fresh.commissionSummary.totalCommission, 400);
      assert.strictEqual(fresh.commissionSummary.status, "confirmed");
    });

    // ─────────────────────────────────────────────────────────────────
    section("5. Re-running backfill on the same order is idempotent");
    // ─────────────────────────────────────────────────────────────────
    const r5 = await backfillCommissionsForOrder(order4, { statusForEntries: "confirmed" });

    await test("second backfill produces zero new entries", () => {
      assert.strictEqual(r5.ok, true);
      assert.strictEqual(r5.entries.length, 0);
    });

    await test("ledger row count is unchanged", async () => {
      const count = await Commission.countDocuments({ orderId: order4._id });
      assert.strictEqual(count, 2);
    });

    // ─────────────────────────────────────────────────────────────────
    section("6. Reverse + re-backfill: reversed entries do not block backfill");
    // ─────────────────────────────────────────────────────────────────
    // Reverse order1's backfill, then try to backfill again.
    const reverseRes = await reverseCommissionsForOrder(order1._id, {
      triggeredBy: "order_cancelled",
    });
    assert.strictEqual(reverseRes.ok, true);

    const r6 = await backfillCommissionsForOrder(order1, { statusForEntries: "confirmed" });

    await test("backfill after a full reversal writes a fresh entry", () => {
      assert.strictEqual(r6.ok, true);
      assert.strictEqual(r6.entries.length, 1);
    });

    await test("ledger now has original backfill (reversed), reversal, + new backfill (3 rows)", async () => {
      const all = await Commission.find({ orderId: order1._id }).sort({ createdAt: 1 }).lean();
      assert.strictEqual(all.length, 3);
      const types = all.map((r) => `${r.type}:${r.status}`).sort();
      assert.deepStrictEqual(
        types,
        ["backfill:confirmed", "backfill:reversed", "reversal:confirmed"]
      );
    });

    // ─────────────────────────────────────────────────────────────────
    // Cleanup & summary
    // ─────────────────────────────────────────────────────────────────
    await cleanup();
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
