import navGiftWomen from '@assets/nav_gift_women.png';
import navGiftGirls from '@assets/nav_gift_girls.png';
import navGiftMens from '@assets/nav_gift_mens.png';
import navGiftCouple from '@assets/nav_gift_couple.png';
import navGiftKids from '@assets/nav_gift_kids.png';

import navOccasionBirthday from '@assets/nav_occasion_birthday.png';
import navOccasionAnniversary from '@assets/nav_occasion_anniversary.png';
import navOccasionWedding from '@assets/nav_occasion_wedding.png';
import navOccasionMothers from '@assets/nav_occasion_mothers.png';
import navOccasionValentine from '@assets/nav_occasion_valentine.png';
import { resolveLegacyCmsAsset } from './legacyCmsAssets';

export const buildSectionSlug = (value = '') => String(value || '')
  .trim()
  .toLowerCase()
  .replace(/['"]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

export const buildHomepageNavPath = (label, key) =>
  `/shop?${key}=${encodeURIComponent(buildSectionSlug(label))}`;

export const ensureHomepageNavPath = (path, label, key) => {
  if (path && String(path).includes(`${key}=`)) return path;
  return buildHomepageNavPath(label, key);
};

export const fallbackGiftImage = (label) => {
  const map = {
    womens: navGiftWomen,
    women: navGiftWomen,
    girls: navGiftGirls,
    mens: navGiftMens,
    men: navGiftMens,
    couple: navGiftCouple,
    kids: navGiftKids
  };
  const key = String(label || '').toLowerCase().replace(/\s+/g, '');
  return map[key] || navGiftWomen;
};

export const fallbackOccasionImage = (label) => {
  const map = {
    birthday: navOccasionBirthday,
    anniversary: navOccasionAnniversary,
    wedding: navOccasionWedding,
    mothersday: navOccasionMothers,
    "mother'sday": navOccasionMothers,
    valentine: navOccasionValentine,
    valentineday: navOccasionValentine
  };
  const key = String(label || '').toLowerCase().replace(/\s+/g, '');
  return map[key] || navOccasionBirthday;
};

export const normalizeHomepageNavItems = (items = [], queryKey, imageResolver) =>
  (items || [])
    .map((item, index) => {
      const label = item?.name || item?.label || '';
      if (!label) return null;
      return {
        id: item.itemId || item.id || item._id || `${queryKey}-${index}`,
        name: label,
        path: ensureHomepageNavPath(item.path, label, queryKey),
        image: resolveLegacyCmsAsset(item.image, imageResolver(label))
      };
    })
    .filter(Boolean);

