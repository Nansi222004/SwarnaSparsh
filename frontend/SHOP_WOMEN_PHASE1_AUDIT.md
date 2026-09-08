# Shop for Women - Phase 1 Audit and Contract

## Scope
This document captures the current baseline for `shop-women`, identifies dynamic/static gaps, and defines the production-safe section contract for phased implementation.

## Current Rendered User Sections (in order)
Source: `frontend/src/modules/user/pages/ShopForWomen.jsx`

1. `WomenHeroCarousel`
2. `WomenPriceRange`
3. `WomenProductCategories`
4. `WomenCategoriesGrid`
5. `WomenCuratedCollections`
6. `WomenOccasionCarousel`
7. `WomenPersonalisedBanner`
8. `WomenDiscoverHue`
9. `WomenPromoBanners`
10. `WomenFeatureBanner`
11. `WomenProductsListing`

## Current Admin/CMS Coverage
Source: `frontend/src/modules/admin/utils/sectionDefaults.js`

`shop-women` currently has only 4 defaults:
- `hero-banners`
- `product-categories`
- `promo-banners`
- `products-listing`

This does **not** match the 11 rendered sections on user side.

## Dynamic vs Static Status
- `WomenHeroCarousel`: static/local data
- `WomenPriceRange`: static/local data
- `WomenProductCategories`: static/local data
- `WomenCategoriesGrid`: static/local data
- `WomenCuratedCollections`: static/local data
- `WomenOccasionCarousel`: static/local data
- `WomenPersonalisedBanner`: static/local data
- `WomenDiscoverHue`: static/local data
- `WomenPromoBanners`: static/local data
- `WomenFeatureBanner`: static/local data
- `WomenProductsListing`: static dummy products and mock add-to-cart fallback

Conclusion: `shop-women` is currently mostly static and not yet end-to-end CMS dynamic like `shop-men`.

## Backend Sanitization Coverage
Source: `backend/src/modules/admin/controllers/section.controller.js`

There are dedicated sanitizer branches for `shop-men` sections, but no equivalent dedicated branch set for the full women section surface.

## Unused or Redundant Women Components
Not currently rendered by `ShopForWomen.jsx`:
- `CelebrateWomen.jsx`
- `WomenInteractiveLook.jsx`
- `WomenLatestCollections.jsx`

These should be reviewed in cleanup phase (remove or wire intentionally).

## Production Section Contract for Shop Women
Use this as source-of-truth for defaults + admin routing + backend sanitize + user fetch/render:

1. `hero-banners` (banner)
2. `price-range-showcase` (promo-grid)
3. `product-categories` (category-grid)
4. `categories-grid` (category-grid)  
   Note: trending cards with fixed number badge style
5. `curated-collections` (product-collection)
6. `occasion-carousel` (category-grid)
7. `personalized-banner` (rich-content)
8. `discover-hue` (category-grid)
9. `promo-banners` (promo-grid)
10. `feature-banner` (rich-content)
11. `products-listing` (product-carousel)

## Guardrails (as per constraints)
- Keep UI visual consistency unchanged while moving data source to CMS.
- Avoid free-form risky URL fields for admin; prefer category/typed selectors.
- For fixed-layout sections, lock card counts where needed.
- If any hardcoded image is removed, keep same image available via dynamic upload path.
- Maintain women-only product intent in listing/filter logic.

## Safe Implementation Order (Phase-ready)
1. Hero + Price Range + Product Categories
2. Categories Grid + Curated Collections
3. Occasion Carousel + Personalized Banner
4. Discover Hue + Promo Banners + Feature Banner
5. Products Listing (category/manual source mode, product count, view-all)
6. Cleanup redundant women files and dead static arrays after validation

## Immediate Risks to Watch
- Encoding artifacts in some files (`â‚¹`) should be normalized to `₹`.
- Section key mismatch risk between defaults/admin/user components.
- Existing `SectionEditor` key routing currently has men-specific mappings that must not be reused incorrectly for women.

