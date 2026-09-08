import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useShop } from '../../../context/ShopContext';
import ProductCard from './ProductCard';

const parsePositiveNumber = (value, fallback = 4) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const normalizeToken = (value = '') => String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');

const normalizeIdValue = (value) => {
    if (!value) return '';
    if (typeof value === 'string') return value.trim();
    if (typeof value === 'object') return String(value._id || value.id || '').trim();
    return String(value).trim();
};

const normalizeCategoryCandidates = (value) => {
    if (!value) return [];
    if (typeof value === 'string') return [value];
    if (typeof value === 'object') {
        return [
            value._id,
            value.id,
            value.slug,
            value.name,
            value.categoryId,
            value.category
        ].filter(Boolean);
    }
    return [String(value)];
};

const parseCategoryFromPath = (path = '') => {
    const source = String(path || '');
    if (!source.includes('category=')) return '';
    const raw = source.split('category=')[1]?.split('&')[0] || '';
    try {
        return decodeURIComponent(raw).trim();
    } catch {
        return raw.trim();
    }
};

const isGoldProduct = (product = {}) => {
    const metalBlob = [
        product?.metal,
        product?.material,
        product?.goldCategory
    ].map((value) => String(value || '').trim().toLowerCase()).join(' ');
    return metalBlob.includes('gold');
};

const matchesCategory = (product = {}, categoryId = '') => {
    const target = normalizeToken(categoryId);
    if (!target) return true;

    const navCategoryTokens = Array.isArray(product.navShopByCategory)
        ? product.navShopByCategory
            .flatMap((entry) => normalizeCategoryCandidates(entry))
            .map((entry) => normalizeToken(entry))
            .filter(Boolean)
        : [];

    const tokens = new Set([
        normalizeToken(product.categoryId),
        normalizeToken(product.category),
        normalizeToken(product.categorySlug),
        ...navCategoryTokens
    ].filter(Boolean));
    return tokens.has(target);
};

const GoldDirectProducts = ({ sectionData = null }) => {
    const { products } = useShop();

    const resolvedSettings = useMemo(() => {
        const settings = sectionData?.settings || {};
        const sourceMode = settings.sourceMode === 'manual' ? 'manual' : 'category';
        const categoryFromPath = parseCategoryFromPath(sectionData?.items?.[0]?.path);

        return {
            title: String(settings.title || sectionData?.label || 'All Jewellery').trim() || 'All Jewellery',
            eyebrow: String(settings.eyebrow || 'Our Collection').trim() || 'Our Collection',
            productLimit: parsePositiveNumber(settings.productLimit, 4),
            sourceMode,
            categoryId: String(settings.categoryId || categoryFromPath || '').trim()
        };
    }, [sectionData]);

    const displayProducts = useMemo(() => {
        const allProducts = Array.isArray(products) ? products : [];
        const goldProducts = allProducts.filter((p) => isGoldProduct(p));

        if (resolvedSettings.sourceMode === 'manual') {
            const pinnedIds = (Array.isArray(sectionData?.items) ? sectionData.items : [])
                .flatMap((item) => {
                    const ids = [];
                    const primary = normalizeIdValue(item?.productId);
                    if (primary) ids.push(primary);
                    if (Array.isArray(item?.productIds)) {
                        ids.push(...item.productIds.map((id) => normalizeIdValue(id)).filter(Boolean));
                    }
                    return ids;
                })
                .filter(Boolean);

            const pinnedMap = new Map(allProducts.map((product) => [String(product.id || product._id), product]));
            const manualProducts = pinnedIds
                .map((id) => pinnedMap.get(String(id)))
                .filter((product) => Boolean(product) && isGoldProduct(product))
                .slice(0, resolvedSettings.productLimit);

            if (manualProducts.length > 0) return manualProducts;
        }

        const filtered = resolvedSettings.categoryId
            ? goldProducts.filter((product) => matchesCategory(product, resolvedSettings.categoryId))
            : goldProducts;

        if (filtered.length > 0) {
            return filtered.slice(0, resolvedSettings.productLimit);
        }

        return [];
    }, [products, sectionData, resolvedSettings]);

    if (displayProducts.length === 0) return null;

    return (
        <section className="w-full py-12 bg-white">
            <div className="max-w-[1450px] mx-auto px-6">
                <div className="mb-10">
                    <p className="text-[#B58E3E] text-sm font-bold uppercase tracking-[0.3em] mb-1">
                        {resolvedSettings.eyebrow}
                    </p>
                    <h2 className="text-4xl md:text-5xl font-serif text-[#702931] leading-tight">
                        {resolvedSettings.title}
                    </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                    {displayProducts.map((product, idx) => (
                        <motion.div
                            key={product.id || product._id}
                            initial={{ opacity: 0, y: 15 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                        >
                            <ProductCard product={product} />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default GoldDirectProducts;
