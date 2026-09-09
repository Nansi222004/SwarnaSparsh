/**
 * Centralized Fallback Image System for Swarna Sparsh
 * Uses authentic, local Swarna Sparsh project assets to guarantee
 * graceful degradation and luxury visual identity across the storefront.
 */

import premiumRing from '@assets/premium_ring_product.png';
import premiumNecklace from '@assets/premium_necklace_product.png';
import premiumPendant from '@assets/premium_pendant_product.png';
import premiumBracelet from '@assets/premium_bracelet_product.png';
import latestEarrings from '@assets/latest_drop_earrings.png';
import newAnklets from '@assets/new_launch_anklets.png';
import bridalAsset from '@assets/bridal.png';
import trendingHeritage from '@assets/trending_heritage.png';
import trendingModern from '@assets/trending_modern.png';
import catAllPremium from '@assets/cat_all_premium.png';
import catMenPremium from '@assets/cat_men_premium.png';
import catWomenPremium from '@assets/cat_women_premium.png';

// Semantic Category Assets
import catRings from '@assets/categories/rings.png';
import catEarrings from '@assets/categories/earrings.png';
import catPendants from '@assets/categories/pendants.png';
import catBracelets from '@assets/categories/bracelets.png';
import catBangle from '@assets/categories/bangle.png';
import catSets from '@assets/categories/sets.png';
import catMangalsutra from '@assets/categories/mangalsutra.png';
import catSilverchains from '@assets/categories/silverchains.png';
import catAnklets from '@assets/categories/anklets.png';
import catToerings from '@assets/categories/toerings.png';
import catNosepin from '@assets/categories/nosepin.png';
import catMensilver from '@assets/categories/mensilver.png';
import goldBangle from '@assets/categories/gold_bangle.png';
import goldRingsGreen from '@assets/categories/gold_rings_green.png';
import goldEarringsGreen from '@assets/categories/gold_earrings_green.png';
import goldPendantsGreen from '@assets/categories/gold_pendants_green.png';
import goldBraceletsGreen from '@assets/categories/gold_bracelets_green.png';
import goldBanglesGreen from '@assets/categories/gold_bangles_green.png';
import goldMangalsutraGreen from '@assets/categories/gold_mangalsutra_green.png';
import goldSetsGreen from '@assets/categories/gold_sets_green.png';
import goldNosepinsGreen from '@assets/categories/gold_nosepins_green.png';

export const IMAGE_FALLBACKS = {
  // Product fallbacks
  product: premiumPendant,
  ring: premiumRing,
  earring: latestEarrings,
  necklace: premiumNecklace,
  pendant: premiumPendant,
  bracelet: premiumBracelet,
  bangle: catBangle,
  anklet: newAnklets,
  chain: catSilverchains,
  set: catSets,
  mangalsutra: catMangalsutra,
  nosepin: catNosepin,
  toering: catToerings,

  // Metals & Specialities
  gold: goldPendantsGreen,
  silver: catSilverchains,
  bridal: bridalAsset,

  // Category fallbacks
  category: catAllPremium,
  category_ring: catRings,
  category_earring: catEarrings,
  category_pendant: catPendants,
  category_necklace: premiumNecklace,
  category_bracelet: catBracelets,
  category_bangle: catBangle,
  category_set: catSets,
  category_mangalsutra: catMangalsutra,
  category_chain: catSilverchains,
  category_anklet: catAnklets,
  category_toering: catToerings,
  category_nosepin: catNosepin,
  category_men: catMensilver,
  recipient_men: catMenPremium,
  recipient_women: catWomenPremium,

  // Gold Category specific
  gold_ring: goldRingsGreen,
  gold_earring: goldEarringsGreen,
  gold_pendant: goldPendantsGreen,
  gold_bracelet: goldBraceletsGreen,
  gold_bangle: goldBanglesGreen,
  gold_mangalsutra: goldMangalsutraGreen,
  gold_set: goldSetsGreen,
  gold_nosepin: goldNosepinsGreen,

  // Editorial & Content
  editorial: trendingModern,
  default: premiumPendant
};

/**
 * Determine the most relevant product fallback based on product properties
 * @param {Object|string} product - The product object or product name
 * @param {string} [category] - Optional category override
 * @returns {string} Image path / URL
 */
