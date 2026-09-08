/**
 * Integration smoke test for the FULL commission lifecycle.
 *
 * Scenarios (real Mongo, ephemeral fixture orders, full cleanup at the end):
 *   A. Place → confirm on delivery → totals stable, net unchanged
 *   B. Place → reverse on cancellation → net = 0
 *   C. Place → confirm on delivery → reverse via return-refund → net = 0
 *   D. Multi-seller order: place → confirm → reverse one path
 *   E. Idempotency: reversing twice is a no-op (no negative ledger)
 *
 * Customer/seller/product collections are NEVER touched — only Orders and
 * Commissions tagged with the COMM-LIFE- sentinel prefix.
 */
"use strict";

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const assert = require("assert");

const connectDB = require("../src/config/db");
const Order = require("../src/models/Order");
const Commission = require("../src/models/Commission");
const {
  accrueCommissionsForOrder,
  confirmCommissionsForOrder,
  reverseCommissionsForOrder,
} = require("../src/services/commissionService");

const SENTINEL_PREFIX = "COMM-LIFE-";

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
const sellerA      = new mongoose.Types.ObjectId();
const sellerB      = new mongoose.Types.ObjectId();
const fakeProductA = new mongoose.Types.ObjectId();
const fakeProductB = new mongoose.Types.ObjectId();
const fakeVariantA = new mongoose.Types.ObjectId();
const fakeVariantB = new mongoose.Types.ObjectId();

const makeOrder = async (sentinel, items, extra = {}) => {
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const discount = extra.discount || 0;
  const giftCardDiscount = extra.giftCardDiscount || 0;
  return Order.create({
    orderId:       sentinel,
    userId:        fakeUserId,
    customerName:  "Lifecycle Test",
    customerEmail: "lifecycle-test@example.com",
    customerPhone: "9999999999",
    items,
    shippingAddress: {
      firstName: "L", lastName: "T",
      flatNo: "1", area: "X", city: "Y",
      state: "Z", pincode: "000000",
    },
    paymentMethod: "cod",
    paymentStatus: "cod",
    subtotal,
    discount,
    shipping: 0,
    total:    subtotal - discount - giftCardDiscount,
    giftCardDiscount,
    status: "Processing",
    timeline: [{ status: "Ordered", note: "Test order" }],
  });
};

