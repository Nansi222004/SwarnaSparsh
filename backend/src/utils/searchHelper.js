/**
 * Search Helper for Alankar Jewellers
 * Handles intelligent query parsing, synonym/category expansion,
 * MongoDB query generation, and relevance-based ranking.
 */

const JEWELLERY_SYNONYMS = {
  ring: ["finger-ring", "ring", "rings", "finger ring", "finger rings", "band"],
  rings: ["finger-ring", "ring", "rings", "finger ring", "finger rings"],
  "finger ring": ["finger-ring", "ring", "rings", "finger ring"],
  "finger rings": ["finger-ring", "ring", "rings", "finger ring"],
  earring: ["earrings", "earrings-earrings", "earring", "tops", "chandbali", "hoops", "studs", "jhumka", "bali"],
  earrings: ["earrings", "earrings-earrings", "earring", "tops", "chandbali", "hoops", "studs", "jhumka", "bali"],
  tops: ["earrings", "earrings-earrings", "earring", "tops"],
  chandbali: ["earrings", "earrings-earrings", "earring", "chandbali"],
  hoops: ["earrings", "earrings-earrings", "earring", "hoops"],
  necklace: ["necklace", "necklace-necklace", "long-sets", "choker", "chokar", "collar"],
  necklaces: ["necklace", "necklace-necklace", "long-sets", "choker", "chokar", "collar"],
  choker: ["necklace", "necklace-necklace", "choker", "chokar"],
  chokar: ["necklace", "necklace-necklace", "choker", "chokar"],
  collar: ["necklace", "necklace-necklace"],
  "long set": ["long-sets", "necklace"],
  "long sets": ["long-sets", "necklace"],
  bangle: ["bangles", "bangle", "kada", "bracelet"],
  bangles: ["bangles", "bangle", "kada", "bracelet"],
  bracelet: ["bracelet", "bangles", "kada"],
  bracelets: ["bracelet", "bangles", "kada"],
  kada: ["bangles", "bracelet", "kada"],
  pendant: ["chain-pendent", "pendant", "chain", "locket"],
  pendants: ["chain-pendent", "pendant", "chain", "locket"],
  chain: ["chain-pendent", "chain", "pendant"],
  chains: ["chain-pendent", "chain", "pendant"],
  mangalsutra: ["mangalsutra", "long-mangalsutra"],
  mangalsutras: ["mangalsutra", "long-mangalsutra"],
  mala: ["malas", "mala"],
  malas: ["malas", "mala"],
  bajubandh: ["bajubandh"],
  tika: ["mang-tika", "tika", "tikka"],
  tikka: ["mang-tika", "tika", "tikka"],
  "mang tika": ["mang-tika", "tika", "tikka"],
  "maang tikka": ["mang-tika", "tika", "tikka"],
};

