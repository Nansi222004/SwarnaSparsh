/**
 * Swarna Sparsh - Single-Vendor Data Migration Script
 * 
 * Usage:
 *   Dry-run (default, safe read-only inspection):
 *     node backend/scripts/migrate-to-single-vendor.js --dry-run
 * 
 *   Live execution (only when approved):
 *     node backend/scripts/migrate-to-single-vendor.js --execute
 * 
 * Strict Migration Rules:
 *   1. Active Catalog Migration: Only updates Product.sellerId to null for store-wide catalog ownership.
 *   2. Historical Isolation: ZERO mutations on Order, Commission, PayoutRequest, WalletTransaction,
 *      SellerInvoice, StockLog, DirectSale, or historical Shipment records.
 *   3. Backup: Automatically snapshots affected product records to JSON before any live write.
 */

const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");

const Product = require("../src/models/Product");
const Order = require("../src/models/Order");
const Commission = require("../src/models/Commission");
const PayoutRequest = require("../src/models/PayoutRequest");
const WalletTransaction = require("../src/models/WalletTransaction");
const SellerInvoice = require("../src/models/SellerInvoice");
const PickupLocation = require("../src/models/PickupLocation");
const StockLog = require("../src/models/StockLog");
const DirectSale = require("../src/models/DirectSale");
const Shipment = require("../src/models/Shipment");
const Seller = require("../src/models/Seller");

const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run") || !args.includes("--execute");
const isExecute = args.includes("--execute") && !args.includes("--dry-run");

