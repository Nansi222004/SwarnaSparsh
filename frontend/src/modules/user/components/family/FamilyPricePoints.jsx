import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { resolveLegacyCmsAsset } from '../../utils/legacyCmsAssets';

import card2999 from '@assets/family_price_2999_clean.jpg';
import cardPremium from '@assets/family_price_premium_clean.jpg';
import card4999 from '@assets/family_price_4999_clean.jpg';

const fallbackPricePoints = [
    {
        id: 'under-2999',
        title: 'Under Rs 2999',
        caption: 'Keepsake rings and petite gifting picks.',
        image: card2999,
        priceMax: 2999,
        link: '/shop?source=family&filter=family&price_max=2999',
        accent: 'Rose Pick',
        ctaLabel: 'Explore Edit',
        delay: 0.05
    },
    {
        id: 'premium-gifts',
        title: 'Premium Gifts',
        caption: 'Layered necklaces and heirloom-style favourites.',
        image: cardPremium,
        priceMax: 3999,
        link: '/shop?source=family&filter=family&price_max=3999',
        accent: 'Most Loved',
        ctaLabel: 'Explore Edit',
        featured: true,
        delay: 0.15
    },
    {
        id: 'under-4999',
        title: 'Under Rs 4999',
        caption: 'Statement bracelets for elegant family moments.',
        image: card4999,
        priceMax: 4999,
        link: '/shop?source=family&filter=family&price_max=4999',
        accent: 'Easy Upgrade',
        ctaLabel: 'Explore Edit',
        delay: 0.25
    }
];

const parsePriceValue = (value) => {
    if (value === undefined || value === null) return null;
    const cleaned = String(value).replace(/[^0-9]/g, '');
    if (!cleaned) return null;
    const numeric = Number(cleaned);
    return Number.isFinite(numeric) ? numeric : null;
};

const getPriceMaxFromItem = (item) => {
    if (!item) return null;
    const direct = parsePriceValue(item.priceMax ?? item.price);
    if (direct) return direct;
    const path = String(item.path || '');
    if (path.includes('price_max=')) {
        const queryValue = path.split('price_max=')[1]?.split('&')[0];
        return parsePriceValue(queryValue);
    }
    return null;
};

const formatPriceTitle = (priceMax) => `Under Rs ${priceMax}`;

const buildFamilyPricePath = (priceMax) => (
    priceMax ? `/shop?source=family&filter=family&price_max=${priceMax}` : '/shop?source=family&filter=family'
);

const FamilyPricePoints = ({ sectionData }) => {
    const sectionTitle = String(sectionData?.settings?.title || 'Family Gift Picks').trim() || 'Family Gift Picks';
    const sectionAccent = String(sectionData?.settings?.eyebrow || 'Luxury Within Reach').trim() || 'Luxury Within Reach';
    const points = useMemo(() => {
        const configuredItems = Array.isArray(sectionData?.items) ? sectionData.items : [];
        const normalized = configuredItems
            .map((item, index) => {
                const fallback = fallbackPricePoints[index % fallbackPricePoints.length];
                const priceMax = getPriceMaxFromItem(item) || fallback.priceMax;
                return {
                    id: item.itemId || item.id || `family-price-${index + 1}`,
                    title: String(item.name || item.label || (priceMax ? formatPriceTitle(priceMax) : fallback.title)).trim() || fallback.title,
                    caption: String(item.subtitle || item.description || fallback.caption).trim() || fallback.caption,
                    image: resolveLegacyCmsAsset(item.image, fallback.image),
                    priceMax,
                    link: item.path || buildFamilyPricePath(priceMax),
                    accent: String(item.tag || fallback.accent).trim() || fallback.accent,
                    ctaLabel: String(item.ctaLabel || fallback.ctaLabel).trim() || fallback.ctaLabel,
                    delay: fallback.delay
                };
            })
            .filter((item) => Boolean(item.title) && Boolean(item.caption) && Boolean(item.image) && Boolean(item.link));

        return normalized.length > 0 ? normalized : fallbackPricePoints;
    }, [sectionData]);

    return (
        <section className="bg-white py-4 md:py-8">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="text-center mb-6">
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#C59B27]">
                        {sectionAccent}
                    </span>
                    <h2 className="mt-1 font-serif text-2xl text-[#141211]">
                        {sectionTitle}
                    </h2>
                </div>

                <div className="flex flex-row overflow-x-auto gap-3 md:gap-6 px-4 md:px-0 pb-6 md:pb-0 no-scrollbar snap-x snap-mandatory">
                    {points.map((point) => (
                        <motion.div
                            key={point.id}
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: point.delay }}
                            className="min-w-[160px] w-[160px] md:min-w-0 md:flex-1 snap-center group"
                        >
                            <Link
                                to={point.link}
                                className="block relative overflow-hidden rounded-2xl md:rounded-[32px] border border-[#E8DFD0] bg-white hover:shadow-2xl hover:shadow-[#C59B27]/10 hover:border-[#C59B27]/40 transition-all duration-500"
                            >
                                <div className="aspect-square relative overflow-hidden">
                                    <img
                                        src={point.image}
                                        alt={point.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 md:group-hover:opacity-100 transition-opacity duration-300" />
                                </div>

                                <div className="p-3 md:p-6 text-center">
                                    <h3 className="font-serif text-[13px] md:text-xl text-[#141211] group-hover:text-[#C59B27] transition-colors tracking-tight font-medium">
                                        {point.title}
                                    </h3>
                                    <p className="hidden md:block mt-1.5 text-[11px] text-stone-500 font-medium leading-relaxed">
                                        {point.caption}
                                    </p>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FamilyPricePoints;

