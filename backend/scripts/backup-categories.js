require("dotenv").config();

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const connectDB = require("../src/config/db");
const Category = require("../src/models/Category");

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const run = async () => {
  await connectDB();

  const categories = await Category.find({}).lean();
  const backupDir = path.join(__dirname, "..", "backups");
  ensureDir(backupDir);

  const filePath = path.join(
    backupDir,
    `categories-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`
  );

  fs.writeFileSync(filePath, JSON.stringify(categories, null, 2), "utf8");

  console.log(JSON.stringify({
    backupFile: filePath,
    totalCategories: categories.length
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
