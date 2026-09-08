/**
 * Unit tests for src/utils/commission.js — pure logic, no DB needed.
 *
 * Run:  node scripts/test-commission-util.js
 * Exits 0 on success, 1 on any failure.
 */
"use strict";

const assert = require("assert");
const {
  pickTier,
  validateTiers,
  computeForSellerSubtotal,
  splitOrderBySeller,
  allocateDiscountProportionally,
  computeOrderCommissions,
} = require("../src/utils/commission");
const { DEFAULT_COMMISSION_TIERS } = require("../src/constants/commissionTiers");

let passed = 0;
let failed = 0;
const errors = [];

const test = (name, fn) => {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed++;
    errors.push({ name, err });
    console.log(`  ✗ ${name}`);
    console.log(`      ${err.message}`);
  }
};

const section = (title) => {
  console.log(`\n${title}`);
  console.log("─".repeat(title.length));
};

// ═════════════════════════════════════════════════════════════════════════
// 1. pickTier — every chart boundary
// ═════════════════════════════════════════════════════════════════════════
section("1. pickTier — chart boundaries (upper-inclusive)");

const cases = [
  // [input,       expected commission, expected label]
  [0,              null,    null],            // non-positive → no tier
  [-1,             null,    null],
  [1,              50,      "1-1000"],
  [500,            50,      "1-1000"],
  [999,            50,      "1-1000"],
  [1000,           50,      "1-1000"],        // upper edge of tier 1
  [1001,           100,     "1001-5000"],
  [3000,           100,     "1001-5000"],
  [5000,           100,     "1001-5000"],     // upper edge of tier 2
  [5001,           300,     "5001-20000"],
  [12345,          300,     "5001-20000"],
  [20000,          300,     "5001-20000"],
  [20001,          500,     "20001-50000"],
  [37500,          500,     "20001-50000"],
  [50000,          500,     "20001-50000"],
  [50001,          1000,    "50001-100000"],
  [75000,          1000,    "50001-100000"],
  [100000,         1000,    "50001-100000"],
  [100001,         1300,    "100001-150000"],
  [125000,         1300,    "100001-150000"],
  [150000,         1300,    "100001-150000"],
  [150001,         1600,    "150001-200000"],
  [175000,         1600,    "150001-200000"],
  [200000,         1600,    "150001-200000"],
  [200001,         2000,    "200001+"],       // open-ended tier
  [500000,         2000,    "200001+"],
  [99999999,       2000,    "200001+"],
];

cases.forEach(([amount, expectedCommission, expectedLabel]) => {
  test(`pickTier(${amount}) → ${expectedCommission}`, () => {
    const tier = pickTier(amount, DEFAULT_COMMISSION_TIERS);
    if (expectedCommission === null) {
      assert.strictEqual(tier, null, "expected null tier");
    } else {
      assert.ok(tier, "expected a tier");
      assert.strictEqual(tier.commission, expectedCommission);
      assert.strictEqual(tier.label, expectedLabel);
    }
  });
});

// ═════════════════════════════════════════════════════════════════════════
// 2. computeForSellerSubtotal — wraps pickTier
// ═════════════════════════════════════════════════════════════════════════
section("2. computeForSellerSubtotal");

test("returns commission=0, tierLabel='' when no tier matches (amount=0)", () => {
  const r = computeForSellerSubtotal(0, DEFAULT_COMMISSION_TIERS);
  assert.strictEqual(r.commission, 0);
  assert.strictEqual(r.tierLabel, "");
});

test("returns ₹100 for ₹3500 (1K-5K tier)", () => {
  const r = computeForSellerSubtotal(3500, DEFAULT_COMMISSION_TIERS);
  assert.strictEqual(r.commission, 100);
  assert.strictEqual(r.tierLabel, "1001-5000");
});

// ═════════════════════════════════════════════════════════════════════════
// 3. validateTiers
// ═════════════════════════════════════════════════════════════════════════
section("3. validateTiers");

test("default tiers are valid", () => {
  const v = validateTiers(DEFAULT_COMMISSION_TIERS);
  assert.strictEqual(v.valid, true, v.error);
});

test("empty list is invalid", () => {
  const v = validateTiers([]);
  assert.strictEqual(v.valid, false);
});

test("gap between tiers is invalid", () => {
  const v = validateTiers([
    { minAmount: 1,    maxAmount: 1000, commission: 50 },
    { minAmount: 2000, maxAmount: null, commission: 100 }, // gap 1001-1999
  ]);
  assert.strictEqual(v.valid, false);
});

