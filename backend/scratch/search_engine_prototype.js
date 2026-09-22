const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const connectDB = require("../src/config/db");
const Product = require("../src/models/Product");

// Synonym dictionary and category mapping
const JEWELLERY_SYNONYMS = {
  ring: ["finger-ring", "ring", "rings", "finger ring", "finger rings", "band"],
  rings: ["finger-ring", "ring", "rings", "finger ring", "finger rings"],
  "finger ring": ["finger-ring", "ring", "rings", "finger ring"],
  "finger rings": ["finger-ring", "ring", "rings", "finger ring"],
  earring: ["earrings", "earrings-earrings", "earring", "tops", "chandbali", "hoops", "studs", "jhumka"],
  earrings: ["earrings", "earrings-earrings", "earring", "tops", "chandbali", "hoops", "studs", "jhumka"],
  tops: ["earrings", "earrings-earrings", "earring", "tops"],
  necklace: ["necklace", "necklace-necklace", "long-sets", "choker", "chokar", "collar"],
  necklaces: ["necklace", "necklace-necklace", "long-sets", "choker", "chokar", "collar"],
  choker: ["necklace", "necklace-necklace", "choker", "chokar"],
  chokar: ["necklace", "necklace-necklace", "choker", "chokar"],
  bangle: ["bangles", "bangle", "kada", "bracelet"],
  bangles: ["bangles", "bangle", "kada", "bracelet"],
  bracelet: ["bracelet", "bangles", "kada"],
  bracelets: ["bracelet", "bangles", "kada"],
  kada: ["bangles", "bracelet"],
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
  "mang tika": ["mang-tika", "tika", "tikka"],
  tikka: ["mang-tika", "tika", "tikka"],
};

function normalizeTerm(term) {
  return String(term || "")
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ");
}

function getWordVariations(word) {
  const variations = new Set([word]);
  // Singular / plural
  if (word.endsWith("ies")) {
    variations.add(word.slice(0, -3) + "y");
  } else if (word.endsWith("es")) {
    variations.add(word.slice(0, -2));
  } else if (word.endsWith("s")) {
    variations.add(word.slice(0, -1));
  } else {
    variations.add(word + "s");
    variations.add(word + "es");
  }
  return Array.from(variations);
}

