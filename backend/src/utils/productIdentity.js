const buildTimestampSeed = () => {
  const now = Date.now().toString();
  return now.slice(-6);
};

const buildRandomSeed = () => String(Math.floor(100 + Math.random() * 900));

const normalizeCodeSegment = (value = "") =>
  String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "")
    .slice(0, 16);

const buildProductCodeCandidate = () => {
  const year = new Date().getFullYear();
  return `PRD-${year}-${buildTimestampSeed()}${buildRandomSeed()}`;
};

const generateUniqueProductCode = async (ProductModel) => {
  let attempts = 0;
  while (attempts < 20) {
    const candidate = buildProductCodeCandidate();
    // eslint-disable-next-line no-await-in-loop
    const existing = await ProductModel.findOne({ productCode: candidate }).select("_id");
    if (!existing) return candidate;
    attempts += 1;
  }
  return `PRD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};

const generateVariantCode = (productCode, index, existingCodes = new Set()) => {
  const base = normalizeCodeSegment(productCode || "PRD");
  let attempt = 0;
  while (attempt < 20) {
    const suffix = `${String(index + 1).padStart(2, "0")}${attempt ? `-${attempt}` : ""}`;
    const candidate = `VAR-${base}-${suffix}`;
    if (!existingCodes.has(candidate)) {
      existingCodes.add(candidate);
      return candidate;
    }
    attempt += 1;
  }
  const fallback = `VAR-${base}-${Date.now()}-${index + 1}`;
  existingCodes.add(fallback);
  return fallback;
};

module.exports = {
  generateUniqueProductCode,
  generateVariantCode
};
