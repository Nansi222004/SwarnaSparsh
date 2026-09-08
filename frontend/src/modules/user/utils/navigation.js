const EXACT_ALLOWED_ROUTES = new Set([
  '/',
  '/shop',
  '/cart',
  '/checkout',
  '/wishlist',
  '/login',
  '/signup',
  '/notifications',
  '/about',
  '/help',
  '/terms',
  '/privacy',
  '/shipping-policy',
  '/cancellation-policy',
  '/return-policy',
  '/care-guide',
  '/warranty-info',
  '/craft',
  '/customization',
  '/new-arrivals',
  '/trending',
  '/blogs',
  '/gold-collection',
]);

const PREFIX_ALLOWED_ROUTES = [
  '/product/',
  '/category/',
  '/page/',
  '/profile/',
  '/order-tracking/',
];

const ROUTE_ALIASES = {
  '/returns': '/return-policy',
  '/contact': '/help',
};

export const normalizeStoreLink = (link) => {
  if (typeof link !== 'string') return '/shop';

  const value = ROUTE_ALIASES[link.trim()] || link.trim();
  if (!value.startsWith('/')) return '/shop';
  if (EXACT_ALLOWED_ROUTES.has(value)) return value;
  if (PREFIX_ALLOWED_ROUTES.some((prefix) => value.startsWith(prefix))) return value;

  return '/shop';
};

export const normalizeFooterLink = (link) => normalizeStoreLink(link);

export const normalizeExternalLink = (link) => {
  if (typeof link !== 'string') return '#';

  const value = link.trim();
  if (!value) return '#';

  try {
    const parsed = new URL(value);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return value;
    }
  } catch {
    return '#';
  }

  return '#';
};
