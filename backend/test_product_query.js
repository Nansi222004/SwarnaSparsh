const dotenv = require("dotenv");
dotenv.config();

const connectDB = require("./src/config/db");
const Product = require("./src/models/Product");

(async () => {
  await connectDB();
  const sample = await Product.findOne({ status: "Active" }).lean();
  console.log("SAMPLE PRODUCT KEYS:", Object.keys(sample || {}));
  console.log("SAMPLE PRODUCT DATA:", {
    name: sample?.name,
    status: sample?.status,
    active: sample?.active,
    sellerId: sample?.sellerId,
    categorySlug: sample?.categorySlug,
    category: sample?.category,
    categories: sample?.categories,
    material: sample?.material,
    metal: sample?.metal,
    variants: sample?.variants?.map(v => ({ name: v.name, price: v.price, stock: v.stock }))
  });

  // Test what getProducts query does:
  // query = { status: "Active", active: { $ne: false } };
  // andFilters = [{ $or: [{ sellerId: null }, { sellerId: { $exists: false } }] }]
  // andFilters.push({ categorySlug: { $nin: [...] }, category: { $not: ... }, name: { $not: ... }, material: { $not: ... } })
  const andFilters = [
    { $or: [{ sellerId: null }, { sellerId: { $exists: false } }] },
    {
      categorySlug: { $nin: ["hand-bags", "clutches", "potli-bag", "sling-bag"] },
      category: { $not: { $regex: "bag|clutch|potli|sling|oxidi|oxydis", $options: "i" } },
      name: { $not: { $regex: "\\bbag\\b|\\bclutch\\b|\\bpotli\\b|\\bsling\\b|oxidi|oxydis", $options: "i" } },
      material: { $not: { $regex: "oxidi|oxydis", $options: "i" } }
    }
  ];
  const q = { status: "Active", active: { $ne: false }, $and: andFilters };
  const matches = await Product.find(q).lean();
  console.log("Matches with andFilters:", matches.length);

  // If matches is 0, let's test which filter eliminated them!
  if (matches.length === 0) {
    const q1 = { status: "Active", active: { $ne: false } };
    console.log("q1 count:", await Product.countDocuments(q1));
    const q2 = { ...q1, $or: [{ sellerId: null }, { sellerId: { $exists: false } }] };
    console.log("q2 (seller scope) count:", await Product.countDocuments(q2));
    const q3 = { ...q2, categorySlug: { $nin: ["hand-bags", "clutches", "potli-bag", "sling-bag"] } };
    console.log("q3 (categorySlug) count:", await Product.countDocuments(q3));
    const q4 = { ...q3, category: { $not: { $regex: "bag|clutch|potli|sling|oxidi|oxydis", $options: "i" } } };
    console.log("q4 (category regex) count:", await Product.countDocuments(q4));
    const q5 = { ...q4, name: { $not: { $regex: "\\bbag\\b|\\bclutch\\b|\\bpotli\\b|\\bsling\\b|oxidi|oxydis", $options: "i" } } };
    console.log("q5 (name regex) count:", await Product.countDocuments(q5));
    const q6 = { ...q5, material: { $not: { $regex: "oxidi|oxydis", $options: "i" } } };
    console.log("q6 (material regex) count:", await Product.countDocuments(q6));
  } else {
    console.log("Sample matches:", matches.slice(0, 3).map(m => m.name));
  }

  process.exit(0);
})();