const cleanup = async () => {
  const orders = await Order.find({ orderId: { $regex: `^${SENTINEL_PREFIX}` } }).select("_id").lean();
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

    // ═══════════════════════════════════════════════════════════════════════
    section("A. Place → Deliver (confirm) — totals unchanged, status flips");
    // ═══════════════════════════════════════════════════════════════════════
    const sA = `${SENTINEL_PREFIX}A-${Date.now()}`;
    const orderA = await makeOrder(sA, [
      { productId: fakeProductA, variantId: fakeVariantA, sellerId: sellerA,
        name: "Item", sku: "A", price: 7500, mrp: 7500, quantity: 1 }, // 5K-20K tier
    ]);
    await accrueCommissionsForOrder(orderA, { triggeredBy: "place_order" });
    const aResult = await confirmCommissionsForOrder(orderA._id);

    await test("confirm matched 1 row, modified 1 row", () => {
      assert.strictEqual(aResult.matched, 1);
      assert.strictEqual(aResult.modified, 1);
    });

    await test("ledger row flipped to status='confirmed'", async () => {
      const rows = await Commission.find({ orderId: orderA._id }).lean();
      assert.strictEqual(rows.length, 1);
      assert.strictEqual(rows[0].status, "confirmed");
      assert.strictEqual(rows[0].commissionAmount, 300);
    });

    await test("Order summary status='confirmed', total=300", async () => {
      const fresh = await Order.findById(orderA._id).lean();
      assert.strictEqual(fresh.commissionSummary.status, "confirmed");
      assert.strictEqual(fresh.commissionSummary.totalCommission, 300);
    });

    // ═══════════════════════════════════════════════════════════════════════
    section("B. Place → Cancel (reverse) — net = 0");
    // ═══════════════════════════════════════════════════════════════════════
    const sB = `${SENTINEL_PREFIX}B-${Date.now()}`;
    const orderB = await makeOrder(sB, [
      { productId: fakeProductA, variantId: fakeVariantA, sellerId: sellerA,
        name: "Item", sku: "A", price: 4500, mrp: 4500, quantity: 1 }, // 1K-5K tier
    ]);
    await accrueCommissionsForOrder(orderB, { triggeredBy: "place_order" });
    const bResult = await reverseCommissionsForOrder(orderB._id, {
      triggeredBy: "order_cancelled",
      reasonNote:  "Test cancellation",
    });

    await test("reverse returns ok=true, reversed=1", () => {
      assert.strictEqual(bResult.ok, true);
      assert.strictEqual(bResult.reversed, 1);
    });

    await test("ledger now has 1 accrual(reversed) + 1 reversal(confirmed)", async () => {
      const rows = await Commission.find({ orderId: orderB._id }).lean();
      assert.strictEqual(rows.length, 2);
      const accrual  = rows.find((r) => r.type === "accrual");
      const reversal = rows.find((r) => r.type === "reversal");
      assert.ok(accrual && reversal);
      assert.strictEqual(accrual.status, "reversed");
      assert.strictEqual(reversal.status, "confirmed");
      assert.strictEqual(String(reversal.reversesEntryId), String(accrual._id));
      assert.strictEqual(reversal.commissionAmount, accrual.commissionAmount);
      assert.strictEqual(reversal.reasonNote, "Test cancellation");
    });

    await test("Order summary status='reversed', total=0", async () => {
      const fresh = await Order.findById(orderB._id).lean();
      assert.strictEqual(fresh.commissionSummary.status, "reversed");
      assert.strictEqual(fresh.commissionSummary.totalCommission, 0);
    });

    // ═══════════════════════════════════════════════════════════════════════
    section("C. Place → Deliver → Return-Refund (reverse) — net = 0");
    // ═══════════════════════════════════════════════════════════════════════
    const sC = `${SENTINEL_PREFIX}C-${Date.now()}`;
    const orderC = await makeOrder(sC, [
      { productId: fakeProductA, variantId: fakeVariantA, sellerId: sellerA,
        name: "Item", sku: "A", price: 25000, mrp: 25000, quantity: 1 }, // 20K-50K tier
    ]);
    await accrueCommissionsForOrder(orderC, { triggeredBy: "place_order" });
    await confirmCommissionsForOrder(orderC._id);
    await reverseCommissionsForOrder(orderC._id, {
      triggeredBy: "return_refunded",
      reasonNote:  "Return RTN-99 refunded",
    });

    await test("confirmed accrual is reversed after refund", async () => {
      const rows = await Commission.find({ orderId: orderC._id }).lean();
      assert.strictEqual(rows.length, 2);
      const accrual = rows.find((r) => r.type === "accrual");
      assert.strictEqual(accrual.status, "reversed");
    });

    await test("net total = 0 after refund", async () => {
      const fresh = await Order.findById(orderC._id).lean();
      assert.strictEqual(fresh.commissionSummary.totalCommission, 0);
      assert.strictEqual(fresh.commissionSummary.status, "reversed");
    });

    // ═══════════════════════════════════════════════════════════════════════
    section("D. Multi-seller place → deliver → reverse — all paths net to 0");
    // ═══════════════════════════════════════════════════════════════════════
    const sD = `${SENTINEL_PREFIX}D-${Date.now()}`;
    const orderD = await makeOrder(sD, [
      { productId: fakeProductA, variantId: fakeVariantA, sellerId: sellerA,
        name: "Item A", sku: "A", price: 6000, mrp: 6000, quantity: 1 },
      { productId: fakeProductB, variantId: fakeVariantB, sellerId: sellerB,
        name: "Item B", sku: "B", price: 30000, mrp: 30000, quantity: 1 },
    ]);
    await accrueCommissionsForOrder(orderD, { triggeredBy: "place_order" });
    await confirmCommissionsForOrder(orderD._id);

    await test("after confirm: 2 confirmed rows", async () => {
      const rows = await Commission.find({ orderId: orderD._id, status: "confirmed", type: "accrual" }).lean();
      assert.strictEqual(rows.length, 2);
    });

    await test("after confirm: summary total = 300 + 500 = 800", async () => {
      const fresh = await Order.findById(orderD._id).lean();
      assert.strictEqual(fresh.commissionSummary.totalCommission, 800);
      assert.strictEqual(fresh.commissionSummary.status, "confirmed");
    });

    await reverseCommissionsForOrder(orderD._id, {
      triggeredBy: "order_cancelled",
      reasonNote:  "Both sellers refunded",
    });

    await test("after reverse: 2 reversed accruals + 2 reversal rows", async () => {
      const rows = await Commission.find({ orderId: orderD._id }).lean();
      assert.strictEqual(rows.length, 4);
      const accruals  = rows.filter((r) => r.type === "accrual");
      const reversals = rows.filter((r) => r.type === "reversal");
      assert.strictEqual(accruals.length, 2);
      assert.strictEqual(reversals.length, 2);
      accruals.forEach((a) => assert.strictEqual(a.status, "reversed"));
      reversals.forEach((r) => assert.strictEqual(r.status, "confirmed"));
    });

    await test("after reverse: summary total = 0", async () => {
      const fresh = await Order.findById(orderD._id).lean();
      assert.strictEqual(fresh.commissionSummary.totalCommission, 0);
      assert.strictEqual(fresh.commissionSummary.status, "reversed");
    });

    // ═══════════════════════════════════════════════════════════════════════
    section("E. Idempotency — reversing twice is a no-op");
    // ═══════════════════════════════════════════════════════════════════════
    const sE = `${SENTINEL_PREFIX}E-${Date.now()}`;
    const orderE = await makeOrder(sE, [
      { productId: fakeProductA, variantId: fakeVariantA, sellerId: sellerA,
        name: "Item", sku: "A", price: 2000, mrp: 2000, quantity: 1 },
    ]);
    await accrueCommissionsForOrder(orderE, { triggeredBy: "place_order" });
    await reverseCommissionsForOrder(orderE._id, { triggeredBy: "order_cancelled" });
    const eSecond = await reverseCommissionsForOrder(orderE._id, { triggeredBy: "order_cancelled" });

    await test("second reverse call returns ok=true, reversed=0", () => {
      assert.strictEqual(eSecond.ok, true);
      assert.strictEqual(eSecond.reversed, 0);
    });

    await test("ledger still has exactly 2 rows (no negative spiral)", async () => {
      const rows = await Commission.find({ orderId: orderE._id }).lean();
      assert.strictEqual(rows.length, 2);
    });

    await test("summary still total = 0", async () => {
      const fresh = await Order.findById(orderE._id).lean();
      assert.strictEqual(fresh.commissionSummary.totalCommission, 0);
    });

    // ═══════════════════════════════════════════════════════════════════════
    section("F. Confirm-after-reverse — cannot un-reverse");
    // ═══════════════════════════════════════════════════════════════════════
    // confirmCommissionsForOrder only flips status=pending rows, so calling it
    // on an already-reversed order should be a clean no-op.
    const fResult = await confirmCommissionsForOrder(orderE._id);
    await test("confirm finds nothing to flip (matched=0)", () => {
      assert.strictEqual(fResult.matched, 0);
      assert.strictEqual(fResult.modified, 0);
    });

    // ─── Done ─────────────────────────────────────────────────────────────
    await cleanup();

    console.log(`\n${"═".repeat(60)}`);
    console.log(`Tests:  ${passed + failed}   ✓ ${passed} passed   ✗ ${failed} failed`);
    console.log("═".repeat(60));

    await mongoose.disconnect();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error("\nFatal error in lifecycle test:", err);
    try { await cleanup(); } catch (_) {}
    try { await mongoose.disconnect(); } catch (_) {}
    process.exit(1);
  }
})();