test("non-last open-ended tier is invalid", () => {
  const v = validateTiers([
    { minAmount: 1,    maxAmount: null, commission: 50 },
    { minAmount: 1001, maxAmount: null, commission: 100 },
  ]);
  assert.strictEqual(v.valid, false);
});

test("negative commission is invalid", () => {
  const v = validateTiers([{ minAmount: 1, maxAmount: null, commission: -10 }]);
  assert.strictEqual(v.valid, false);
});

// ═════════════════════════════════════════════════════════════════════════
// 4. splitOrderBySeller — exclusion rules
// ═════════════════════════════════════════════════════════════════════════
section("4. splitOrderBySeller");

test("groups items per seller, sums line totals", () => {
  const result = splitOrderBySeller({
    items: [
      { sellerId: "A", price: 100, quantity: 2 }, // 200
      { sellerId: "B", price: 500, quantity: 1 }, // 500
      { sellerId: "A", price: 300, quantity: 1 }, // 300
    ],
  });
  assert.strictEqual(result.size, 2);
  assert.strictEqual(result.get("A").subtotal, 500);
  assert.strictEqual(result.get("B").subtotal, 500);
});

test("excludes gift-card line items", () => {
  const result = splitOrderBySeller({
    items: [
      { sellerId: "A", price: 1000, quantity: 1 },
      { sellerId: "A", price: 500, quantity: 1, isGiftCard: true },
      { sellerId: "A", price: 2000, quantity: 1, productId: "GIFT_CARD_2000" },
    ],
  });
  assert.strictEqual(result.get("A").subtotal, 1000);
});

test("excludes items without sellerId", () => {
  const result = splitOrderBySeller({
    items: [
      { sellerId: "A",  price: 1000, quantity: 1 },
      { sellerId: null, price: 500,  quantity: 1 },
      {                 price: 500,  quantity: 1 },
    ],
  });
  assert.strictEqual(result.size, 1);
  assert.strictEqual(result.get("A").subtotal, 1000);
});

test("excludes lines with non-positive totals", () => {
  const result = splitOrderBySeller({
    items: [
      { sellerId: "A", price: 0,    quantity: 1 },
      { sellerId: "A", price: 1000, quantity: 0 },
      { sellerId: "A", price: 1000, quantity: 1 },
    ],
  });
  assert.strictEqual(result.get("A").subtotal, 1000);
});

// ═════════════════════════════════════════════════════════════════════════
// 5. allocateDiscountProportionally
// ═════════════════════════════════════════════════════════════════════════
section("5. allocateDiscountProportionally");

test("allocates proportional to seller subtotals", () => {
  const perSeller = new Map([
    ["A", { sellerId: "A", subtotal: 6000 }],
    ["B", { sellerId: "B", subtotal: 4000 }],
  ]);
  allocateDiscountProportionally(perSeller, 1000, 0);
  assert.strictEqual(perSeller.get("A").discountShare, 600);
  assert.strictEqual(perSeller.get("B").discountShare, 400);
});

test("last seller absorbs the rounding remainder", () => {
  const perSeller = new Map([
    ["A", { sellerId: "A", subtotal: 333 }],
    ["B", { sellerId: "B", subtotal: 333 }],
    ["C", { sellerId: "C", subtotal: 334 }],
  ]);
  allocateDiscountProportionally(perSeller, 100, 0);
  const sum =
    perSeller.get("A").discountShare +
    perSeller.get("B").discountShare +
    perSeller.get("C").discountShare;
  assert.strictEqual(sum, 100);
});

test("zero discounts → zero shares", () => {
  const perSeller = new Map([["A", { sellerId: "A", subtotal: 1000 }]]);
  allocateDiscountProportionally(perSeller, 0, 0);
  assert.strictEqual(perSeller.get("A").discountShare, 0);
  assert.strictEqual(perSeller.get("A").giftCardShare, 0);
});

// ═════════════════════════════════════════════════════════════════════════
// 6. computeOrderCommissions — end-to-end
// ═════════════════════════════════════════════════════════════════════════
section("6. computeOrderCommissions");

