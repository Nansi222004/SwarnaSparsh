/**
 * Pure, side-effect-free commission math.
 *
 * No DB, no Mongoose, no I/O. Everything here can be unit-tested in isolation.
 *
 * Tier semantics: upper-inclusive.
 *   For an amount A and a tier (min, max), A matches when
 *     A >= min  AND  (max === null OR A <= max).
 *
 * Per-order, per-seller charging:
 *   For each seller present in an order, we compute their post-discount
 *   taxable amount (their gross subtotal minus a proportional share of
 *   the order-level coupon discount + gift-card discount), look up the
 *   matching tier and emit one commission row for that seller.
 *
 * Excluded from the commission base:
 *   • Gift-card line items (platform revenue, not seller revenue)
 *   • Items without a sellerId (platform-owned products)
 *   • Shipping (platform expense/revenue, not seller revenue)
 */
"use strict";

const { DEFAULT_COMMISSION_TIERS } = require("../constants/commissionTiers");

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const toPositiveNumber = (value) => Math.max(0, toNumber(value));

const round = (value) => Math.round(toNumber(value));

const isGiftCardItem = (item) =>
  Boolean(item?.isGiftCard) ||
  String(item?.productId || "").startsWith("GIFT_CARD_");

const hasSeller = (item) => {
  const sid = item?.sellerId;
  if (!sid) return false;
  const str = String(sid).trim();
  return Boolean(str && str !== "null" && str !== "undefined");
};

// ─────────────────────────────────────────────────────────────────────────
// Tier validation & lookup
// ─────────────────────────────────────────────────────────────────────────

/**
 * Validate that a tier list is well-formed.
 *  • non-empty
 *  • each row has commission ≥ 0
 *  • minAmount strictly ascending
 *  • maxAmount ≥ minAmount (when non-null)
 *  • no gaps between rows (max[i] + 1 === min[i+1])
 *  • only the last row may have maxAmount === null
 *
 * Returns { valid: true } or { valid: false, error: "..." }.
 */
const validateTiers = (tiers) => {
  if (!Array.isArray(tiers) || tiers.length === 0) {
    return { valid: false, error: "Tier list must be a non-empty array" };
  }

  let prevMax = -1;
  for (let i = 0; i < tiers.length; i++) {
    const t = tiers[i];
    const min = toNumber(t?.minAmount);
    const max = t?.maxAmount === null || t?.maxAmount === undefined ? null : toNumber(t.maxAmount);
    const com = toNumber(t?.commission);

    if (com < 0) return { valid: false, error: `Tier ${i}: commission must be ≥ 0` };
    if (min < 0) return { valid: false, error: `Tier ${i}: minAmount must be ≥ 0` };
    if (max !== null && max < min) return { valid: false, error: `Tier ${i}: maxAmount must be ≥ minAmount` };

    if (i > 0 && min !== prevMax + 1) {
      return {
        valid: false,
        error: `Tier ${i}: minAmount (${min}) must equal previous maxAmount + 1 (${prevMax + 1})`,
      };
    }
    if (max === null && i !== tiers.length - 1) {
      return { valid: false, error: `Tier ${i}: only the last row may have maxAmount = null` };
    }

    prevMax = max ?? Infinity;
  }

  return { valid: true };
};

/**
 * Pick the tier that matches an amount (upper-inclusive).
 * Returns null when no tier matches (e.g. amount < first tier's minAmount).
 */
const pickTier = (amount, tiers) => {
  const list = Array.isArray(tiers) && tiers.length > 0 ? tiers : DEFAULT_COMMISSION_TIERS;
  const A = toNumber(amount);

  if (A <= 0) return null;

  for (const t of list) {
    const min = toNumber(t.minAmount);
    const max = t.maxAmount === null || t.maxAmount === undefined ? null : toNumber(t.maxAmount);
    if (A >= min && (max === null || A <= max)) {
      return {
        minAmount:  min,
        maxAmount:  max,
        commission: toNumber(t.commission),
        label:      max === null ? `${min}+` : `${min}-${max}`,
      };
    }
  }
  return null;
};

/**
 * Convenience: given a seller's taxable amount, compute commission ₹ and label.
 * Returns { commission, tierLabel, tier } (commission=0 when no tier matches).
 */
const computeForSellerSubtotal = (taxableAmount, tiers) => {
  const tier = pickTier(taxableAmount, tiers);
  return {
    commission: tier ? tier.commission : 0,
    tierLabel:  tier ? tier.label : "",
    tier:       tier,
  };
};

// ─────────────────────────────────────────────────────────────────────────
// Order → per-seller breakdown
// ─────────────────────────────────────────────────────────────────────────

/**
 * Split an order's items by sellerId, skipping gift-card and sellerless lines.
 * Returns Map<sellerIdString, { items, subtotal }>.
 */
