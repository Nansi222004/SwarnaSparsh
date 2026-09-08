require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("../src/config/db");
const Product = require("../src/models/Product");

const applyMode = process.argv.includes("--apply");

const normalizeText = (value) => String(value || "").toLowerCase();

const detectGoldKarat = (text) => {
  const haystack = normalizeText(text);
  if (/\b24\s*k\b|\b24k\b|\b24\s*karat\b/.test(haystack)) return "24";
  if (/\b22\s*k\b|\b22k\b|\b22\s*karat\b/.test(haystack)) return "22";
  if (/\b18\s*k\b|\b18k\b|\b18\s*karat\b/.test(haystack)) return "18";
  if (/\b14\s*k\b|\b14k\b|\b14\s*karat\b/.test(haystack)) return "14";
  return "";
};

const detectSilverTier = (text) => {
  const haystack = normalizeText(text);
  if (haystack.includes("sterling")) return "925 sterling silver";
  if (/\b(800|835|925|958|970|990|999)\b/.test(haystack)) return "925";
  return "";
};

const getProductMetal = (product) => {
  const material = normalizeText(product.material || product.metal);
  if (material.includes("gold")) return "gold";
  if (material.includes("silver")) return "silver";

  if (product.goldCategory) return "gold";
  if (product.silverCategory) return "silver";
  return "";
};

const run = async () => {
  await connectDB();

  const products = await Product.find({});

  let touchedProducts = 0;
  let goldAssigned = 0;
  let silverAssigned = 0;

  for (const product of products) {
    const metal = getProductMetal(product);
    let changed = false;

    if (metal === "gold" && !product.goldCategory) {
      const sourceText = [
        product.name,
        product.description,
        product.material
      ].join(" ");
      const detected = detectGoldKarat(sourceText);
      product.goldCategory = detected || "18";
      goldAssigned += 1;
      changed = true;
    }

    if (metal === "silver" && !product.silverCategory) {
      const sourceText = [
        product.name,
        product.description,
        product.material
      ].join(" ");
      const detected = detectSilverTier(sourceText);
      product.silverCategory = detected || "925";
      silverAssigned += 1;
      changed = true;
    }

    if (changed) {
      touchedProducts += 1;
      if (applyMode) {
        // eslint-disable-next-line no-await-in-loop
        await product.save();
      }
    }
  }

  console.log(JSON.stringify({
    mode: applyMode ? "apply" : "dry-run",
    totalProducts: products.length,
    touchedProducts,
    goldAssigned,
    silverAssigned
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
