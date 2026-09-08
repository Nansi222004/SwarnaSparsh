const normalizeSerialCodes = (codes = []) => {
  if (!Array.isArray(codes)) return [];

  return codes
    .map((code) => {
      if (typeof code === "string") {
        return { code: String(code).trim().toUpperCase(), status: "AVAILABLE" };
      }

      if (code && typeof code === "object" && code.code) {
        return {
          code: String(code.code).trim().toUpperCase(),
          status: code.status || "AVAILABLE"
        };
      }

      return null;
    })
    .filter(Boolean);
};

const countAvailableCodes = (codes = []) =>
  normalizeSerialCodes(codes).filter((code) => (code.status || "AVAILABLE") === "AVAILABLE").length;

const buildSerialPrefix = (productName = "ITEM") => {
  const base = String(productName || "ITEM")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

  return base.substring(0, 4) || "ITEM";
};

const generateSerialCode = (existingSet, variantIndex = 0, prefixOverride) => {
  const prefix = prefixOverride || "ITEM";

  for (let attempt = 0; attempt < 50; attempt += 1) {
    const suffix =
      `${String(variantIndex + 1).padStart(2, "0")}` +
      `${Date.now().toString().slice(-4)}` +
      `${String(Math.floor(Math.random() * 900)).padStart(3, "0")}`;
    const code = `${prefix}${suffix}`;

    if (!existingSet.has(code)) {
      return code;
    }
  }

  return `${prefix}${Date.now().toString().slice(-10)}`;
};

const isSerializedVariant = (product, variant) =>
  Boolean(product?.isSerialized) || normalizeSerialCodes(variant?.serialCodes || []).length > 0;

const setSerializedVariantStock = ({ product, variant, desiredStock, variantIndex = 0 }) => {
  const numericStock = Number(desiredStock);
  if (!Number.isFinite(numericStock) || numericStock < 0) {
    throw new Error("Invalid stock value");
  }

  const normalized = normalizeSerialCodes(variant.serialCodes || []);
  const available = normalized.filter((code) => (code.status || "AVAILABLE") === "AVAILABLE");
  const sold = normalized.filter((code) => (code.status || "AVAILABLE") !== "AVAILABLE");
  const existingSet = new Set(normalized.map((code) => code.code));
  const prefix = buildSerialPrefix(product?.name);

  let updatedAvailable = [...available];

  if (numericStock > available.length) {
    const toAdd = numericStock - available.length;

    for (let index = 0; index < toAdd; index += 1) {
      const code = generateSerialCode(existingSet, variantIndex, prefix);
      existingSet.add(code);
      updatedAvailable.push({ code, status: "AVAILABLE" });
    }
  } else if (numericStock < available.length) {
    updatedAvailable = available.slice(0, numericStock);
  }

  variant.serialCodes = [...sold, ...updatedAvailable];
  variant.stock = updatedAvailable.length;

  return {
    stock: variant.stock,
    serialCodes: variant.serialCodes
  };
};

const consumeSerializedStock = ({ product, variant, quantity, variantIndex = 0, saleStatus = "SOLD_ONLINE" }) => {
  const numericQuantity = Number(quantity);
  if (!Number.isFinite(numericQuantity) || numericQuantity <= 0) {
    throw new Error("Invalid stock quantity");
  }

  const normalized = normalizeSerialCodes(variant.serialCodes || []);
  const sold = normalized.filter((code) => (code.status || "AVAILABLE") !== "AVAILABLE");
  const available = normalized.filter((code) => (code.status || "AVAILABLE") === "AVAILABLE");

  if (available.length < numericQuantity) {
    throw new Error("Insufficient serialized stock");
  }

  const remainingAvailable = available.slice(numericQuantity);
  const consumed = available.slice(0, numericQuantity).map((code) => ({
    ...code,
    status: saleStatus
  }));

  variant.serialCodes = [...sold, ...consumed, ...remainingAvailable];
  variant.stock = remainingAvailable.length;

  return {
    stock: variant.stock,
    serialCodes: variant.serialCodes,
    consumedCodes: consumed.map((code) => code.code)
  };
};

const restockSerializedUnits = ({ product, variant, quantity, variantIndex = 0 }) => {
  const numericQuantity = Number(quantity);
  if (!Number.isFinite(numericQuantity) || numericQuantity <= 0) {
    throw new Error("Invalid stock quantity");
  }

  return setSerializedVariantStock({
    product,
    variant,
    desiredStock: countAvailableCodes(variant.serialCodes || []) + numericQuantity,
    variantIndex
  });
};

module.exports = {
  normalizeSerialCodes,
  countAvailableCodes,
  buildSerialPrefix,
  generateSerialCode,
  isSerializedVariant,
  setSerializedVariantStock,
  consumeSerializedStock,
  restockSerializedUnits
};
