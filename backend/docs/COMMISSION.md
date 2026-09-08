# Platform Commission — Operator Runbook & Architecture

> **Audience:** backend engineers, ops, admin users.
> **Status:** Production. Rollout complete (Phases 0–6). Phase 7 (this doc + the doctor) is the post-rollout cleanup layer.
> **Source files:** `backend/src/models/Commission.js`, `backend/src/services/commissionService.js`, `backend/src/utils/commission.js`, `backend/scripts/{backfill-commissions,commission-doctor}.js`.

---

## 1. What this feature does

Every time a customer pays for an order on the platform, Sands deducts a flat platform fee from the **seller's** earning for that order. The fee is tiered against the seller's subtotal in that order:

| Seller subtotal (per order, post-discount) | Platform fee |
| ------------------------------------------ | ------------ |
| ₹1 – ₹1,000                                | ₹50          |
| ₹1,001 – ₹5,000                            | ₹100         |
| ₹5,001 – ₹20,000                           | ₹300         |
| ₹20,001 – ₹50,000                          | ₹500         |
| ₹50,001 – ₹1,00,000                        | ₹1,000       |
| ₹1,00,001 – ₹1,50,000                      | ₹1,300       |
| ₹1,50,001 – ₹2,00,000                      | ₹1,600       |
| ₹2,00,001 and above                        | ₹2,000       |

Tiers are **upper-inclusive** — an order at exactly ₹1,000 falls in the first tier, ₹1,001 falls in the second.

The tier table is editable from **Admin → Settings → Commission Tiers** (see §6). The defaults above are the source of truth in `backend/src/constants/commissionTiers.js`.

---

## 2. Lifecycle (one row in the ledger per state change)

```
                ┌──────────────┐
   placeOrder   │              │     order delivered
   verifyPay -->│   pending    ├-------------------------------> confirmed
                │   (accrual)  │
                └──────┬───────┘
                       │ order cancelled / returned / refunded
                       ▼
                 ┌──────────────┐
                 │   reversed   │  (the original row's status is flipped
                 └──────────────┘   AND a sibling "reversal" row is inserted)
```

| Field on `Commission` row | Meaning                                                                                    |
| ------------------------- | ------------------------------------------------------------------------------------------ |
| `type`                    | `accrual` (placeOrder/verifyPay), `backfill` (migration), `reversal` (cancel/return)       |
| `status`                  | `pending` → `confirmed` (delivered) → `reversed` (terminated)                              |
| `commissionAmount`        | Always positive; the `type` decides whether it adds to or subtracts from platform revenue. |
| `tierSnapshot`            | The tier table at the moment the row was written — never recomputed.                       |
| `reversesEntryId`         | On a `reversal` row, points at the original accrual it cancels.                            |

**Ledger is the source of truth.** `Order.commissionSummary` is a denormalized cache, recomputed by `recomputeOrderSummary()` after every write.

---

## 3. Where commissions are written from

| Trigger                           | Call site                                                              | Action                              |
| --------------------------------- | ---------------------------------------------------------------------- | ----------------------------------- |
| COD checkout                      | `modules/user/controllers/order.controller.js → placeOrder`            | `accrueCommissionsForOrder`         |
| Online payment verified           | `modules/user/controllers/payment.controller.js → verifyPayment`       | `accrueCommissionsForOrder`         |
| Admin marks order delivered       | `modules/admin/controllers/order.controller.js`                        | `confirmCommissionsForOrder`        |
| Seller marks order delivered      | `modules/seller/controllers/order.controller.js`                       | `confirmCommissionsForOrder`        |
| Shipping webhook reports Delivered| `modules/public/controllers/shippingWebhook.controller.js`, `modules/shared/shiprocketWebhook.controller.js` | `confirmCommissionsForOrder`        |
| Customer cancels                  | `modules/user/controllers/order.controller.js → cancelOrder`           | `reverseCommissionsForOrder`        |
| Admin/seller cancels              | `modules/admin/controllers/order.controller.js`, `modules/seller/controllers/order.controller.js` | `reverseCommissionsForOrder`        |
| Admin marks return refunded       | `modules/admin/controllers/return.controller.js`                       | `reverseCommissionsForOrder`        |
| Historical orders (one-time)      | `scripts/backfill-commissions.js`                                       | `backfillCommissionsForOrder`       |

Every call site uses the same prefix `[Commission]` for logs so `grep "[Commission]"` over the backend logs gives you the full audit trail.

---

## 4. Idempotency contract

A second call to `accrueCommissionsForOrder` for the same order must be a no-op. This is enforced at two layers:

1. **MongoDB partial unique index** on `Commission`:

   ```js
   { orderId: 1, sellerId: 1 }
   partialFilterExpression: {
     type:   { $in: ["accrual", "backfill"] },
     status: { $in: ["pending", "confirmed"] },
   }
   ```

2. **Application-level pre-check** in `commissionService.accrueCommissionsForOrder` (a `Commission.findOne` lookup before insert). The index is the hard guarantee; the pre-check exists to keep logs clean and to avoid the duplicate-key write attempt.

