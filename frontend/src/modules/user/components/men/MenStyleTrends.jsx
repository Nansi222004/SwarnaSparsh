import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { buildMenShopPath } from '../../utils/menNavigation';
import { resolveLegacyCmsAsset } from '../../utils/legacyCmsAssets';

const fallbackTrends = [
    {
        id: 1,
        number: '1',
        line1: 'Rings',
        line2: 'Stacking',
        image: '/men_style_1.png',
        link: buildMenShopPath({ category: 'rings' })
    },
    {
        id: 2,
        number: '2',
        line1: 'Curated',
        line2: 'Combos',
        image: '/men_style_2.png',
        link: buildMenShopPath({ category: 'sets' })
    },
    {
        id: 3,
        number: '3',
        line1: 'Chain',
        line2: 'Layering',
        image: '/men_style_3.png',
        link: buildMenShopPath({ category: 'chains' })
    },
    {
        id: 4,
        number: '4',
        line1: 'Spiritual',
        line2: 'Picks',
        image: '/men_style_4.png',
        link: buildMenShopPath({ search: 'spiritual' })
    }
];

const splitLabelToLines = (label = '') => {
    const clean = String(label || '').trim();
    if (!clean) return { line1: '', line2: '' };
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return { line1: parts[0], line2: 'Style' };
    return {
        line1: parts[0],
        line2: parts.slice(1).join(' ')
    };
};

const ensureMinimumVisibleCards = (resolved, minCount = 4) => {
    if (!Array.isArray(resolved)) return resolved;
    if (resolved.length >= minCount) return resolved.slice(0, minCount);

    const merged = [...resolved];
    for (let i = 0; i < fallbackTrends.length && merged.length < minCount; i += 1) {
        const fallback = fallbackTrends[i];
        merged.push({
            ...fallback,
            id: `${fallback.id}-fallback-${merged.length + 1}`,
            number: String(merged.length + 1)
        });
    }
    return merged;
};

const MenStyleTrends = ({ sectionData }) => {

    const resolvedTrends = useMemo(() => {
        const configuredItems = Array.isArray(sectionData?.items) ? sectionData.items : [];
        const normalized = configuredItems
            .filter((item) => item?.image)
            .map((item, index) => {
                const fallback = fallbackTrends[index];
                const fromName = splitLabelToLines(item.name || item.label || '');
                return {
                    id: item.itemId || item.id || `men-style-trend-${index}`,
                    number: String(index + 1),
                    line1: item.line1 || fromName.line1 || fallback?.line1 || '',
                    line2: item.line2 || fromName.line2 || fallback?.line2 || '',
                    image: resolveLegacyCmsAsset(item.image, fallback?.image || ''),
                    link: item.categoryId
                        ? buildMenShopPath({ category: item.categoryId })
                        : (item.path || fallback?.link || buildMenShopPath())
                };
            })
            .filter((item) => item.line1 && item.line2 && item.image && item.link);

        if (normalized.length === 0) return fallbackTrends.slice(0, 4);
        return ensureMinimumVisibleCards(normalized, 4);
    }, [sectionData]);

    return (
        <section className="relative py-4 md:py-10 bg-[#C9BAA8]">
            <div className="container mx-auto px-4 md:px-10 max-w-[1300px]">
                <div className="flex gap-3 md:gap-6 justify-start md:justify-center items-stretch overflow-x-auto scrollbar-hide pb-6 md:pb-8 px-2 md:px-0">
                    {resolvedTrends.map((trend, idx) => (
                        <motion.div
                            key={trend.id}
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.45, delay: idx * 0.08 }}
                            className="flex-shrink-0 group"
                            style={{ width: 'clamp(116px, 28vw, 240px)' }}
                        >
                            <Link to={trend.link} className="block relative">
                                <div
                                    className="relative overflow-hidden rounded-2xl md:rounded-3xl shadow-xl w-full"
                                    style={{ height: 'clamp(148px, 38vw, 380px)', background: '#8B7D6B' }}
                                >
                                    <img
                                        src={trend.image}
                                        alt={`${trend.line1} ${trend.line2}`}
                                        className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                                    />

                                    <div
                                        className="absolute inset-0"
                                        style={{
                                            background:
                                                'linear-gradient(to top, rgba(0,0,0,0.52) 0%, rgba(0,0,0,0.14) 45%, transparent 100%)'
                                        }}
                                    />

                                    <div className="absolute bottom-4 right-4 text-right z-10">
                                        <p
                                            style={{
                                                fontFamily: "'Georgia', 'Times New Roman', serif",
                                                fontSize: 'clamp(9px, 1.5vw, 17px)',
                                                fontWeight: 600,
                                                color: '#fff',
                                                lineHeight: 1.3,
                                                letterSpacing: '0.01em',
                                                textShadow: '0 2px 8px rgba(0,0,0,0.6)'
                                            }}
                                        >
                                            {trend.line1}
                                            <br />
                                            {trend.line2}
                                        </p>
                                    </div>
                                </div>

                                <div
                                    className="absolute left-0 select-none pointer-events-none"
                                    style={{
                                        bottom: '-0.38em',
                                        fontSize: 'clamp(36px, 15vw, 140px)',
                                        fontWeight: 900,
                                        lineHeight: 1,
                                        color: 'rgba(255,255,255,0.85)',
                                        fontFamily: "'Arial Black', 'Helvetica Neue', sans-serif",
                                        letterSpacing: '-0.05em',
                                        zIndex: 20
                                    }}
                                >
                                    {trend.number}
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default MenStyleTrends;
