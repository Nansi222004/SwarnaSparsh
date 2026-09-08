require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("../src/config/db");
const Product = require("../src/models/Product");
const Setting = require("../src/models/Setting");
const Seller = require("../src/models/Seller");
const { applyMetalPricingToProduct } = require("../src/utils/metalPricing");

const applyMode = process.argv.includes("--apply");

const run = async () => {
  await connectDB();

  const settings = await Setting.findOne();
  const gstRate = settings?.gstRate || 0;
  const adminRates = settings?.metalRates || {};

  const products = await Product.find({});
  const sellerIds = [...new Set(
    products
      .map((product) => product.sellerId ? String(product.sellerId) : null)
      .filter(Boolean)
  )];
  const sellers = await Seller.find({ _id: { $in: sellerIds } }).select("_id metalRates");
  const sellerRateMap = new Map(
    sellers.map((seller) => [String(seller._id), seller.metalRates || {}])
  );

  let touchedProducts = 0;
  let defaultedChargeBearer = 0;
  let defaultedHallmarking = 0;
  let defaultedCertificate = 0;

  for (const product of products) {
    let changed = false;
    if (!product.paymentGatewayChargeBearer) {
      product.paymentGatewayChargeBearer = "seller";
      defaultedChargeBearer += 1;
      changed = true;
    }

    product.variants = (product.variants || []).map((variant) => {
      const nextVariant = variant.toObject ? variant.toObject() : { ...variant };

      if (nextVariant.hallmarkingCharge === undefined || nextVariant.hallmarkingCharge === null) {
        nextVariant.hallmarkingCharge = 0;
        defaultedHallmarking += 1;
        changed = true;
      }

      if (nextVariant.diamondCertificateCharge === undefined || nextVariant.diamondCertificateCharge === null) {
        nextVariant.diamondCertificateCharge = Number(nextVariant.diamondPrice) || 0;
        defaultedCertificate += 1;
        changed = true;
      }

      return nextVariant;
    });

    if (changed) {
      touchedProducts += 1;
    }

    if (applyMode) {
      const ownerRates = product.sellerId
        ? (sellerRateMap.get(String(product.sellerId)) || {})
        : adminRates;
      applyMetalPricingToProduct(product, ownerRates, gstRate);
      // eslint-disable-next-line no-await-in-loop
      await product.save();
    }
  }

  console.log(JSON.stringify({
    mode: applyMode ? "apply" : "dry-run",
    totalProducts: products.length,
    touchedProducts,
    defaultedChargeBearer,
    defaultedHallmarking,
    defaultedCertificate
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
