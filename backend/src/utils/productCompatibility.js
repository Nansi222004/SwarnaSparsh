const sanitizeSegment = (value = "") =>
  String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "")
    .slice(0, 18);

const getLegacyProductCode = (product = {}) => {
  if (product.productCode) return product.productCode;
  const rawId = String(product._id || "LEGACY");
  return `PRD-LEGACY-${rawId.slice(-8).toUpperCase()}`;
};

const getLegacyVariantCode = (productCode, variant, index) => {
  if (variant?.variantCode) return variant.variantCode;
  return `VAR-${sanitizeSegment(productCode)}-${String(index + 1).padStart(2, "0")}`;
};

const normalizeProductForResponse = (product) => {
  if (!product) return product;

  const plainProduct = typeof product.toObject === "function"
    ? product.toObject({ virtuals: true })
    : { ...product };

  const fallbackWeight = plainProduct.weight !== undefined && plainProduct.weight !== null
    ? Number(plainProduct.weight) || 0
    : 0;
  const fallbackWeightUnit = plainProduct.weightUnit || "Grams";
  const productCode = getLegacyProductCode(plainProduct);

  plainProduct.productCode = productCode;
  plainProduct.variants = Array.isArray(plainProduct.variants)
    ? plainProduct.variants.map((variant, index) => ({
        ...variant,
        variantCode: getLegacyVariantCode(productCode, variant, index),
        variantImages: Array.isArray(variant?.variantImages) ? variant.variantImages : [],
        variantFaqs: Array.isArray(variant?.variantFaqs) ? variant.variantFaqs : [],
        weight: variant?.weight !== undefined && variant?.weight !== null && variant?.weight !== ""
          ? Number(variant.weight) || 0
          : fallbackWeight,
        weightUnit: variant?.weightUnit || fallbackWeightUnit
      }))
    : [];

  const firstVariantImage = plainProduct.variants.find(
    (variant) => Array.isArray(variant?.variantImages) && variant.variantImages.length > 0
  )?.variantImages?.[0] || null;

  if (!plainProduct.image && firstVariantImage) {
    plainProduct.image = firstVariantImage;
  }

  if ((!Array.isArray(plainProduct.images) || plainProduct.images.length === 0) && firstVariantImage) {
    plainProduct.images = [firstVariantImage];
  }

  return plainProduct;
};

module.exports = {
  normalizeProductForResponse,
  getLegacyProductCode,
  getLegacyVariantCode
};
