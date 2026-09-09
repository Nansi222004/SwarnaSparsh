/**
 * Pre-Retirement Archive Tool
 * Creates an authoritative, cryptographically verified archival snapshot of all
 * seller-linked entities before any destructive retirement of models or routes.
 */
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const mongoose = require("mongoose");
const { execSync } = require("child_process");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const ARCHIVE_DIR = path.resolve(__dirname, "../archive");
const SNAPSHOT_FILE = path.join(ARCHIVE_DIR, "seller-retirement-snapshot.json");
const MANIFEST_FILE = path.join(ARCHIVE_DIR, "archive-manifest.json");

const ENTITY_CONFIGS = [
  { name: "sellers", collection: "sellers", filter: {} },
  { name: "historical_seller_orders", collection: "orders", filter: { "items.sellerId": { $exists: true, $ne: null } } },
  { name: "historical_seller_notifications", collection: "notifications", filter: { sellerId: { $exists: true, $ne: null } } },
  { name: "historical_seller_shipments", collection: "shipments", filter: { sellerId: { $exists: true, $ne: null } } },
  { name: "historical_seller_stocklogs", collection: "stocklogs", filter: { sellerId: { $exists: true, $ne: null } } },
  { name: "directsales", collection: "directsales", filter: {} },
  { name: "sellerproducts", collection: "sellerproducts", filter: {} },
  { name: "sellerinvoices", collection: "sellerinvoices", filter: {} },
  { name: "commissions", collection: "commissions", filter: {} },
  { name: "payoutrequests", collection: "payoutrequests", filter: {} },
  { name: "wallettransactions", collection: "wallettransactions", filter: {} },
  { name: "sellersupporttickets", collection: "sellersupporttickets", filter: {} },
  { name: "sellermetalratelogs", collection: "sellermetalratelogs", filter: {} },
];

const canonicalJson = (obj) => JSON.stringify(obj, Object.keys(obj).sort());
const sha256 = (str) => crypto.createHash("sha256").update(str).digest("hex");

async function createArchive() {
  console.log("================================================================");
  console.log("📦 STARTING PRE-RETIREMENT ARCHIVE CREATION");
  console.log("================================================================");

  if (!fs.existsSync(ARCHIVE_DIR)) {
    fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
  }

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("Missing MONGO_URI in .env");
  }

  await mongoose.connect(mongoUri);
  const db = mongoose.connection.db;
  console.log(`Connected to MongoDB: ${db.databaseName}`);

  let gitCommit = "unknown";
  try {
    gitCommit = execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
  } catch (_e) {}

  const snapshot = {
    metadata: {
      generatedAt: new Date().toISOString(),
      database: db.databaseName,
      gitCommit,
      architectureTarget: "Swarna Sparsh Single-Vendor Phase 3B Consolidation"
    },
    data: {}
  };

  const manifest = {
    archiveTitle: "Swarna Sparsh Pre-Retirement Seller Data Snapshot",
    generatedAt: snapshot.metadata.generatedAt,
    database: db.databaseName,
    gitCommit,
    totalTrackedEntities: ENTITY_CONFIGS.length,
    entities: {}
  };

  for (const cfg of ENTITY_CONFIGS) {
    const rawDocs = await db.collection(cfg.collection).find(cfg.filter).toArray();
    // Sort canonically by _id string
    const sortedDocs = rawDocs.sort((a, b) => String(a._id).localeCompare(String(b._id)));
    const docIds = sortedDocs.map((d) => String(d._id));
    const serialized = JSON.stringify(sortedDocs);
    const hash = sha256(serialized);

    snapshot.data[cfg.name] = sortedDocs;
    manifest.entities[cfg.name] = {
      collection: cfg.collection,
      queryFilter: cfg.filter,
      documentCount: sortedDocs.length,
      documentIds: docIds,
      sha256: hash
    };

    console.log(`  📁 [${cfg.name.padEnd(32)}] Count: ${String(sortedDocs.length).padStart(3)} | SHA-256: ${hash.substring(0, 16)}...`);
  }

  // Write snapshot file
  const fullSnapshotStr = JSON.stringify(snapshot, null, 2);
  fs.writeFileSync(SNAPSHOT_FILE, fullSnapshotStr, "utf8");
  const snapshotDigest = sha256(fullSnapshotStr);

  manifest.snapshotFile = {
    filename: path.basename(SNAPSHOT_FILE),
    bytes: Buffer.byteLength(fullSnapshotStr, "utf8"),
    sha256: snapshotDigest
  };

  manifest.restoreInstructions = {
    strategy: "Independent external JSON restore or MongoDB localized collection reload",
    restoreScript: "node backend/scripts/restore-pre-retirement-archive.js",
    manualMongoshCommand: `db.sellers.insertMany(JSON.parse(fs.readFileSync('${SNAPSHOT_FILE.replace(/\\/g, "/")}'))['data']['sellers'])`
  };

  fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2), "utf8");

  // Also create localized archival collections inside MongoDB for live inspection safety
  if (snapshot.data.sellers.length > 0) {
    const archivedSellers = snapshot.data.sellers.map(s => ({
      ...s,
      _archivedAt: new Date(),
      _archiveReason: "Phase 3B Single-Vendor Consolidation Pre-Retirement",
      _originalCollection: "sellers"
    }));
    await db.collection("archived_sellers").deleteMany({});
    await db.collection("archived_sellers").insertMany(archivedSellers);
    console.log(`  💾 Persisted ${archivedSellers.length} documents into MongoDB collection: archived_sellers`);
  }

  if (snapshot.data.historical_seller_notifications.length > 0) {
    const archivedNotifs = snapshot.data.historical_seller_notifications.map(n => ({
      ...n,
      _archivedAt: new Date(),
      _archiveReason: "Phase 3B Single-Vendor Consolidation Pre-Retirement",
      _originalCollection: "notifications"
    }));
    await db.collection("archived_seller_notifications").deleteMany({});
    await db.collection("archived_seller_notifications").insertMany(archivedNotifs);
    console.log(`  💾 Persisted ${archivedNotifs.length} documents into MongoDB collection: archived_seller_notifications`);
  }

  await mongoose.disconnect();

  console.log("================================================================");
  console.log(`✅ ARCHIVE CREATED SUCCESSFULLY!`);
  console.log(`Snapshot Path : ${SNAPSHOT_FILE}`);
  console.log(`Manifest Path : ${MANIFEST_FILE}`);
  console.log(`Snapshot SHA  : ${snapshotDigest}`);
  console.log("================================================================");
}

createArchive().catch((err) => {
  console.error("❌ Archive creation failed:", err);
  process.exit(1);
});
