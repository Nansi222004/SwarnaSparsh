const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const connectDB = require("../src/config/db");
const Product = require("../src/models/Product");
const Category = require("../src/models/Category");
const getApprovedSellerScope = async () => ({
  $or: [{ sellerId: null }, { sellerId: { $exists: false } }]
});

async function testQuery(search) {
  const andFilters = [await getApprovedSellerScope()];
  const query = { status: "Active", active: { $ne: false } };

  // Current backend logic in product.controller.js lines 78-87:
  if (search) {
    andFilters.push({
      $or: [
        { name: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { settingMetal: { $regex: search, $options: "i" } }
      ]
    });
  }

  // Lines 110-116:
  const excludedCategorySlugs = ["hand-bags", "clutches", "potli-bag", "sling-bag"];
  andFilters.push({
    categorySlug: { $nin: excludedCategorySlugs },
    category: { $not: { $regex: "bag|clutch|potli|sling|oxidi|oxydis", $options: "i" } },
    name: { $not: { $regex: "\\bbag\\b|\\bclutch\\b|\\bpotli\\b|\\bsling\\b|oxidi|oxydis", $options: "i" } },
    material: { $not: { $regex: "oxidi|oxydis", $options: "i" } }
  });

  // Mala exclusion:
  const isMalaExplicitlyRequested = Boolean(
    (search && /\bmala\b/i.test(String(search).trim()))
  );
  if (!isMalaExplicitlyRequested) {
    andFilters.push({
      categorySlug: { $ne: "malas" },
      category: { $not: { $regex: "^malas?$", $options: "i" } },
      name: { $not: { $regex: "\\bmala(\\s*set)?\\b", $options: "i" } }
    });
  }

  query.$and = andFilters;

  const results = await Product.find(query).select("name category categorySlug material").lean();
  return results;
}

(async () => {
  await connectDB();
  const testQueries = ["gold", "diamond", "silver", "finger ring", "ring", "necklace", "earring", "mala", "GOLD", "  ring  ", "randomunmatchedtext1234"];
  for (const q of testQueries) {
    const res = await testQuery(q);
    console.log(`QUERY: "${q}" -> COUNT: ${res.length}`);
    if (res.length > 0) {
      console.log(`   Sample: ${res.slice(0, 3).map(r => r.name + ' (' + r.categorySlug + ' / ' + r.material + ')').join(' | ')}`);
    }
  }
  process.exit(0);
})();