function calculateScore(product, rawQuery) {
  const query = normalizeTerm(rawQuery);
  if (!query) return 0;

  const queryWords = query.split(" ").filter(Boolean);
  const nameLower = String(product.name || "").toLowerCase();
  const descLower = String(product.description || "").toLowerCase();
  const catSlug = String(product.categorySlug || "").toLowerCase();
  const catName = String(product.category || "").toLowerCase();
  const material = String(product.material || "").toLowerCase();
  const settingMetal = String(product.settingMetal || "").toLowerCase();

  let score = 0;

  // 1. Exact Name match
  if (nameLower === query) {
    score += 1000;
  } else if (nameLower.startsWith(query)) {
    score += 500;
  } else if (new RegExp(`\\b${query}\\b`, "i").test(nameLower)) {
    score += 300;
  }

  // Check synonym mappings
  const mappedCategories = new Set();
  const relatedKeywords = new Set();

  if (JEWELLERY_SYNONYMS[query]) {
    JEWELLERY_SYNONYMS[query].forEach((k) => {
      relatedKeywords.add(k);
      mappedCategories.add(k);
    });
  }
  queryWords.forEach((qw) => {
    if (JEWELLERY_SYNONYMS[qw]) {
      JEWELLERY_SYNONYMS[qw].forEach((k) => {
        relatedKeywords.add(k);
        mappedCategories.add(k);
      });
    }
  });

  // 2. Category match
  const matchesExactCat =
    catSlug === query ||
    catName === query ||
    mappedCategories.has(catSlug) ||
    mappedCategories.has(catName);

  if (matchesExactCat) {
    score += 250;
  }

  // 3. Query words matching product name with word boundary
  let wordsInName = 0;
  queryWords.forEach((qw) => {
    const variations = getWordVariations(qw);
    const hasWord = variations.some((v) => new RegExp(`\\b${v}\\b`, "i").test(nameLower));
    if (hasWord) {
      wordsInName++;
      score += 150;
    }
  });

  // 4. Metal / Material match
  const isMetalSearch = ["gold", "silver", "diamond"].includes(query);
  if (isMetalSearch) {
    if (query === "gold") {
      if (material.includes("gold") || settingMetal.includes("gold") || product.goldCategory) {
        score += 200;
      }
    } else if (query === "silver") {
      if (material.includes("silver") || settingMetal.includes("silver") || product.silverCategory) {
        score += 200;
      }
    } else if (query === "diamond") {
      if (
        material.includes("diamond") ||
        nameLower.includes("diamond") ||
        /\b(ad|american diamond)\b/i.test(nameLower) ||
        product.diamondType === "natural" ||
        product.diamondType === "lab_grown"
      ) {
        score += 200;
      }
    }
  } else {
    // Normal material bonus
    if (queryWords.some((qw) => material.includes(qw))) {
      score += 50;
    }
  }

  // 5. Related keywords
  relatedKeywords.forEach((rw) => {
    if (new RegExp(`\\b${rw}\\b`, "i").test(nameLower)) {
      score += 40;
    }
  });

  // 6. Description match (only whole word matches)
  queryWords.forEach((qw) => {
    if (qw.length > 2 && new RegExp(`\\b${qw}\\b`, "i").test(descLower)) {
      score += 10;
    }
  });

  // Strict check: if query has specific keywords (e.g. ring, earring, necklace),
  // ensure we do not falsely include unrelated products just because of a casual description mention
  if (query === "ring" || query === "rings" || query === "finger ring") {
    const isActuallyRing =
      catSlug === "finger-ring" ||
      catName.includes("ring") ||
      /\bring\b/i.test(nameLower);
    if (!isActuallyRing) {
      // It's not a ring, even if the description mentions "ring"
      return 0;
    }
  }

  if (query === "earring" || query === "earrings") {
    const isActuallyEarring =
      catSlug.includes("earring") ||
      catName.includes("earring") ||
      /\b(earring|earrings|tops|chandbali|hoops|jhumka)\b/i.test(nameLower);
    if (!isActuallyEarring) return 0;
  }

  if (query === "necklace" || query === "necklaces" || query === "choker") {
    const isActuallyNecklace =
      catSlug.includes("necklace") ||
      catSlug === "long-sets" ||
      catName.includes("necklace") ||
      /\b(necklace|choker|chokar|collar|set)\b/i.test(nameLower);
    if (!isActuallyNecklace) return 0;
  }

  if (query === "bangles" || query === "bangle") {
    const isActuallyBangle =
      catSlug === "bangles" ||
      catName.includes("bangle") ||
      /\b(bangle|bangles|kada)\b/i.test(nameLower);
    if (!isActuallyBangle) return 0;
  }

  return score;
}

(async () => {
  await connectDB();
  const allProds = await Product.find({ status: "Active", active: { $ne: false } }).lean();

  const testQueries = [
    "gold",
    "diamond",
    "silver",
    "finger ring",
    "ring",
    "necklace",
    "earring",
    "earrings",
    "mala",
    "choker",
    "bangles",
    "bangle",
    "GOLD",
    "  ring  ",
    "Random unmatched text 1234",
  ];

  for (const q of testQueries) {
    const scored = allProds
      .map((p) => ({ product: p, score: calculateScore(p, q) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);

    console.log(`\n========================================`);
    console.log(`QUERY: "${q}" -> MATCHED: ${scored.length}`);
    scored.slice(0, 5).forEach((item, idx) => {
      const p = item.product;
      console.log(
        `  ${idx + 1}. [score ${item.score}] "${p.name}" | Cat: ${p.categorySlug || p.category} | Mat: ${p.material}`
      );
    });
  }

  process.exit(0);
})();