function escapeRegex(str) {
  return String(str || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeTerm(term) {
  return String(term || "")
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ");
}

function getWordVariations(word) {
  const clean = String(word || "").trim().toLowerCase();
  if (!clean) return [];
  const variations = new Set([clean]);

  // Handle common English singular/plural forms
  if (clean.endsWith("ies") && clean.length > 3) {
    variations.add(clean.slice(0, -3) + "y");
  } else if (clean.endsWith("es") && clean.length > 2) {
    variations.add(clean.slice(0, -2));
  } else if (clean.endsWith("s") && clean.length > 1) {
    variations.add(clean.slice(0, -1));
  } else {
    variations.add(clean + "s");
    variations.add(clean + "es");
  }

  // Common spelling variations
  if (clean === "choker") variations.add("chokar");
  if (clean === "chokar") variations.add("choker");
  if (clean === "tika") variations.add("tikka");
  if (clean === "tikka") variations.add("tika");
  if (clean === "oxidised" || clean === "oxydised") {
    variations.add("oxidised");
    variations.add("oxydised");
    variations.add("oxidi");
    variations.add("oxydis");
  }

  return Array.from(variations);
}

/**
 * Builds the MongoDB query conditions for a search string.
 */
function buildSearchMongoFilter(rawSearch) {
  const normalized = normalizeTerm(rawSearch);
  if (!normalized) return null;

  const words = normalized.split(" ").filter(Boolean);
  const conditions = [];

  // Mapped categories and keywords from synonym table
  const mappedCategories = new Set();
  const relatedKeywords = new Set();

  if (JEWELLERY_SYNONYMS[normalized]) {
    JEWELLERY_SYNONYMS[normalized].forEach((k) => {
      mappedCategories.add(k);
      relatedKeywords.add(k);
    });
  }

  words.forEach((w) => {
    if (JEWELLERY_SYNONYMS[w]) {
      JEWELLERY_SYNONYMS[w].forEach((k) => {
        mappedCategories.add(k);
        relatedKeywords.add(k);
      });
    }
  });

  // 1. Direct name regex matching full phrase or variations
  const escapedPhrase = escapeRegex(normalized);
  conditions.push({ name: { $regex: escapedPhrase, $options: "i" } });
  conditions.push({ description: { $regex: `\\b${escapedPhrase}\\b`, $options: "i" } });

  // 2. Individual words variations on name, category, material
  words.forEach((w) => {
    const vars = getWordVariations(w);
    vars.forEach((v) => {
      const escaped = escapeRegex(v);
      conditions.push({ name: { $regex: `\\b${escaped}\\b`, $options: "i" } });
      conditions.push({ category: { $regex: `^${escaped}$`, $options: "i" } });
      conditions.push({ categorySlug: { $regex: `^${escaped}$`, $options: "i" } });
      conditions.push({ material: { $regex: escaped, $options: "i" } });
      conditions.push({ settingMetal: { $regex: escaped, $options: "i" } });
    });
  });

  // 3. Category match from synonym mappings
  if (mappedCategories.size > 0) {
    const catList = Array.from(mappedCategories);
    conditions.push({ categorySlug: { $in: catList } });
    conditions.push({
      category: { $in: catList.map((c) => new RegExp(`^${escapeRegex(c)}$`, "i")) }
    });
  }

  // 4. Metal & material checks
  if (normalized === "gold" || words.includes("gold")) {
    conditions.push({ material: { $regex: "gold", $options: "i" } });
    conditions.push({ settingMetal: { $regex: "gold", $options: "i" } });
    conditions.push({ goldCategory: { $exists: true, $ne: "" } });
  }

  if (normalized === "silver" || words.includes("silver")) {
    conditions.push({ material: { $regex: "silver", $options: "i" } });
    conditions.push({ settingMetal: { $regex: "silver", $options: "i" } });
    conditions.push({ silverCategory: { $exists: true, $ne: "" } });
  }

  if (normalized === "diamond" || words.includes("diamond")) {
    conditions.push({ diamondType: { $in: ["natural", "lab_grown"] } });
    conditions.push({ "variants.diamondPrice": { $gt: 0 } });
    conditions.push({ material: { $regex: "diamond", $options: "i" } });
    conditions.push({ name: { $regex: "\\b(ad|american\\s*diamond|diamond)\\b", $options: "i" } });
  }

  // 5. Related keywords regex
  relatedKeywords.forEach((rw) => {
    const escaped = escapeRegex(rw);
    conditions.push({ name: { $regex: `\\b${escaped}\\b`, $options: "i" } });
    conditions.push({ categorySlug: { $regex: `^${escaped}$`, $options: "i" } });
  });

  return { $or: conditions };
}

/**
 * Calculates a fine-grained relevance score for a product given a search query.
 * Returns 0 if product is not relevant.
 */
function scoreProductRelevance(product, rawSearch) {
  const query = normalizeTerm(rawSearch);
  if (!query) return 0;

  const queryWords = query.split(" ").filter(Boolean);
  const nameLower = String(product.name || "").trim().toLowerCase();
  const descLower = String(product.description || "").trim().toLowerCase();
  const catSlug = String(product.categorySlug || "").trim().toLowerCase();
  const catName = String(
    typeof product.category === "object" ? product.category?.name : product.category || ""
  ).trim().toLowerCase();
  const material = String(product.material || "").trim().toLowerCase();
  const settingMetal = String(product.settingMetal || "").trim().toLowerCase();

  let score = 0;
  let hasTitleOrCategoryOrMaterialMatch = false;

  // 1. Exact Name match (highest priority)
  if (nameLower === query) {
    score += 1000;
    hasTitleOrCategoryOrMaterialMatch = true;
  } else if (nameLower.startsWith(query)) {
    score += 500;
    hasTitleOrCategoryOrMaterialMatch = true;
  } else if (new RegExp(`\\b${escapeRegex(query)}\\b`, "i").test(nameLower)) {
    score += 350;
    hasTitleOrCategoryOrMaterialMatch = true;
  }

  // Synonyms and category expansion
  const mappedCategories = new Set();
  const relatedKeywords = new Set();

  if (JEWELLERY_SYNONYMS[query]) {
    JEWELLERY_SYNONYMS[query].forEach((k) => {
      mappedCategories.add(k);
      relatedKeywords.add(k);
    });
  }
  queryWords.forEach((qw) => {
    if (JEWELLERY_SYNONYMS[qw]) {
      JEWELLERY_SYNONYMS[qw].forEach((k) => {
        mappedCategories.add(k);
        relatedKeywords.add(k);
      });
    }
  });

  // 2. Category match
  const matchesCat =
    catSlug === query ||
    catName === query ||
    mappedCategories.has(catSlug) ||
    mappedCategories.has(catName);

  if (matchesCat) {
    score += 260;
    hasTitleOrCategoryOrMaterialMatch = true;
  }

  // 3. Word-by-word variations in name
  let matchedWordsCount = 0;
  queryWords.forEach((qw) => {
    const variations = getWordVariations(qw);
    const hasWord = variations.some((v) =>
      new RegExp(`\\b${escapeRegex(v)}\\b`, "i").test(nameLower)
    );
    if (hasWord) {
      matchedWordsCount++;
      score += 160;
      hasTitleOrCategoryOrMaterialMatch = true;
    }
  });

  // Bonus if all query words appeared in the title
  if (queryWords.length > 1 && matchedWordsCount === queryWords.length) {
    score += 200;
  }

  // 4. Metal / Material match
  const isMetalSearch = ["gold", "silver", "diamond"].includes(query);
  if (isMetalSearch) {
    if (query === "gold") {
      if (material.includes("gold") || settingMetal.includes("gold") || product.goldCategory) {
        score += 220;
        hasTitleOrCategoryOrMaterialMatch = true;
      }
    } else if (query === "silver") {
      if (material.includes("silver") || settingMetal.includes("silver") || product.silverCategory) {
        score += 220;
        hasTitleOrCategoryOrMaterialMatch = true;
      }
    } else if (query === "diamond") {
      if (
        material.includes("diamond") ||
        nameLower.includes("diamond") ||
        /\b(ad|american diamond)\b/i.test(nameLower) ||
        product.diamondType === "natural" ||
        product.diamondType === "lab_grown"
      ) {
        score += 220;
        hasTitleOrCategoryOrMaterialMatch = true;
      }
    }
  } else {
    // Normal material match
    queryWords.forEach((qw) => {
      if (material.includes(qw)) {
        score += 60;
        hasTitleOrCategoryOrMaterialMatch = true;
      }
    });
  }

  // 5. Related keywords in title
  relatedKeywords.forEach((rw) => {
    if (new RegExp(`\\b${escapeRegex(rw)}\\b`, "i").test(nameLower)) {
      score += 40;
      hasTitleOrCategoryOrMaterialMatch = true;
    }
  });

  // 6. Whole-word description match
  // IMPORTANT: Only give points to description if the product already had some title, category, or material relevance.
  // This completely stops false matches where a necklace or bracelet mentions "ring" in styling suggestions!
  if (hasTitleOrCategoryOrMaterialMatch) {
    queryWords.forEach((qw) => {
      if (qw.length > 2 && new RegExp(`\\b${escapeRegex(qw)}\\b`, "i").test(descLower)) {
        score += 10;
      }
    });
  }

  // Category-specific strict boundaries:
  // When a user searches specifically for a product category type, ensure cross-category contamination does NOT happen:
  const isRingSearch = query === "ring" || query === "rings" || query === "finger ring" || query === "finger rings";
  if (isRingSearch) {
    const isRing =
      catSlug === "finger-ring" ||
      catName.includes("ring") ||
      /\bring\b/i.test(nameLower);
    if (!isRing) return 0;
  }

  const isEarringSearch = query === "earring" || query === "earrings";
  if (isEarringSearch) {
    const isEarring =
      catSlug.includes("earring") ||
      catName.includes("earring") ||
      /\b(earring|earrings|tops|chandbali|hoops|jhumka)\b/i.test(nameLower);
    if (!isEarring) return 0;
  }

  const isNecklaceSearch = query === "necklace" || query === "necklaces" || query === "choker" || query === "chokar";
  if (isNecklaceSearch) {
    const isNecklace =
      catSlug.includes("necklace") ||
      catSlug === "long-sets" ||
      catName.includes("necklace") ||
      /\b(necklace|choker|chokar|collar|set)\b/i.test(nameLower);
    if (!isNecklace) return 0;
  }

  const isBangleSearch = query === "bangles" || query === "bangle";
  if (isBangleSearch) {
    const isBangle =
      catSlug === "bangles" ||
      catName.includes("bangle") ||
      /\b(bangle|bangles|kada)\b/i.test(nameLower);
    if (!isBangle) return 0;
  }

  const isMalaSearch = query === "mala" || query === "malas";
  if (isMalaSearch) {
    const isMala =
      catSlug === "malas" ||
      catName.includes("mala") ||
      /\bmala\b/i.test(nameLower);
    if (!isMala) return 0;
  }

  // Reject candidates that only had 0 or negligible score
  return score >= 20 ? score : 0;
}

module.exports = {
  JEWELLERY_SYNONYMS,
  escapeRegex,
  normalizeTerm,
  getWordVariations,
  buildSearchMongoFilter,
  scoreProductRelevance,
};
