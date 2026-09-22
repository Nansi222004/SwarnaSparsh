const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const connectDB = require("./src/config/db");
const Product = require("./src/models/Product");
const Category = require("./src/models/Category");

(async () => {
  await connectDB();
  const total = await Product.countDocuments();
  console.log("TOTAL PRODUCTS IN DB:", total);

  const activeCount = await Product.countDocuments({ status: "Active", active: { $ne: false } });
  console.log("ACTIVE PRODUCTS:", activeCount);

  const prods = await Product.find({ status: "Active", active: { $ne: false } })
    .select("name category categorySlug material metal price variants images diamondType")
    .lean();

  console.log("Found active prods:", prods.length);

  // Group by categorySlug / category
  const cats = {};
  const malas = [];
  prods.forEach(p => {
    const c = p.categorySlug || p.category || 'unknown';
    cats[c] = (cats[c] || 0) + 1;
    const name = String(p.name || '').toLowerCase();
    if (name.includes('mala') || c.includes('mala')) {
      malas.push({
        id: p._id,
        name: p.name,
        category: c,
        material: p.material,
        img: p.images?.[0]
      });
    }
  });

  console.log("Categories distribution:", cats);
  console.log("Mala products count:", malas.length);
  console.log("Mala products details:", JSON.stringify(malas, null, 2));

  console.log("\nSample 15 non-mala products:");
  prods.filter(p => !p.name.toLowerCase().includes('mala')).slice(0, 15).forEach(p => {
    console.log(`- "${p.name}" | Cat: ${p.categorySlug || p.category} | Mat: ${p.material} | Img: ${p.images?.[0]}`);
  });

  process.exit(0);
})();
