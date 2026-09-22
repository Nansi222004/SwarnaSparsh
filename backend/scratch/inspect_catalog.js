const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const connectDB = require("../src/config/db");
const Product = require("../src/models/Product");

(async () => {
  await connectDB();
  const prods = await Product.find({ status: "Active", active: { $ne: false } }).lean();

  const materials = new Set();
  const settingMetals = new Set();
  const diamondTypes = new Set();
  const categorySlugs = new Set();

  prods.forEach(p => {
    if (p.material) materials.add(p.material);
    if (p.settingMetal) settingMetals.add(p.settingMetal);
    if (p.diamondType) diamondTypes.add(p.diamondType);
    if (p.categorySlug) categorySlugs.add(p.categorySlug);
    if (p.category) categorySlugs.add(p.category);
  });

  console.log("Distinct Materials:", Array.from(materials));
  console.log("Distinct SettingMetals:", Array.from(settingMetals));
  console.log("Distinct DiamondTypes:", Array.from(diamondTypes));
  console.log("Distinct CategorySlugs/Categories:", Array.from(categorySlugs));

  console.log("\nALL PRODUCTS (name | categorySlug | material | settingMetal):");
  prods.forEach(p => {
    console.log(`- "${p.name}" | slug:${p.slug} | cat:${p.categorySlug || p.category} | mat:${p.material} | sm:${p.settingMetal}`);
  });

  process.exit(0);
})();
