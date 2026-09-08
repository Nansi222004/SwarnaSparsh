/**
 * Cloudinary Image Optimization Utility
 *
 * Automatically inserts q_auto,f_auto,w_{width} transformations into
 * Cloudinary URLs to serve correctly-sized, format-optimized images.
 *
 * - q_auto  → picks the best quality (Cloudinary decides, usually 70-85 for web)
 * - f_auto  → serves WebP on modern browsers, AVIF where supported, falls back to JPEG/PNG
 * - w_{n}   → resizes to the target display width (1px = 1CSS pixel, not device px)
 *
 * Non-Cloudinary URLs (local assets, data URIs, blob URLs) are returned unchanged.
 */

/**
 * @param {string} url - The original image URL
 * @param {object} [options]
 * @param {number} [options.width=600]        - Target display width in CSS pixels
 * @param {string} [options.quality='auto']   - Cloudinary quality setting
 * @param {string} [options.format='auto']    - Cloudinary format setting
 * @param {string} [options.fit]              - Optional: 'fill', 'cover', 'contain', 'scale'
 * @returns {string} Optimized URL or original if not Cloudinary
 */
export function getOptimizedImageUrl(url, options = {}) {
  if (!url || typeof url !== 'string') return url || '';

  // Only transform Cloudinary URLs
  if (!url.includes('res.cloudinary.com')) return url;

  // Don't double-apply — if transformations already exist, return as-is
  if (url.includes('/q_auto') || url.includes('/f_auto') || url.includes('/w_')) return url;

  const {
    width = 600,
    quality = 'auto',
    format = 'auto',
    fit,
  } = options;

  // Build transformation string
  const transforms = [`q_${quality}`, `f_${format}`, `w_${width}`];
  if (fit) transforms.push(`c_${fit}`);
  const transformStr = transforms.join(',');

  // Insert before /upload/ path segment
  return url.replace('/upload/', `/upload/${transformStr}/`);
}

/**
 * Convenience presets for common use cases
 */

/** Product card thumbnail — mobile: shown at ~160px, desktop: ~230px */
export const getProductCardUrl = (url) =>
  getOptimizedImageUrl(url, { width: 400, quality: 'auto', format: 'auto' });

/** Product detail primary image — shown at ~400px mobile, ~600px desktop */
export const getProductDetailUrl = (url) =>
  getOptimizedImageUrl(url, { width: 800, quality: 'auto', format: 'auto' });

/** Product thumbnail / gallery icon — shown at ~64px */
export const getProductThumbUrl = (url) =>
  getOptimizedImageUrl(url, { width: 128, quality: 'auto', format: 'auto' });

/** Hero banner image — full width on mobile (~390px), desktop up to 1440px */
export const getHeroImageUrl = (url) =>
  getOptimizedImageUrl(url, { width: 1200, quality: 'auto', format: 'auto' });

/** Search result thumbnail — shown at ~48px */
export const getSearchThumbUrl = (url) =>
  getOptimizedImageUrl(url, { width: 96, quality: 'auto', format: 'auto' });
