require("dotenv").config();

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const connectDB = require("../src/config/db");
const HomepageSection = require("../src/models/HomepageSection");
const Product = require("../src/models/Product");

const applyMode = process.argv.includes("--apply");
const skipBackup = process.argv.includes("--skip-backup");

const LEGACY_SECTION_KEYS = ["nav-gifts-for", "nav-occasions"];
const LEGACY_PRODUCT_FIELDS = ["navGiftsFor", "navOccasions"];

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const nowStamp = () => new Date().toISOString().replace(/[:.]/g, "-");

const run = async () => {
  await connectDB();

  const sectionFilter = {
    $or: [
      { sectionKey: { $in: LEGACY_SECTION_KEYS } },
      { sectionId: { $in: LEGACY_SECTION_KEYS } },
      { sectionId: { $in: LEGACY_SECTION_KEYS.map((key) => `home:${key}`) } }
    ]
  };

  const productFilter = {
    $or: LEGACY_PRODUCT_FIELDS.map((field) => ({ [field]: { $exists: true } }))
  };

  const existingLegacySections = await HomepageSection.collection.find(sectionFilter).toArray();
  const legacySectionCount = existingLegacySections.length;

  const productCount = await Product.collection.countDocuments(productFilter);

  let backupFile = null;
  let removedSections = 0;
  let modifiedProducts = 0;

  if (applyMode) {
    if (!skipBackup) {
      const backupDir = path.join(__dirname, "..", "backups");
      ensureDir(backupDir);
      backupFile = path.join(backupDir, `legacy-nav-placement-backup-${nowStamp()}.json`);

      const productIds = await Product.collection
        .find(productFilter, { projection: { _id: 1, navGiftsFor: 1, navOccasions: 1 } })
        .limit(5000)
        .toArray();

      fs.writeFileSync(
        backupFile,
        JSON.stringify({
          legacySections: existingLegacySections,
          productDocsSampleUpTo5000: productIds
        }, null, 2),
        "utf8"
      );
    }

    const deleteResult = await HomepageSection.collection.deleteMany(sectionFilter);
    removedSections = deleteResult?.deletedCount || 0;

    const updateResult = await Product.collection.updateMany(
      productFilter,
      { $unset: { navGiftsFor: "", navOccasions: "" } }
    );
    modifiedProducts = updateResult?.modifiedCount || 0;
  }

  console.log(JSON.stringify({
    mode: applyMode ? "apply" : "dry-run",
    legacySectionCount,
    legacySectionKeys: LEGACY_SECTION_KEYS,
    productDocsWithLegacyFields: productCount,
    backupCreated: Boolean(backupFile),
    backupFile,
    removedSections,
    modifiedProducts
  }, null, 2));

  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error(err);
  try {
    await mongoose.disconnect();
  } catch (disconnectErr) {
    console.error(disconnectErr);
  }
  process.exit(1);
});