If you ever see I5 (duplicate open accrual) reported by the doctor, something has bypassed both layers — investigate immediately.

---

## 5. Kill-switch policy

`Setting.commissionEnabled` is a **permanent operational kill-switch**, not a rollout flag. Keep it around forever.

| When `commissionEnabled === false`                                | Behaviour                          |
| ----------------------------------------------------------------- | ---------------------------------- |
| New orders (COD or online)                                        | Accrual is **skipped silently**.   |
| Existing in-flight orders being delivered                         | Confirmation still runs as normal. |
| Existing orders being cancelled / returned                        | Reversal still runs as normal.     |
| Admin UI tier-save                                                | Blocked (the toggle must be on).   |

Why not remove the flag? Because:

* If we ever ship a tier-config bug we want a single switch to stop accruing **without** disabling cancels/returns. Removing the flag would couple those concerns.
* It costs essentially nothing to keep.

If a future engineer wants to delete it, they MUST first move all blast-radius callers to a per-tier `enabled` flag instead, then ship a migration that converts the global flag away.

---

## 6. Admin UI — what's where

| Page                                                  | URL                       | Purpose                                                                  |
| ----------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------ |
| **Settings → Commission Tiers**                       | `/admin/commission/tiers` | Toggle the kill-switch, edit the tier table, restore defaults, validate. |
| **Commissions → Report**                              | `/admin/commission/report`| KPIs (total, MTD, YTD), top sellers, paginated ledger, CSV export.       |
| **Order Detail → Commission card**                    | `/admin/orders/:id`       | Per-order ledger entries grouped by seller.                              |
| **Seller Detail → Commission card**                   | `/admin/sellers/:id`      | Per-seller historical commission.                                        |
| **Dashboard → Platform Commission KPIs**              | `/admin`                  | At-a-glance MTD / YTD / lifetime + "View Report" link.                   |

API surface lives under `/api/admin/commission/*`. See `modules/admin/controllers/commission.controller.js`.

---

## 7. Seller UI — what's where

| Page                                  | URL                         | Purpose                                                                     |
| ------------------------------------- | --------------------------- | --------------------------------------------------------------------------- |
| **Dashboard → Platform Commission**   | `/seller/dashboard`         | 4-card band: gross, commission MTD, commission YTD, **Net Payout**.         |
| **Commission Statement**              | `/seller/commission`        | Full paginated ledger with date/status filters and CSV export.              |
| **Orders list — `COMMISSION` & `NET`**| `/seller/orders`            | New columns show the fee per order and the seller's net payout.             |
| **Order Detail → commission card**    | `/seller/orders/:id`        | `Gross − Commission = Net Payout`, with per-row breakdown.                  |

The seller can only see entries that belong to **their own** sellerId. Multi-seller orders are aggregated correctly via `fetchSellerCommissionMap` in `modules/seller/controllers/order.controller.js`.

---

## 8. Migration — running the backfill

Before turning on accrual in production, you must seed commission rows for any **historical** orders that are still considered "live" (Delivered or in-flight Shipped, NOT Cancelled/Returned/Refunded).

```bash
# 1. ALWAYS dry-run first. Nothing is written.
npm run backfill:commissions:dry

# 2. Verify the printed plan looks right (counts, samples, tier distribution).

# 3. Live run.
npm run backfill:commissions

# 4. Rollback (deletes only `type="backfill"` rows; never touches real accruals).
npm run backfill:commissions:rollback:dry   # dry-run first
npm run backfill:commissions:rollback
```

The script:
* Filters orders by `ELIGIBLE_STATUSES` (defaults to `Delivered`, `Shipped`, `Out for Delivery`, `Placed`, `Confirmed`).
* Skips orders that already have an open ledger row for that seller (idempotent).
* Stamps each row with `type="backfill"` and `triggeredBy="backfill_script"` so they're distinguishable from organic accruals.
* Updates `Setting.commissionBackfilledAt` on success.

The script accepts `--limit=N`, `--from=YYYY-MM-DD`, `--to=YYYY-MM-DD`, and `--order-id=...` for targeted runs.

---

## 9. Auditing the ledger — the Doctor

`scripts/commission-doctor.js` is a **read-only** health check. It never writes. Run it ad-hoc, schedule it nightly, or wire it into CI.

```bash
npm run commission:doctor          # human-readable report, exits 1 on any violation
npm run commission:doctor:json     # machine-readable JSON
node scripts/commission-doctor.js --from=2026-01-01 --to=2026-02-01
node scripts/commission-doctor.js --fail-fast        # stop at first failure
```

It checks six invariants:

| #  | Invariant                                                                 | What it catches                                                          |
| -- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| I1 | Every Commission row references an existing Order.                        | Hard-deleted orders that left orphan ledger rows.                        |
| I2 | Delivered orders have no `pending` rows left.                             | Webhook missed; confirmCommissionsForOrder never ran.                    |
| I3 | Cancelled / Returned / Refunded orders net to 0 (or have no entries).     | Reversal handler missed; ledger out-of-sync with order status.           |
| I4 | `Order.commissionSummary.totalCommission` matches the ledger sum (±₹1).   | `recomputeOrderSummary` was skipped or stale.                            |
| I5 | At most one OPEN accrual/backfill per `(orderId, sellerId)`.              | Idempotency breach — duplicate accrual sneaked past both safety layers.  |
| I6 | Every reversal points at a real prior entry, and that parent is reversed. | Dangling `reversesEntryId`, or parent left in `confirmed` state.         |

