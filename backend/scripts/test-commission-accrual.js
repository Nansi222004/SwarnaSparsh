/**
 * Integration smoke test for commission accrual hooks.
 *
 * What it verifies (against a real Mongo connection):
 *   1. accrueCommissionsForOrder writes one ledger row per eligible seller.
 *   2. Order.commissionSummary is updated to reflect the sum.
 *   3. A second accrual call for the same order is a no-op (idempotent).
 *   4. Disabling commission via Setting.commissionEnabled=false skips accrual.
 *
 * Test data is created with a unique sentinel orderId and cleaned up after.
 * Real customer/seller/product data is NEVER touched.
 *
 * Run:  node scripts/test-commission-accrual.js
 */
"use strict";

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const assert = require("assert");

const connectDB = require("../src/config/db");
const Order = require("../src/models/Order");
const Setting = require("../src/models/Setting");
const Commission = require("../src/models/Commission");
const { accrueCommissionsForOrder } = require("../src/services/commissionService");

const SENTINEL_PREFIX = "COMM-TEST-";

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

const makeOrder = async (sentinel, items, extra = {}) => {
  return Order.create({
    orderId:       sentinel,
    userId:        fakeUserId,
    customerName:  "Commission Test",
    customerEmail: "commission-test@example.com",
    customerPhone: "9999999999",
    items,
    shippingAddress: {
      firstName: "T", lastName: "Est",
      flatNo: "1", area: "X", city: "Y",
      state: "Z", pincode: "000000",
    },
    paymentMethod: "cod",
    paymentStatus: "cod",
    subtotal: items.reduce((s, i) => s + i.price * i.quantity, 0),
    discount: extra.discount || 0,
    shipping: 0,
    total:    items.reduce((s, i) => s + i.price * i.quantity, 0) - (extra.discount || 0),
    giftCardDiscount: extra.giftCardDiscount || 0,
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
    // Ensure the partial unique index is live before we start hammering inserts.
    await Commission.syncIndexes();
    await cleanup();

    // ───────────────────────────────────────────────────────────────────
    section("1. Single-seller order — accrual writes one ledger row");
    // ───────────────────────────────────────────────────────────────────
    const sentinel1 = `${SENTINEL_PREFIX}1-${Date.now()}`;
    const order1 = await makeOrder(sentinel1, [
      { productId: fakeProductA, variantId: fakeVariantA, sellerId: fakeSellerA,
        name: "Item A", sku: "A", price: 3500, mrp: 3500, quantity: 1 },
    ]);

    const r1 = await accrueCommissionsForOrder(order1, { triggeredBy: "place_order" });

    await test("returns ok=true, skipped=false", () => {
      assert.strictEqual(r1.ok, true);
      assert.strictEqual(r1.skipped, false);
    });

    await test("creates exactly one ledger row", async () => {
      const entries = await Commission.find({ orderId: order1._id });
      assert.strictEqual(entries.length, 1);
      assert.strictEqual(entries[0].commissionAmount, 100);          // 1K-5K tier
      assert.strictEqual(entries[0].tierLabel, "1001-5000");
      assert.strictEqual(entries[0].type, "accrual");
      assert.strictEqual(entries[0].status, "pending");
      assert.strictEqual(String(entries[0].sellerId), String(fakeSellerA));
    });

    await test("updates Order.commissionSummary.totalCommission", async () => {
      const fresh = await Order.findById(order1._id).lean();
      assert.strictEqual(fresh.commissionSummary.totalCommission, 100);
      assert.strictEqual(fresh.commissionSummary.status, "pending");
    });

    // ───────────────────────────────────────────────────────────────────
    section("2. Idempotency — second accrual is a no-op");
    // ───────────────────────────────────────────────────────────────────
    const r2 = await accrueCommissionsForOrder(order1, { triggeredBy: "place_order" });

    await test("second call still ok=true", () => {
      assert.strictEqual(r2.ok, true);
    });

    await test("no duplicate ledger rows", async () => {
      const entries = await Commission.find({ orderId: order1._id });
      assert.strictEqual(entries.length, 1);
    });

    // ───────────────────────────────────────────────────────────────────
    section("3. Multi-seller order with coupon — proportional split");
    // ───────────────────────────────────────────────────────────────────
    const sentinel3 = `${SENTINEL_PREFIX}3-${Date.now()}`;
    const order3 = await makeOrder(
      sentinel3,
      [
        { productId: fakeProductA, variantId: fakeVariantA, sellerId: fakeSellerA,
          name: "Item A", sku: "A", price: 6000, mrp: 6000, quantity: 1 },
        { productId: fakeProductB, variantId: fakeVariantB, sellerId: fakeSellerB,
          name: "Item B", sku: "B", price: 4000, mrp: 4000, quantity: 1 },
      ],
      { discount: 1000 }
    );

    await accrueCommissionsForOrder(order3, { triggeredBy: "place_order" });

    await test("two ledger rows created", async () => {
      const entries = await Commission.find({ orderId: order3._id }).lean();
      assert.strictEqual(entries.length, 2);
    });

    await test("seller A pays ₹300 commission (taxable ₹5400)", async () => {
      const e = await Commission.findOne({ orderId: order3._id, sellerId: fakeSellerA }).lean();
      assert.strictEqual(e.taxableAmount, 5400);
      assert.strictEqual(e.commissionAmount, 300);
    });

    await test("seller B pays ₹100 commission (taxable ₹3600)", async () => {
      const e = await Commission.findOne({ orderId: order3._id, sellerId: fakeSellerB }).lean();
      assert.strictEqual(e.taxableAmount, 3600);
      assert.strictEqual(e.commissionAmount, 100);
    });

    await test("Order summary totals both sellers (₹400)", async () => {
      const fresh = await Order.findById(order3._id).lean();
      assert.strictEqual(fresh.commissionSummary.totalCommission, 400);
    });

    // ───────────────────────────────────────────────────────────────────
    section("4. Commission disabled via Setting → accrual is skipped");
    // ───────────────────────────────────────────────────────────────────
    const setting = (await Setting.findOne()) || new Setting({});
    const wasEnabled = setting.commissionEnabled !== false;
    setting.commissionEnabled = false;
    await setting.save();

    try {
      const sentinel4 = `${SENTINEL_PREFIX}4-${Date.now()}`;
      const order4 = await makeOrder(sentinel4, [
        { productId: fakeProductA, variantId: fakeVariantA, sellerId: fakeSellerA,
          name: "Item A", sku: "A", price: 3500, mrp: 3500, quantity: 1 },
      ]);
      const r4 = await accrueCommissionsForOrder(order4, { triggeredBy: "place_order" });

      await test("returns ok=true, skipped=true (commission_disabled)", () => {
        assert.strictEqual(r4.ok, true);
        assert.strictEqual(r4.skipped, true);
        assert.strictEqual(r4.reason, "commission_disabled");
      });

      await test("no ledger rows written", async () => {
        const entries = await Commission.find({ orderId: order4._id });
        assert.strictEqual(entries.length, 0);
      });
    } finally {
      setting.commissionEnabled = wasEnabled;
      await setting.save();
    }

    // ───────────────────────────────────────────────────────────────────
    section("5. Order with only gift-card items → no ledger rows");
    // ───────────────────────────────────────────────────────────────────
    const sentinel5 = `${SENTINEL_PREFIX}5-${Date.now()}`;
    const order5 = await makeOrder(sentinel5, [
      { productId: "GIFT_CARD_2000", variantId: "GIFT_CARD_VAR", isGiftCard: true,
        name: "Gift Card", sku: "GC-2000", price: 2000, mrp: 2000, quantity: 1 },
    ]);
    const r5 = await accrueCommissionsForOrder(order5, { triggeredBy: "place_order" });

    await test("returns ok=true, skipped=true (no_eligible_items)", () => {
      assert.strictEqual(r5.ok, true);
      assert.strictEqual(r5.skipped, true);
      assert.strictEqual(r5.reason, "no_eligible_items");
    });

    await test("Order summary status = 'none'", async () => {
      const fresh = await Order.findById(order5._id).lean();
      assert.strictEqual(fresh.commissionSummary.totalCommission, 0);
      assert.strictEqual(fresh.commissionSummary.status, "none");
    });

    // ─── Done ───────────────────────────────────────────────────────────
    await cleanup();

    console.log(`\n${"═".repeat(60)}`);
    console.log(`Tests:  ${passed + failed}   ✓ ${passed} passed   ✗ ${failed} failed`);
    console.log("═".repeat(60));

    await mongoose.disconnect();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error("\nFatal error in integration test:", err);
    try { await cleanup(); } catch (_) {}
    try { await mongoose.disconnect(); } catch (_) {}
    process.exit(1);
  }
})();
