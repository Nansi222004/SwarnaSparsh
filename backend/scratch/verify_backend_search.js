const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const connectDB = require("../src/config/db");
const productController = require("../src/modules/public/controllers/product.controller");

// Mock res
function createMockRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    }
  };
}

(async () => {
  await connectDB();

  const testQueries = [
    "gold",
    "diamond",
    "silver",
    "finger ring",
    "ring",
    "necklace",
    "earring",
    "mala",
    "GOLD",
    "  ring  ",
    "choker",
    "bangles",
    "bangle",
    "Random unmatched text 1234"
  ];

  console.log("=== TESTING getProducts (/api/public/products?search=...) ===");
  for (const q of testQueries) {
    const req = { query: { search: q } };
    const res = createMockRes();
    await productController.getProducts(req, res);
    const count = res.body?.data?.products?.length || 0;
    const total = res.body?.data?.pagination?.total || 0;
    console.log(`\nQuery: "${q}" -> Total: ${total}, Returned: ${count}`);
    if (count > 0) {
      const sample = res.body.data.products.slice(0, 4).map(p => `"${p.name}" (${p.category} / ${p.material})`).join(" | ");
      console.log(`   Top results: ${sample}`);
    }
  }

  console.log("\n=== TESTING searchProducts (/api/public/products/search?q=...) ===");
  for (const q of ["ring", "finger ring", "gold", "silver", "diamond", "necklace", "bangles", "Random unmatched text 1234"]) {
    const req = { query: { q } };
    const res = createMockRes();
    await productController.searchProducts(req, res);
    const suggestions = res.body?.data?.suggestions || [];
    console.log(`\nSuggestions for "${q}": ${suggestions.length}`);
    suggestions.slice(0, 3).forEach((s, idx) => {
      console.log(`   ${idx + 1}. "${s.name}" | Cat: ${s.category} | Mat: ${s.material} | ₹${s.price}`);
    });
  }

  process.exit(0);
})();
