/**
 * Pre-Retirement Archive Restore Tool
 * Restores seller documents and historical data from the verified snapshot.
 */
"use strict";

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const SNAPSHOT_FILE = path.resolve(__dirname, "../archive/seller-retirement-snapshot.json");

async function restoreArchive() {
  const isDryRun = process.argv.includes("--dry-run");

  console.log("================================================================");
  console.log(`🔄 PRE-RETIREMENT ARCHIVE RESTORE ${isDryRun ? "[DRY RUN]" : "[EXECUTE]"}`);
  console.log("================================================================");

  if (!fs.existsSync(SNAPSHOT_FILE)) {
    throw new Error(`Snapshot file not found at: ${SNAPSHOT_FILE}`);
  }

  const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT_FILE, "utf8"));
  console.log(`Snapshot Metadata:`, snapshot.metadata);

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  await mongoose.connect(mongoUri);
  const db = mongoose.connection.db;

  const sellers = snapshot.data.sellers || [];
  console.log(`\nSellers in snapshot: ${sellers.length}`);

  if (sellers.length > 0) {
    const existingCount = await db.collection("sellers").countDocuments({ _id: new mongoose.Types.ObjectId(sellers[0]._id) });
    console.log(`  Existing target sellers in live collection: ${existingCount}`);

    if (!isDryRun) {
      for (const seller of sellers) {
        const id = new mongoose.Types.ObjectId(seller._id);
        const copy = { ...seller };
        delete copy._id;
        await db.collection("sellers").updateOne(
          { _id: id },
          { $set: copy },
          { upsert: true }
        );
        console.log(`  ✅ Restored seller: ${seller.shopName || seller.fullName} (${seller._id})`);
      }
    }
  }

  await mongoose.disconnect();
  console.log("\nRestore process complete.");
}

restoreArchive().catch((err) => {
  console.error("❌ Restore failed:", err);
  process.exit(1);
});