Exit codes:
* `0` — all invariants pass.
* `1` — one or more violations.
* `2` — script error (DB connection, etc).

To fix violations, see §10.

---

## 10. Troubleshooting

### Symptom: I2 says "Delivered orders have N pending entries"

The shipping/admin handler ran but `confirmCommissionsForOrder` didn't fire (or it failed silently). Re-run it from a one-off Node script:

```js
await commissionService.confirmCommissionsForOrder(order._id);
```

Then re-run the doctor.

### Symptom: I3 says "Cancelled orders have ₹X open"

A cancellation didn't propagate to the ledger. Likely a race with an out-of-order webhook. Manually call:

```js
await commissionService.reverseCommissionsForOrder(order._id, {
  triggeredBy: "manual_fix",
  reasonNote: "Doctor I3 fix - <date> - <ticket>",
});
```

### Symptom: I4 reports drift between cache and ledger

The cache is the easy one to fix — the ledger is the truth.

```js
await commissionService.recomputeOrderSummary(order._id);
```

You can batch this across all reported orders in one script.

### Symptom: I5 says "duplicate open accrual"

This is **serious**. Two open accruals for the same (order, seller) means the partial unique index was either dropped or never created. Run:

```js
await mongoose.connection.collection("commissions").indexes();
await Commission.syncIndexes();
```

Inspect the duplicates manually, decide which row is canonical (usually the earlier one, with `triggeredBy="place_order"`), and `reverse` the other one. Never hard-delete a ledger row.

### Symptom: I6 reports dangling `reversesEntryId`

The reversal references a Commission row that no longer exists, or the parent isn't flipped to `reversed`. Look up the parent and fix its status:

```js
await Commission.updateOne({ _id: parentId }, { $set: { status: "reversed" } });
```

If the parent really doesn't exist, this is data corruption — the reversal should be marked `void` (manually add the status if necessary) and you'll need to investigate how it got written without a parent.

---

## 11. Tests

| Suite                                  | What it covers                                                       |
| -------------------------------------- | -------------------------------------------------------------------- |
| `npm run test:commission-util`         | Pure math: `pickTier`, `computeForSellerSubtotal`, discount split.   |
| `npm run test:commission-accrual`      | placeOrder / verifyPayment → accrual rows. Idempotency.              |
| `npm run test:commission-lifecycle`    | Status flow: confirm-on-delivery, reverse-on-cancel/return.          |
| `npm run test:commission-backfill`     | `backfillCommissionsForOrder` correctness, dry-run, idempotency.     |
| `npm run test:commission-doctor`       | Each of the 6 invariants is detected on seeded bad data.             |

Run them all before any commission-related PR ships.

---

## 12. FAQ

**Q. What happens if a tier table change is saved between an accrual and its reversal?**
The accrual froze the table into `tierSnapshot`. The reversal looks up the original entry by id and writes a row of equal amount in the opposite direction. The new tier table only affects orders placed after the save. (Verified by `test-commission-lifecycle.js`.)

**Q. Does offline / DirectSale incur commission?**
No. The accrual call sites are scoped to the online platform order flow (`placeOrder` + `verifyPayment`). DirectSale paths never call the commission service.

**Q. Can I delete a row from the `commissions` collection?**
No. The ledger is append-only. The doctor will flag any ID-only deletes as drift (I4) or orphans (I1) on the next run. To "remove" the impact of a row, write a `reversal` against it.

**Q. What if `Setting.commissionEnabled` is flipped off mid-day?**
Accruals stop instantly. In-flight confirmations and reversals keep working. When you flip it back on, the next placeOrder writes a fresh accrual — orders placed during the off-window will be missing commission, and you'll need to run a targeted `backfill-commissions.js --from=... --to=...` for that window.

**Q. How do I add a new tier above ₹2 Lakh?**
Admin → Settings → Commission Tiers → edit the table → Save. The Setting document is updated, but every existing ledger row keeps its original `tierSnapshot`, so history is preserved.

---

## 13. Phase history

* **Phase 0** — Data model: `Commission`, `Setting.commissionTiers`, `Order.commissionSummary`, default-tier seeder.
* **Phase 1** — `utils/commission.js` (pure math), `services/commissionService.js`, unit tests.
* **Phase 2** — Wire accrual into `placeOrder` + `verifyPayment`.
* **Phase 3** — Wire confirm/reverse into status changes, cancellation, return, shipping webhook.
* **Phase 4** — Admin UI: tier-settings page, dashboard KPIs, commission report, breakdown cards.
* **Phase 5** — Seller UI: dashboard band, orders list columns, full statement page, breakdown card.
* **Phase 6** — Backfill migration script (dry-run / live / rollback) + tests.
* **Phase 7** — Doctor audit tool, this document, code-hygiene clarifications. (No kill-switch removal — see §5.)
