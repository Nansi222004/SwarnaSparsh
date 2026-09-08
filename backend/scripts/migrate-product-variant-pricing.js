require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("../src/config/db");
const Product = require("../src/models/Product");
const Setting = require("../src/models/Setting");
const Seller = require("../src/models/Seller");
const { applyMetalPricingToProduct } = require("../src/utils/metalPricing");
const { generateUniqueProductCode, generateVariantCode } = require("../src/utils/productIdentity");

const applyMode = process.argv.includes("--apply");

const normalizeVariantsForMigration = (product) => {
  const fallbackWeight = product.weight !== undefined && product.weight !== null
    ? Number(product.weight) || 0
    : 0;
  const fallbackWeightUnit = product.weightUnit || "Grams";

  const existingCodes = new Set(
    (product.variants || [])
      .map((variant) => variant.variantCode)
      .filter(Boolean)
  );

  let variantChanges = 0;
  const normalizedVariants = (product.variants || []).map((variant, index) => {
    const nextVariant = { ...variant.toObject?.() || variant };

    if (!nextVariant.variantCode) {
      nextVariant.variantCode = generateVariantCode(product.productCode, index, existingCodes);
      variantChanges += 1;
    }

    if (nextVariant.weight === undefined || nextVariant.weight === null || nextVariant.weight === "") {
      nextVariant.weight = fallbackWeight;
      variantChanges += 1;
    }

    if (!nextVariant.weightUnit) {
      nextVariant.weightUnit = fallbackWeightUnit;
      variantChanges += 1;
    }

    return nextVariant;
  });

  return { normalizedVariants, variantChanges };
};

const run = async () => {
  await connectDB();

  const settings = await Setting.findOne();
  const gstRate = settings?.gstRate || 0;

  const products = await Product.find({});
  const sellerIds = [...new Set(products.map((product) => String(product.sellerId || "")).filter(Boolean))];
  const sellers = await Seller.find({ _id: { $in: sellerIds } }).select("_id metalRates");
  const sellerRateMap = new Map(sellers.map((seller) => [String(seller._id), seller.metalRates || {}]));

  let missingProductCodes = 0;
  let missingVariantCodes = 0;
  let missingVariantWeights = 0;
  let touchedProducts = 0;

  for (const product of products) {
    let changed = false;

    if (!product.productCode) {
      missingProductCodes += 1;
      if (applyMode) {
        // eslint-disable-next-line no-await-in-loop
        product.productCode = await generateUniqueProductCode(Product);
      }
      changed = true;
    }

    const variantCodeMissingCount = (product.variants || []).filter((variant) => !variant.variantCode).length;
    const variantWeightMissingCount = (product.variants || []).filter((variant) => (
      variant.weight === undefined || variant.weight === null || variant.weight === "" || !variant.weightUnit
    )).length;

    missingVariantCodes += variantCodeMissingCount;
    missingVariantWeights += variantWeightMissingCount;

    if (variantCodeMissingCount > 0 || variantWeightMissingCount > 0 || !product.productCode) {
      const { normalizedVariants } = normalizeVariantsForMigration(product);
      if (applyMode) {
        product.variants = normalizedVariants;
        const ownerRates = product.sellerId
          ? (sellerRateMap.get(String(product.sellerId)) || {})
          : (settings?.metalRates || {});
        applyMetalPricingToProduct(product, ownerRates, gstRate);
        // eslint-disable-next-line no-await-in-loop
        await product.save();
      }
      changed = true;
    }

    if (changed) touchedProducts += 1;
  }

  console.log(JSON.stringify({
    mode: applyMode ? "apply" : "dry-run",
    totalProducts: products.length,
    touchedProducts,
    missingProductCodes,
    missingVariantCodes,
    missingVariantWeights
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