async function run() {
  console.log("===============================================================");
  console.log("🚀 SWARNA SPARSH: SINGLE-VENDOR DATA MIGRATION AUDIT");
  console.log(`MODE: ${isDryRun ? "🔍 DRY-RUN (READ-ONLY, ZERO MUTATIONS)" : "⚠️ LIVE EXECUTION"}`);
  console.log("===============================================================\n");

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error("❌ Error: MONGO_URI / MONGODB_URI not found in environment.");
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log(`✅ Connected to MongoDB: ${mongoose.connection.name}\n`);

  // -------------------------------------------------------------
  // 1. PRODUCTS & INVENTORY AUDIT
  // -------------------------------------------------------------
  const allProducts = await Product.find({}).lean();
  const totalProducts = allProducts.length;

  let sellerOwnedProducts = 0;
  let storeOwnedProducts = 0;
  let missingSellerProducts = 0;
  let totalVariants = 0;
  let affectedVariants = 0;
  let totalSerializedUnits = 0;
  let affectedSerializedUnits = 0;
  const serialStatusCounts = { AVAILABLE: 0, SOLD_ONLINE: 0, SOLD_OFFLINE: 0, OTHER: 0 };
  const affectedSerialStatusCounts = { AVAILABLE: 0, SOLD_ONLINE: 0, SOLD_OFFLINE: 0, OTHER: 0 };

  // Fetch all known seller IDs to detect orphaned/missing seller references
  const validSellers = await Seller.find({}).select("_id storeName ownerName status").lean();
  const validSellerIdSet = new Set(validSellers.map(s => String(s._id)));
  const sellerProductBreakdown = {};

  const productsToMigrate = [];

  for (const product of allProducts) {
    const isSeller = Boolean(product.sellerId);
    const sellerIdStr = isSeller ? String(product.sellerId) : null;

    if (isSeller) {
      sellerOwnedProducts++;
      productsToMigrate.push(product);
      if (!validSellerIdSet.has(sellerIdStr)) {
        missingSellerProducts++;
      }
      sellerProductBreakdown[sellerIdStr] = (sellerProductBreakdown[sellerIdStr] || 0) + 1;
    } else {
      storeOwnedProducts++;
    }

    const variants = product.variants || [];
    totalVariants += variants.length;
    if (isSeller) {
      affectedVariants += variants.length;
    }

    for (const variant of variants) {
      const serialCodes = variant.serialCodes || [];
      totalSerializedUnits += serialCodes.length;
      if (isSeller) {
        affectedSerializedUnits += serialCodes.length;
      }

      for (const unit of serialCodes) {
        const st = unit.status || "OTHER";
        if (serialStatusCounts[st] !== undefined) {
          serialStatusCounts[st]++;
        } else {
          serialStatusCounts.OTHER++;
        }

        if (isSeller) {
          if (affectedSerialStatusCounts[st] !== undefined) {
            affectedSerialStatusCounts[st]++;
          } else {
            affectedSerialStatusCounts.OTHER++;
          }
        }
      }
    }
  }

  console.log("---------------------------------------------------------------");
  console.log("📦 1. PRODUCTS AUDIT (CURRENT OPERATIONAL OWNERSHIP)");
  console.log("---------------------------------------------------------------");
  console.log(`  Total Products in Catalog:         ${totalProducts}`);
  console.log(`  - Seller-owned products:            ${sellerOwnedProducts}`);
  console.log(`  - Already store-owned products:     ${storeOwnedProducts}`);
  console.log(`  - Products with orphaned seller ID: ${missingSellerProducts}`);
  console.log(`  - Products that will change:        ${productsToMigrate.length} (sellerId -> null)`);
  if (sellerOwnedProducts > 0) {
    console.log("\n  Seller Breakdown:");
    for (const [sId, count] of Object.entries(sellerProductBreakdown)) {
      const sellerInfo = validSellers.find(s => String(s._id) === sId);
      const sellerLabel = sellerInfo ? `"${sellerInfo.storeName}" (${sellerInfo.ownerName})` : "Unknown / Orphaned Seller";
      console.log(`    * Seller ID ${sId} [${sellerLabel}]: ${count} products`);
    }
  }

  console.log("\n---------------------------------------------------------------");
  console.log("🔢 2. VARIANTS & SERIALIZED INVENTORY AUDIT");
  console.log("---------------------------------------------------------------");
  console.log(`  Total Variants:                     ${totalVariants}`);
  console.log(`  - Variants in store-owned products: ${totalVariants - affectedVariants}`);
  console.log(`  - Affected variants to transition:  ${affectedVariants}`);
  console.log(`  Total Serialized Units:             ${totalSerializedUnits}`);
  console.log(`    - AVAILABLE:                      ${serialStatusCounts.AVAILABLE}`);
  console.log(`    - SOLD_ONLINE:                    ${serialStatusCounts.SOLD_ONLINE}`);
  console.log(`    - SOLD_OFFLINE:                   ${serialStatusCounts.SOLD_OFFLINE}`);
  if (serialStatusCounts.OTHER > 0) {
    console.log(`    - OTHER:                          ${serialStatusCounts.OTHER}`);
  }
  console.log(`  Affected Serial Units in Seller SKU:${affectedSerializedUnits}`);
  console.log(`    - AVAILABLE (ready for store):    ${affectedSerialStatusCounts.AVAILABLE}`);
  console.log(`    - SOLD_ONLINE:                    ${affectedSerialStatusCounts.SOLD_ONLINE}`);
  console.log(`    - SOLD_OFFLINE:                   ${affectedSerialStatusCounts.SOLD_OFFLINE}`);

  // -------------------------------------------------------------
  // 3. PICKUP LOCATIONS AUDIT
  // -------------------------------------------------------------
  const allPickupLocations = await PickupLocation.find({}).lean();
  const sellerLocations = allPickupLocations.filter(loc => Boolean(loc.sellerId));
  const storeLocations = allPickupLocations.filter(loc => !loc.sellerId);
  const defaultStoreLocation = storeLocations.find(loc => loc.isStoreDefault || loc.isDefault);

  console.log("\n---------------------------------------------------------------");
  console.log("🏭 3. PICKUP LOCATIONS / WAREHOUSES AUDIT");
  console.log("---------------------------------------------------------------");
  console.log(`  Total Pickup Locations:             ${allPickupLocations.length}`);
  console.log(`  - Existing seller locations:        ${sellerLocations.length}`);
  console.log(`  - Existing store locations:         ${storeLocations.length}`);
  if (defaultStoreLocation) {
    console.log(`  - Default Store Warehouse:          "${defaultStoreLocation.warehouseName}"`);
    console.log(`    City/State/Pincode:               ${defaultStoreLocation.city}, ${defaultStoreLocation.state} (${defaultStoreLocation.pincode})`);
    console.log(`    Shiprocket Pickup ID:             ${defaultStoreLocation.shiprocketPickupId || defaultStoreLocation.shiprocketLocationId || "Not assigned"}`);
  } else {
    console.log(`  - Default Store Warehouse:          None configured!`);
  }
  console.log(`  Action for Pickup Locations:        KEEP historical seller locations intact; Store warehouse remains primary origin`);

  // -------------------------------------------------------------
  // 4. ORDERS AUDIT (HISTORICAL TRANSACTION TRUTH — ZERO MUTATION)
  // -------------------------------------------------------------
  const allOrders = await Order.find({}).lean();
  const totalOrders = allOrders.length;
  let historicalSellerOrders = 0;

  for (const order of allOrders) {
    const hasAllocations = Array.isArray(order.sellerInvoiceAllocations) && order.sellerInvoiceAllocations.length > 0;
    const hasSellerItems = Array.isArray(order.items) && order.items.some(it => Boolean(it.sellerId));
    const hasSellerShipments = Array.isArray(order.sellerShipments) && order.sellerShipments.length > 0;
    if (hasAllocations || hasSellerItems || hasSellerShipments) {
      historicalSellerOrders++;
    }
  }

  console.log("\n---------------------------------------------------------------");
  console.log("🛒 4. ORDERS AUDIT (HISTORICAL RECORDS — ZERO MUTATION)");
  console.log("---------------------------------------------------------------");
  console.log(`  Total Orders in Database:           ${totalOrders}`);
  console.log(`  - Historical seller-involved orders:${historicalSellerOrders}`);
  console.log(`  - Single-vendor / store orders:     ${totalOrders - historicalSellerOrders}`);
  console.log(`  - Orders requiring migration:       0 (STRICT: Historical records MUST remain untouched)`);
  console.log(`  - Orders that will NOT be modified: ${totalOrders} (100% preserved)`);

  // -------------------------------------------------------------
  // 5. COMMISSIONS AUDIT (HISTORICAL FINANCIAL TRUTH — ZERO MUTATION)
  // -------------------------------------------------------------
  const allCommissions = await Commission.find({}).lean();
  const totalCommissionAmount = allCommissions.reduce((acc, c) => acc + (Number(c.commissionAmount) || 0), 0);

  console.log("\n---------------------------------------------------------------");
  console.log("💰 5. COMMISSIONS AUDIT (HISTORICAL FINANCIALS — ZERO MUTATION)");
  console.log("---------------------------------------------------------------");
  console.log(`  Total Historical Commission Records:${allCommissions.length}`);
  console.log(`  Total Commission Value Recorded:    ₹${totalCommissionAmount.toFixed(2)}`);
  console.log(`  - Commission records to modify:     0 (STRICT: ZERO MUTATION)`);

  // -------------------------------------------------------------
  // 6. PAYOUT REQUESTS AUDIT (HISTORICAL FINANCIAL TRUTH — ZERO MUTATION)
  // -------------------------------------------------------------
  const allPayouts = await PayoutRequest.find({}).lean();
  const payoutStatusCounts = { pending: 0, approved: 0, processed: 0, rejected: 0 };
  for (const p of allPayouts) {
    const st = p.status || "pending";
    payoutStatusCounts[st] = (payoutStatusCounts[st] || 0) + 1;
  }

  console.log("\n---------------------------------------------------------------");
  console.log("💳 6. PAYOUT REQUESTS AUDIT (HISTORICAL FINANCIALS — ZERO MUTATION)");
  console.log("---------------------------------------------------------------");
  console.log(`  Total Historical Payout Requests:   ${allPayouts.length}`);
  for (const [st, cnt] of Object.entries(payoutStatusCounts)) {
    console.log(`    - ${st}: ${cnt}`);
  }
  console.log(`  - Payout records to modify:         0 (STRICT: ZERO MUTATION)`);

  // -------------------------------------------------------------
  // 7. WALLET TRANSACTIONS AUDIT (HISTORICAL FINANCIAL TRUTH — ZERO MUTATION)
  // -------------------------------------------------------------
  const allWalletTransactions = await WalletTransaction.find({}).lean();

  console.log("\n---------------------------------------------------------------");
  console.log("💼 7. WALLET TRANSACTIONS AUDIT (HISTORICAL FINANCIALS — ZERO MUTATION)");
  console.log("---------------------------------------------------------------");
  console.log(`  Total Historical Wallet Txns:       ${allWalletTransactions.length}`);
  console.log(`  - Wallet transactions to modify:    0 (STRICT: ZERO MUTATION)`);

  // -------------------------------------------------------------
  // 8. SELLER INVOICES AUDIT (HISTORICAL TAX TRUTH — ZERO MUTATION)
  // -------------------------------------------------------------
  const allSellerInvoices = await SellerInvoice.find({}).lean();

  console.log("\n---------------------------------------------------------------");
  console.log("🧾 8. SELLER INVOICES AUDIT (HISTORICAL TAX — ZERO MUTATION)");
  console.log("---------------------------------------------------------------");
  console.log(`  Total Historical Seller Invoices:   ${allSellerInvoices.length}`);
  console.log(`  - Seller invoices to modify:        0 (STRICT: ZERO MUTATION)`);

  // -------------------------------------------------------------
  // 9. STOCK LOGS & DIRECT SALES AUDIT (AUDIT TRAIL — ZERO MUTATION)
  // -------------------------------------------------------------
  const allStockLogs = await StockLog.countDocuments();
  const allDirectSales = await DirectSale.countDocuments();
  const allShipments = await Shipment.find({}).lean();
  const historicalSellerShipments = allShipments.filter(s => Boolean(s.sellerId)).length;

  console.log("\n---------------------------------------------------------------");
  console.log("📋 9. OTHER OPERATIONAL RECORDS (AUDIT TRAIL — ZERO MUTATION)");
  console.log("---------------------------------------------------------------");
  console.log(`  Total StockLog audit entries:       ${allStockLogs} (Will modify: 0)`);
  console.log(`  Total DirectSale POS records:       ${allDirectSales} (Will modify: 0)`);
  console.log(`  Total Shipment records:             ${allShipments.length} (Seller: ${historicalSellerShipments}, Store: ${allShipments.length - historicalSellerShipments}, Will modify: 0)`);

  const Notification = require("../src/models/Notification");
  const allNotifications = await Notification.countDocuments();
  const historicalSellerNotifications = await Notification.countDocuments({ sellerId: { $exists: true, $ne: null } });

  console.log("\n---------------------------------------------------------------");
  console.log("🔔 10. NOTIFICATIONS AUDIT (HISTORICAL TRAIL — ZERO MUTATION)");
  console.log("---------------------------------------------------------------");
  console.log(`  Total Notification records:         ${allNotifications}`);
  console.log(`  - Historical seller notifications:  ${historicalSellerNotifications}`);
  console.log(`  - Admin & Customer notifications:   ${allNotifications - historicalSellerNotifications}`);
  console.log(`  - Notifications to modify:          0 (STRICT: ZERO MUTATION)`);

  // -------------------------------------------------------------
  // 11. SELLER / LEGACY BASELINE (PRE-RETIREMENT AUDIT SNAPSHOT)
  // -------------------------------------------------------------
  const sellerStatuses = { approved: 0, pending: 0, rejected: 0, locked: 0, other: 0 };
  for (const s of validSellers) {
    const st = (s.status || "").toLowerCase();
    if (sellerStatuses[st] !== undefined) sellerStatuses[st]++;
    else sellerStatuses.other++;
  }

  const SellerProduct = require("../src/models/SellerProduct");
  const sellerProductCount = await SellerProduct.countDocuments();
  const sellerStockLogs = await StockLog.countDocuments({ sellerId: { $exists: true, $ne: null } });
  const sellerDirectSales = await DirectSale.countDocuments({ sellerId: { $exists: true, $ne: null } });

  console.log("\n===============================================================");
  console.log("📋 SELLER / LEGACY BASELINE (PRE-RETIREMENT AUDIT SNAPSHOT)");
  console.log("===============================================================");
  console.log(`
Sellers:
  total: ${validSellers.length}
  approved: ${sellerStatuses.approved}
  pending: ${sellerStatuses.pending}
  rejected: ${sellerStatuses.rejected}
  locked: ${sellerStatuses.locked}

Products:
  sellerId != null: ${sellerOwnedProducts}
  sellerId == null: ${storeOwnedProducts}

Orders:
  total: ${totalOrders}
  historical seller-linked: ${historicalSellerOrders}
  new single-vendor: ${totalOrders - historicalSellerOrders}

Commission:
  total: ${allCommissions.length}

PayoutRequest:
  total: ${allPayouts.length}

WalletTransaction:
  total: ${allWalletTransactions.length}

SellerInvoice:
  total: ${allSellerInvoices.length}

SellerProduct:
  total: ${sellerProductCount}

Seller-related StockLogs:
  total: ${sellerStockLogs}

Seller-related Shipments:
  total: ${historicalSellerShipments}

Seller-related DirectSales:
  total: ${sellerDirectSales}

Seller Notifications:
  total: ${historicalSellerNotifications}
`);

  // -------------------------------------------------------------
  // 12. SUMMARY OF PROPOSED CHANGES
  // -------------------------------------------------------------
  console.log("===============================================================");
  console.log("📊 STAGE 3 MIGRATION PLAN: BEFORE vs AFTER IMPACT");
  console.log("===============================================================");
  console.log(`
Collection          | Total Docs | Affected Docs | Proposed Action
--------------------|------------|---------------|-----------------------------------------
Product             | ${String(totalProducts).padEnd(10)} | ${String(productsToMigrate.length).padEnd(13)} | Set sellerId = null (Explicit query: { sellerId: { $exists: true, $ne: null } })
Order               | ${String(totalOrders).padEnd(10)} | ${"0".padEnd(13)} | PRESERVED (Keep historical allocations & sellerIds)
Commission          | ${String(allCommissions.length).padEnd(10)} | ${"0".padEnd(13)} | PRESERVED (Historical financial records untouched)
PayoutRequest       | ${String(allPayouts.length).padEnd(10)} | ${"0".padEnd(13)} | PRESERVED (Historical financial records untouched)
WalletTransaction   | ${String(allWalletTransactions.length).padEnd(10)} | ${"0".padEnd(13)} | PRESERVED (Historical financial records untouched)
SellerInvoice       | ${String(allSellerInvoices.length).padEnd(10)} | ${"0".padEnd(13)} | PRESERVED (Historical GST invoices untouched)
PickupLocation      | ${String(allPickupLocations.length).padEnd(10)} | ${"0".padEnd(13)} | PRESERVED (Store warehouse is default; seller locs kept)
StockLog            | ${String(allStockLogs).padEnd(10)} | ${"0".padEnd(13)} | PRESERVED (Immutable stock audit trail untouched)
DirectSale          | ${String(allDirectSales).padEnd(10)} | ${"0".padEnd(13)} | PRESERVED (Historical POS records untouched)
Shipment            | ${String(allShipments.length).padEnd(10)} | ${"0".padEnd(13)} | PRESERVED (Historical fulfillment records untouched)
Notification        | ${String(allNotifications).padEnd(10)} | ${"0".padEnd(13)} | PRESERVED (Historical notification logs untouched)
`);

  if (isDryRun) {
    console.log("---------------------------------------------------------------");
    console.log("🔒 DRY-RUN COMPLETE: ZERO WRITES PERFORMED");
    console.log("   To execute live migration once approved, run with --execute");
    console.log("---------------------------------------------------------------");
    await mongoose.disconnect();
    process.exit(0);
  }

  // -------------------------------------------------------------
  // 13. LIVE EXECUTION BLOCK (ONLY IF --execute PROVIDED)
  // -------------------------------------------------------------
  if (isExecute) {
    console.log("---------------------------------------------------------------");
    console.log("⚠️ LIVE EXECUTION INITIATED: VERIFYING PRE-CONDITIONS...");
    console.log("---------------------------------------------------------------");

    const countBefore = await Product.countDocuments({ sellerId: { $exists: true, $ne: null } });

    // Safety guard: If unexpected non-zero products exist, require explicit confirmation
    if (countBefore > 0 && !args.includes("--confirm-non-zero")) {
      console.error(`❌ Aborted: Found ${countBefore} seller products. Rerun with --confirm-non-zero to execute.`);
      await mongoose.disconnect();
      process.exit(1);
    }

    let backupFile = null;
    if (productsToMigrate.length > 0) {
      const backupDir = path.join(__dirname, "backups");
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      backupFile = path.join(backupDir, `products-pre-migration-${timestamp}.json`);
      fs.writeFileSync(backupFile, JSON.stringify(productsToMigrate, null, 2), "utf8");
      console.log(`  ✅ Backup saved: ${backupFile}`);
      console.log(`  Snapshot contains ${productsToMigrate.length} affected product documents.`);
    }

    console.log("\n  Executing auditable catalog migration with explicit query:");
    console.log("  Filter: { sellerId: { $exists: true, $ne: null } } -> Update: { $set: { sellerId: null } }");

    const updateResult = await Product.updateMany(
      { sellerId: { $exists: true, $ne: null } },
      { $set: { sellerId: null } }
    );

    const countAfter = await Product.countDocuments({ sellerId: { $exists: true, $ne: null } });

    console.log("\n---------------------------------------------------------------");
    console.log("📋 AUDITABLE MIGRATION LOG");
    console.log("---------------------------------------------------------------");
    console.log("Before:");
    console.log(`  Products with sellerId != null: ${countBefore}`);
    console.log("\nMigration:");
    console.log(`  Matched:  ${updateResult.matchedCount}`);
    console.log(`  Modified: ${updateResult.modifiedCount}`);
    console.log("\nAfter:");
    console.log(`  Products with sellerId != null: ${countAfter}`);
    console.log("---------------------------------------------------------------");

    if (countAfter === 0) {
      console.log("\n🎉 STAGE 3 MIGRATION SUCCEEDED: 100% OF CATALOG IS NOW SWARNA SPARSH OWNED (NO-OP VERIFIED)");
    } else {
      console.error("\n❌ Warning: Unexpected products still have non-null sellerId!");
    }

    await mongoose.disconnect();
    process.exit(0);
  }
}

run().catch((err) => {
  console.error("\n❌ Fatal migration error:", err);
  process.exit(1);
});
