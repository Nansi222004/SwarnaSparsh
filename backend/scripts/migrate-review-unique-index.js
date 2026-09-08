require("dotenv").config();

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const connectDB = require("../src/config/db");
const Review = require("../src/models/Review");

const applyMode = process.argv.includes("--apply");
const skipBackup = process.argv.includes("--skip-backup");

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const pickKeeper = (reviews) => {
  const approved = reviews.filter((item) => item.status === "approved" || item.isApproved === true);
  if (approved.length) {
    return approved[0];
  }
  return reviews[0];
};

const run = async () => {
  await connectDB();

  const duplicateGroups = await Review.aggregate([
    {
      $group: {
        _id: { productId: "$productId", userId: "$userId" },
        ids: { $push: "$_id" },
        count: { $sum: 1 }
      }
    },
    {
      $match: {
        count: { $gt: 1 }
      }
    }
  ]);

  let duplicatesRemoved = 0;
  let backupFile = null;
  const backupRows = [];

  if (applyMode && duplicateGroups.length) {
    for (const group of duplicateGroups) {
      const reviews = await Review.find({
        _id: { $in: group.ids }
      })
        .sort({ createdAt: -1 })
        .lean();

      const keeper = pickKeeper(reviews);
      const removable = reviews.filter((row) => String(row._id) !== String(keeper._id));

      if (removable.length) {
        backupRows.push(...removable);
        const deleteResult = await Review.deleteMany({
          _id: { $in: removable.map((row) => row._id) }
        });
        duplicatesRemoved += deleteResult.deletedCount || 0;
      }
    }

    if (!skipBackup && backupRows.length) {
      const backupDir = path.join(__dirname, "..", "backups");
      ensureDir(backupDir);
      backupFile = path.join(
        backupDir,
        `reviews-duplicate-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`
      );
      fs.writeFileSync(backupFile, JSON.stringify(backupRows, null, 2), "utf8");
    }
  }

  let indexEnsured = false;
  let indexError = null;
  if (applyMode) {
    try {
      await Review.collection.createIndex({ productId: 1, userId: 1 }, { unique: true, name: "product_user_unique" });
      indexEnsured = true;
    } catch (err) {
      indexError = err.message;
    }
  }

  console.log(JSON.stringify({
    mode: applyMode ? "apply" : "dry-run",
    duplicateGroupCount: duplicateGroups.length,
    duplicateReviewCount: duplicateGroups.reduce((acc, item) => acc + (item.count - 1), 0),
    duplicatesRemoved,
    backupCreated: Boolean(backupFile),
    backupFile,
    indexEnsured,
    indexError
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
