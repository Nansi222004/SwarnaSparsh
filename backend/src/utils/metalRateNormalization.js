const normalizeRateValue = (value, fallback = undefined) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeTenGramRates = (incoming = {}, existing = {}, legacyPerGram = 0, keys = []) => {
  const legacyTenGram = Number(legacyPerGram || 0) * 10;
  return keys.reduce((acc, key) => {
    const incomingValue = normalizeRateValue(incoming?.[key]);
    const existingValue = normalizeRateValue(existing?.[key]);
    acc[key] = incomingValue !== undefined
      ? incomingValue
      : (existingValue !== undefined ? existingValue : legacyTenGram);
    return acc;
  }, {});
};

const pickPreferredGoldTenGram = (gold10g = {}) =>
  normalizeRateValue(gold10g.k18)
  ?? normalizeRateValue(gold10g.k22)
  ?? normalizeRateValue(gold10g.k14)
  ?? normalizeRateValue(gold10g.k24)
  ?? 0;

const pickPreferredSilverTenGram = (silver10g = {}) =>
  normalizeRateValue(silver10g.silverOther)
  ?? normalizeRateValue(silver10g.sterling925)
  ?? 0;

const normalizeMetalRates = (incoming = {}, existing = {}) => {
  const normalized = {};

  let goldPerGram = normalizeRateValue(incoming.goldPerGram, normalizeRateValue(existing.goldPerGram));
  if (incoming.goldPerGram === undefined && incoming.goldPerMilligram !== undefined) {
    goldPerGram = normalizeRateValue(incoming.goldPerMilligram, 0) * 1000;
  } else if (goldPerGram === undefined && existing.goldPerMilligram !== undefined) {
    goldPerGram = normalizeRateValue(existing.goldPerMilligram, 0) * 1000;
  }

  let silverPerGram = normalizeRateValue(incoming.silverPerGram, normalizeRateValue(existing.silverPerGram));
  if (incoming.silverPerGram === undefined && incoming.silverPerMilligram !== undefined) {
    silverPerGram = normalizeRateValue(incoming.silverPerMilligram, 0) * 1000;
  } else if (silverPerGram === undefined && existing.silverPerMilligram !== undefined) {
    silverPerGram = normalizeRateValue(existing.silverPerMilligram, 0) * 1000;
  }

  const gold10g = normalizeTenGramRates(incoming.gold10g, existing.gold10g, goldPerGram, [
    "k14", "k18", "k22", "k24"
  ]);
  const silver10g = normalizeTenGramRates(incoming.silver10g, existing.silver10g, silverPerGram, [
    "sterling925", "silverOther"
  ]);

  if (goldPerGram === undefined || incoming.gold10g) {
    goldPerGram = pickPreferredGoldTenGram(gold10g) / 10;
  }
  if (silverPerGram === undefined || incoming.silver10g) {
    silverPerGram = pickPreferredSilverTenGram(silver10g) / 10;
  }

  normalized.goldPerGram = normalizeRateValue(goldPerGram, 0);
  normalized.goldPerMilligram = normalized.goldPerGram / 1000;
  normalized.silverPerGram = normalizeRateValue(silverPerGram, 0);
  normalized.silverPerMilligram = normalized.silverPerGram / 1000;
  normalized.gold10g = gold10g;
  normalized.silver10g = silver10g;

  return normalized;
};

const hasNegativeRate = (rates = {}) => {
  const flatValues = [
    rates.goldPerGram,
    rates.goldPerMilligram,
    rates.silverPerGram,
    rates.silverPerMilligram,
    ...(rates.gold10g ? Object.values(rates.gold10g) : []),
    ...(rates.silver10g ? Object.values(rates.silver10g) : [])
  ];

  return flatValues.some((value) => Number(value) < 0);
};

module.exports = { normalizeMetalRates, hasNegativeRate };
