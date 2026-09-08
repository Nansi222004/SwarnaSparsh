/**
 * Default platform commission tiers (chart provided by product team).
 *
 * Semantics: upper-inclusive — an amount A matches the tier where
 *   A >= minAmount  AND  (maxAmount === null  OR  A <= maxAmount).
 *
 * The last tier is open-ended (maxAmount = null), covering any amount
 * above ₹2,00,000.
 *
 * Single source of truth: used by
 *   • seeders/commissionTiersSeeder.js          (DB seed on first boot)
 *   • services/commissionService.js             (runtime fallback)
 *   • scripts/backfillCommissions.js            (migration default)
 *   • scripts/test-commission-util.js           (unit tests)
 */
"use strict";

const DEFAULT_COMMISSION_TIERS = Object.freeze([
  Object.freeze({ minAmount: 1,        maxAmount: 1000,    commission: 50   }),
  Object.freeze({ minAmount: 1001,     maxAmount: 5000,    commission: 100  }),
  Object.freeze({ minAmount: 5001,     maxAmount: 20000,   commission: 300  }),
  Object.freeze({ minAmount: 20001,    maxAmount: 50000,   commission: 500  }),
  Object.freeze({ minAmount: 50001,    maxAmount: 100000,  commission: 1000 }),
  Object.freeze({ minAmount: 100001,   maxAmount: 150000,  commission: 1300 }),
  Object.freeze({ minAmount: 150001,   maxAmount: 200000,  commission: 1600 }),
  Object.freeze({ minAmount: 200001,   maxAmount: null,    commission: 2000 }),
]);

module.exports = { DEFAULT_COMMISSION_TIERS };
