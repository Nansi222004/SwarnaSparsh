const normalizeString = (value = "") => String(value || "").trim().toLowerCase();

const resolveMaterialPayload = (materialOrProduct = {}) => {
  if (materialOrProduct && typeof materialOrProduct === "object") {
    return {
      material: materialOrProduct.material,
      goldCategory: materialOrProduct.goldCategory,
      silverCategory: materialOrProduct.silverCategory
    };
  }

  return { material: materialOrProduct };
};

const getTenGramRate = (payload = {}, rates = {}) => {
  const material = normalizeString(payload.material);

  if (material === "gold") {
    const goldCategory = normalizeString(payload.goldCategory);
    const gold10g = rates.gold10g || {};

    if (goldCategory === "14") return Number(gold10g.k14) || Number(rates.goldPerGram || 0) * 10;
    if (goldCategory === "18") return Number(gold10g.k18) || Number(rates.goldPerGram || 0) * 10;
    if (goldCategory === "22") return Number(gold10g.k22) || Number(rates.goldPerGram || 0) * 10;
    if (goldCategory === "24") return Number(gold10g.k24) || Number(rates.goldPerGram || 0) * 10;

    const fallbackGold10g = Number(gold10g.k18)
      || Number(gold10g.k22)
      || Number(gold10g.k14)
      || Number(gold10g.k24);

    return fallbackGold10g || Number(rates.goldPerGram || 0) * 10;
  }

  if (material === "silver") {
    const silverCategory = normalizeString(payload.silverCategory);
    const silver10g = rates.silver10g || {};
    const isSterling = silverCategory.includes("sterling");
    if (isSterling) return Number(silver10g.sterling925) || Number(rates.silverPerGram || 0) * 10;
    return Number(silver10g.silverOther) || Number(rates.silverPerGram || 0) * 10;
  }

  return 0;
};

const getMetalRate = (materialOrProduct = "", weightUnit = "Grams", rates = {}) => {
  const unit = normalizeString(weightUnit || "Grams");
  const payload = resolveMaterialPayload(materialOrProduct);
  const perTenGram = Number(getTenGramRate(payload, rates)) || 0;
  const perGram = perTenGram / 10;
  const perMilligram = perGram / 1000;

  if (unit === "milligrams" || unit === "milligram") return perMilligram;
  return perGram;
};

const computeMetalPrice = (materialOrProduct = "", weight = 0, weightUnit = "Grams", rates = {}) => {
  const normalizedWeight = Number(weight) || 0;
  const rate = getMetalRate(materialOrProduct, weightUnit, rates);
  return normalizedWeight * rate;
};

const roundCurrency = (value) => Math.round((Number(value) || 0) * 100) / 100;

const normalizeChargeBearer = (value = "") => {
  const normalized = normalizeString(value);
  if (normalized === "user") return "user";
  if (normalized === "seller" || normalized === "admin") return "seller";
  return "seller";
};

const getPaymentGatewayChargePercent = (chargeBearer = "") => (
  normalizeChargeBearer(chargeBearer) === "user" ? 2 : 0
);

const computeVariantPricing = ({
  product = {},
  variant = {},
  rates = {},
  gstRate = 0
} = {}) => {
  const fallbackWeight = Number(product.weight) || 0;
  const fallbackWeightUnit = product.weightUnit || "Grams";
  const variantWeight = variant.weight !== undefined && variant.weight !== null
    ? Number(variant.weight) || 0
    : fallbackWeight;
  const variantWeightUnit = variant.weightUnit || fallbackWeightUnit;
  const metalPrice = roundCurrency(
    computeMetalPrice(product, variantWeight, variantWeightUnit, rates)
  );
  const makingCharge = roundCurrency(Number(variant.makingCharge) || 0);
  const diamondPrice = roundCurrency(Number(variant.diamondPrice) || 0);
  const hallmarkingCharge = roundCurrency(Number(variant.hallmarkingCharge) || 0);
  const diamondCertificateCharge = roundCurrency(Number(variant.diamondCertificateCharge) || 0);
  const additionalCharge = roundCurrency(Number(variant.additionalCharge) || 0);
  const hiddenCharge = roundCurrency(hallmarkingCharge + diamondCertificateCharge + additionalCharge);
  const subtotalBeforeTax = roundCurrency(metalPrice + makingCharge + diamondPrice + hiddenCharge);
  const gstPercentage = Number(gstRate) || 0;
  const gstAmount = roundCurrency((subtotalBeforeTax * gstPercentage) / 100);
  const priceAfterTax = roundCurrency(subtotalBeforeTax + gstAmount);
  const pgChargePercent = getPaymentGatewayChargePercent(product.paymentGatewayChargeBearer);
  const pgChargeAmount = roundCurrency((priceAfterTax * pgChargePercent) / 100);
  const finalPrice = roundCurrency(priceAfterTax + pgChargeAmount);

  return {
    weight: variantWeight,
    weightUnit: variantWeightUnit,
    metalPrice,
    makingCharge,
    diamondPrice,
    hallmarkingCharge,
    diamondCertificateCharge,
    additionalCharge,
    hiddenCharge,
    subtotalBeforeTax,
    gstAmount,
    priceAfterTax,
    pgChargePercent,
    pgChargeAmount,
    gst: gstAmount,
    finalPrice,
    price: finalPrice,
    mrp: finalPrice
  };
};

const applyMetalPricingToProduct = (product, rates = {}, gstRate = 0) => {
  if (!product) return product;
  product.paymentGatewayChargeBearer = normalizeChargeBearer(product.paymentGatewayChargeBearer);

  if (Array.isArray(product.variants)) {
    product.variants = product.variants.map((variant) => {
      const pricing = computeVariantPricing({
        product,
        variant,
        rates,
        gstRate
      });

      return {
        ...variant,
        ...pricing
      };
    });
  }

  return product;
};

module.exports = {
  applyMetalPricingToProduct,
  computeMetalPrice,
  computeVariantPricing,
  getMetalRate,
  getPaymentGatewayChargePercent,
  normalizeChargeBearer
};