export const getProductFallback = (product = {}, category = '') => {
  const prodName = typeof product === 'string' ? product : (product?.name || '');
  const catName = typeof category === 'string' && category
    ? category
    : (typeof product?.category === 'object' ? product.category?.name : (product?.category || ''));
  const tags = Array.isArray(product?.tags) ? product.tags.join(' ') : '';
  const searchStr = `${prodName} ${catName} ${tags}`.toLowerCase();

  if (searchStr.includes('ring') && !searchStr.includes('earring') && !searchStr.includes('toe')) {
    return IMAGE_FALLBACKS.ring;
  }
  if (searchStr.includes('earring') || searchStr.includes('stud') || searchStr.includes('jhumk') || searchStr.includes('bali')) {
    return IMAGE_FALLBACKS.earring;
  }
  if (searchStr.includes('necklace') || searchStr.includes('choker') || searchStr.includes('mala')) {
    return IMAGE_FALLBACKS.necklace;
  }
  if (searchStr.includes('mangalsutra') || searchStr.includes('tanmaniya')) {
    return IMAGE_FALLBACKS.mangalsutra;
  }
  if (searchStr.includes('bangle') || searchStr.includes('kada')) {
    return IMAGE_FALLBACKS.bangle;
  }
  if (searchStr.includes('bracelet')) {
    return IMAGE_FALLBACKS.bracelet;
  }
  if (searchStr.includes('anklet') || searchStr.includes('payal')) {
    return IMAGE_FALLBACKS.anklet;
  }
  if (searchStr.includes('toe') || searchStr.includes('bichhiya')) {
    return IMAGE_FALLBACKS.toering;
  }
  if (searchStr.includes('nose') || searchStr.includes('nath')) {
    return IMAGE_FALLBACKS.nosepin;
  }
  if (searchStr.includes('chain')) {
    return IMAGE_FALLBACKS.chain;
  }
  if (searchStr.includes('pendant') || searchStr.includes('locket')) {
    return IMAGE_FALLBACKS.pendant;
  }
  if (searchStr.includes('set') || searchStr.includes('combo')) {
    return IMAGE_FALLBACKS.set;
  }
  if (searchStr.includes('gold')) {
    return IMAGE_FALLBACKS.gold;
  }
  if (searchStr.includes('bridal') || searchStr.includes('wedding')) {
    return IMAGE_FALLBACKS.bridal;
  }

  return IMAGE_FALLBACKS.product;
};

/**
 * Determine semantic category artwork based on category name or slug
 * @param {Object|string} category - Category object or name string
 * @returns {string} Image path / URL
 */
export const getCategoryFallback = (category = '') => {
  const catName = typeof category === 'object'
    ? (category?.name || category?.label || category?.slug || '')
    : String(category || '');
  const searchStr = catName.toLowerCase().trim();

  // Gold variants
  if (searchStr.includes('gold')) {
    if (searchStr.includes('ring')) return IMAGE_FALLBACKS.gold_ring;
    if (searchStr.includes('earring')) return IMAGE_FALLBACKS.gold_earring;
    if (searchStr.includes('pendant') || searchStr.includes('necklace')) return IMAGE_FALLBACKS.gold_pendant;
    if (searchStr.includes('bracelet')) return IMAGE_FALLBACKS.gold_bracelet;
    if (searchStr.includes('bangle')) return IMAGE_FALLBACKS.gold_bangle;
    if (searchStr.includes('mangalsutra')) return IMAGE_FALLBACKS.gold_mangalsutra;
    if (searchStr.includes('set')) return IMAGE_FALLBACKS.gold_set;
    if (searchStr.includes('nose')) return IMAGE_FALLBACKS.gold_nosepin;
    return IMAGE_FALLBACKS.gold;
  }

  // Silver / General categories
  if (searchStr.includes('ring') && !searchStr.includes('earring') && !searchStr.includes('toe')) {
    return IMAGE_FALLBACKS.category_ring;
  }
  if (searchStr.includes('earring') || searchStr.includes('stud') || searchStr.includes('jhumk')) {
    return IMAGE_FALLBACKS.category_earring;
  }
  if (searchStr.includes('necklace') || searchStr.includes('choker')) {
    return IMAGE_FALLBACKS.category_necklace;
  }
  if (searchStr.includes('pendant') || searchStr.includes('locket')) {
    return IMAGE_FALLBACKS.category_pendant;
  }
  if (searchStr.includes('bangle') || searchStr.includes('kada')) {
    return IMAGE_FALLBACKS.category_bangle;
  }
  if (searchStr.includes('bracelet')) {
    return IMAGE_FALLBACKS.category_bracelet;
  }
  if (searchStr.includes('chain')) {
    return IMAGE_FALLBACKS.category_chain;
  }
  if (searchStr.includes('mangalsutra')) {
    return IMAGE_FALLBACKS.category_mangalsutra;
  }
  if (searchStr.includes('anklet') || searchStr.includes('payal')) {
    return IMAGE_FALLBACKS.category_anklet;
  }
  if (searchStr.includes('toe')) {
    return IMAGE_FALLBACKS.category_toering;
  }
  if (searchStr.includes('nose')) {
    return IMAGE_FALLBACKS.category_nosepin;
  }
  if (searchStr.includes('set') || searchStr.includes('combo')) {
    return IMAGE_FALLBACKS.category_set;
  }
  if (searchStr.includes('men')) {
    return IMAGE_FALLBACKS.category_men;
  }
  if (searchStr.includes('bridal') || searchStr.includes('wedding')) {
    return IMAGE_FALLBACKS.bridal;
  }

  return IMAGE_FALLBACKS.category;
};

/**
 * Robust image error handler that prevents infinite error loops
 * @param {Event} event - Image onError event
 * @param {string} fallbackSrc - Destination fallback image
 */
export const handleImageError = (event, fallbackSrc = IMAGE_FALLBACKS.default) => {
  if (!event || !event.currentTarget) return;
  const target = event.currentTarget;
  if (target.dataset?.fallbackApplied === 'true') {
    // Already fell back once; do not loop infinitely
    return;
  }
  target.dataset.fallbackApplied = 'true';
  target.onerror = null; // Detach error listener to prevent re-triggering
  target.src = fallbackSrc || IMAGE_FALLBACKS.default;
};

export default IMAGE_FALLBACKS;