test("single-seller order, no discounts → tier 5001-20000", () => {
  const rows = computeOrderCommissions(
    {
      items: [{ sellerId: "A", price: 3500, quantity: 4 }], // 14,000
      discount: 0,
      giftCardDiscount: 0,
    },
    DEFAULT_COMMISSION_TIERS
  );
  assert.strictEqual(rows.length, 1);
  assert.strictEqual(rows[0].sellerSubtotal, 14000);
  assert.strictEqual(rows[0].taxableAmount, 14000);
  assert.strictEqual(rows[0].commissionAmount, 300);
  assert.strictEqual(rows[0].tierLabel, "5001-20000");
});

test("two-seller order with coupon → discount split proportionally", () => {
  const rows = computeOrderCommissions(
    {
      items: [
        { sellerId: "A", price: 6000, quantity: 1 }, // 6,000
        { sellerId: "B", price: 4000, quantity: 1 }, // 4,000
      ],
      discount: 1000,
      giftCardDiscount: 0,
    },
    DEFAULT_COMMISSION_TIERS
  );
  rows.sort((a, b) => String(a.sellerId).localeCompare(String(b.sellerId)));

  const a = rows.find((r) => r.sellerId === "A");
  const b = rows.find((r) => r.sellerId === "B");
  assert.strictEqual(a.taxableAmount, 5400);    // 6000 - 600
  assert.strictEqual(a.commissionAmount, 300);  // 5001-20000 tier
  assert.strictEqual(b.taxableAmount, 3600);    // 4000 - 400
  assert.strictEqual(b.commissionAmount, 100);  // 1001-5000 tier
});

test("discount pushes seller down to lower tier (post-discount basis)", () => {
  const rows = computeOrderCommissions(
    {
      items: [{ sellerId: "A", price: 5500, quantity: 1 }], // crosses 5001 boundary
      discount: 600,
      giftCardDiscount: 0,
    },
    DEFAULT_COMMISSION_TIERS
  );
  // 5500 - 600 = 4900 → tier 1001-5000 = ₹100 (not ₹300)
  assert.strictEqual(rows[0].taxableAmount, 4900);
  assert.strictEqual(rows[0].commissionAmount, 100);
});

test("entirely paid by gift card → commission is unchanged (gift card is tender)", () => {
  const rows = computeOrderCommissions(
    {
      items: [{ sellerId: "A", price: 1000, quantity: 1 }],
      discount: 0,
      giftCardDiscount: 1000,
    },
    DEFAULT_COMMISSION_TIERS
  );
  assert.strictEqual(rows[0].taxableAmount, 1000);
  assert.strictEqual(rows[0].commissionAmount, 50);
});

test("gift-card items in cart are excluded from base", () => {
  const rows = computeOrderCommissions(
    {
      items: [
        { sellerId: "A", price: 2500, quantity: 1 },              // seller A: 2500
        { price: 1000, quantity: 1, isGiftCard: true },           // platform GC sale
      ],
      discount: 0,
      giftCardDiscount: 0,
    },
    DEFAULT_COMMISSION_TIERS
  );
  assert.strictEqual(rows.length, 1);
  assert.strictEqual(rows[0].sellerSubtotal, 2500);
  assert.strictEqual(rows[0].commissionAmount, 100);
});

test("empty order returns empty array", () => {
  const rows = computeOrderCommissions({ items: [] }, DEFAULT_COMMISSION_TIERS);
  assert.strictEqual(rows.length, 0);
});

test("tier snapshot is attached to each row", () => {
  const rows = computeOrderCommissions(
    { items: [{ sellerId: "A", price: 100, quantity: 1 }] },
    DEFAULT_COMMISSION_TIERS
  );
  assert.strictEqual(Array.isArray(rows[0].tierSnapshot), true);
  assert.strictEqual(rows[0].tierSnapshot.length, DEFAULT_COMMISSION_TIERS.length);
});

test("falls back to defaults when tiers arg is empty", () => {
  const rows = computeOrderCommissions(
    { items: [{ sellerId: "A", price: 100, quantity: 1 }] },
    []
  );
  assert.strictEqual(rows[0].commissionAmount, 50);
});

// ═════════════════════════════════════════════════════════════════════════
// Summary
// ═════════════════════════════════════════════════════════════════════════
console.log(`\n${"═".repeat(60)}`);
console.log(`Tests:  ${passed + failed}   ✓ ${passed} passed   ✗ ${failed} failed`);
console.log("═".repeat(60));

if (failed > 0) {
  console.log("\nFailures:");
  for (const e of errors) {
    console.log(`  • ${e.name}`);
    console.log(`      ${e.err.stack || e.err.message}`);
  }
  process.exit(1);
}

process.exit(0);