const splitOrderBySeller = (order) => {
  const result = new Map();
  const items = Array.isArray(order?.items) ? order.items : [];

  for (const item of items) {
    if (isGiftCardItem(item)) continue;
    if (!hasSeller(item)) continue;

    const sellerKey = String(item.sellerId);
    const lineTotal = toPositiveNumber(item.price) * toPositiveNumber(item.quantity);
    if (lineTotal <= 0) continue;

    if (!result.has(sellerKey)) {
      result.set(sellerKey, { sellerId: item.sellerId, items: [], subtotal: 0 });
    }
    const entry = result.get(sellerKey);
    entry.items.push(item);
    entry.subtotal += lineTotal;
  }

  // Round each subtotal so floating-point dust never bumps us into the next tier.
  for (const entry of result.values()) {
    entry.subtotal = round(entry.subtotal);
  }

  return result;
};

/**
 * Distribute a total order-level discount across sellers in proportion to
 * each seller's commission-eligible subtotal. The last seller absorbs the
 * rounding remainder so the sum of shares always equals the input total.
 *
 * `perSeller` is a Map produced by splitOrderBySeller(order).
 * Mutates each entry to add { discountShare, giftCardShare }.
 */
const allocateDiscountProportionally = (perSeller, totalDiscount, totalGiftCardDiscount) => {
  const totalDisc = toPositiveNumber(totalDiscount);
  const totalGc   = toPositiveNumber(totalGiftCardDiscount);

  const entries = Array.from(perSeller.values());
  const totalBase = entries.reduce((acc, e) => acc + toPositiveNumber(e.subtotal), 0);

  if (entries.length === 0) return perSeller;

  if (totalBase <= 0 || (totalDisc <= 0 && totalGc <= 0)) {
    for (const e of entries) {
      e.discountShare = 0;
      e.giftCardShare = 0;
    }
    return perSeller;
  }

  let runningDisc = 0;
  let runningGc   = 0;

  entries.forEach((e, idx) => {
    if (idx === entries.length - 1) {
      // Last seller absorbs rounding remainder so totals reconcile exactly.
      e.discountShare = Math.max(0, round(totalDisc - runningDisc));
      e.giftCardShare = Math.max(0, round(totalGc   - runningGc));
      return;
    }
    const ratio = e.subtotal / totalBase;
    e.discountShare = round(totalDisc * ratio);
    e.giftCardShare = round(totalGc   * ratio);
    runningDisc += e.discountShare;
    runningGc   += e.giftCardShare;
  });

  return perSeller;
};

/**
 * Compute the full per-seller commission breakdown for an order.
 *
 * @param {Object} order - shape: { items, discount, giftCardDiscount }
 * @param {Array}  tiers - tier list (defaults to DEFAULT_COMMISSION_TIERS)
 * @returns {Array<{
 *   sellerId, sellerSubtotal, sellerDiscountShare, sellerGiftCardShare,
 *   taxableAmount, commissionAmount, tierLabel, tierSnapshot
 * }>}
 */
const computeOrderCommissions = (order, tiers) => {
  const activeTiers = Array.isArray(tiers) && tiers.length > 0 ? tiers : DEFAULT_COMMISSION_TIERS;
  const snapshot = activeTiers.map((t) => ({
    minAmount:  toNumber(t.minAmount),
    maxAmount:  t.maxAmount === null || t.maxAmount === undefined ? null : toNumber(t.maxAmount),
    commission: toNumber(t.commission),
  }));

  const perSeller = splitOrderBySeller(order);
  if (perSeller.size === 0) return [];

  const totalDiscount     = toPositiveNumber(order?.discount);
  const totalGiftCardDisc = toPositiveNumber(order?.giftCardDiscount);
  allocateDiscountProportionally(perSeller, totalDiscount, totalGiftCardDisc);

  const result = [];
  for (const entry of perSeller.values()) {
    const sellerSubtotal      = toPositiveNumber(entry.subtotal);
    const sellerDiscountShare = toPositiveNumber(entry.discountShare);
    const sellerGiftCardShare = toPositiveNumber(entry.giftCardShare);
    const taxableAmount = Math.max(0, round(sellerSubtotal - sellerDiscountShare));

    const { commission, tierLabel } = computeForSellerSubtotal(taxableAmount, activeTiers);

    result.push({
      sellerId:            entry.sellerId,
      sellerSubtotal,
      sellerDiscountShare,
      sellerGiftCardShare,
      taxableAmount,
      commissionAmount:    commission,
      tierLabel,
      tierSnapshot:        snapshot,
    });
  }

  return result;
};

module.exports = {
  // Tier helpers
  pickTier,
  validateTiers,
  computeForSellerSubtotal,

  // Order helpers
  splitOrderBySeller,
  allocateDiscountProportionally,
  computeOrderCommissions,

  // Internal helpers exposed for tests
  _internals: { isGiftCardItem, hasSeller, round },
};
