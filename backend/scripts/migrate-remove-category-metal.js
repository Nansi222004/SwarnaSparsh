require("dotenv").config();

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const connectDB = require("../src/config/db");
const Category = require("../src/models/Category");

const applyMode = process.argv.includes("--apply");
const skipBackup = process.argv.includes("--skip-backup");

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const run = async () => {
  await connectDB();

  const filter = { metal: { $exists: true } };
  const existingCount = await Category.collection.countDocuments(filter);

  let backupFile = null;
  let modifiedCount = 0;
  if (applyMode && existingCount > 0) {
    if (!skipBackup) {
      const backupDocs = await Category.collection.find(filter).toArray();
      const backupDir = path.join(__dirname, "..", "backups");
      ensureDir(backupDir);
      backupFile = path.join(
        backupDir,
        `categories-with-metal-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`
      );
      fs.writeFileSync(backupFile, JSON.stringify(backupDocs, null, 2), "utf8");
    }

    const result = await Category.collection.updateMany(filter, { $unset: { metal: "" } });
    modifiedCount = result?.modifiedCount || 0;
  }

  console.log(JSON.stringify({
    mode: applyMode ? "apply" : "dry-run",
    existingDocumentsWithMetal: existingCount,
    backupCreated: Boolean(backupFile),
    backupFile,
    modifiedDocuments: modifiedCount
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
