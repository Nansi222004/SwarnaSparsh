import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { buildWomenShopPath } from '../../utils/womenNavigation';

const defaultPriceRanges = [
    { id: 'under-1299', priceMax: 1299, tagline: 'EVERYDAY ESSENTIALS' },
    { id: 'under-1499', priceMax: 1499, tagline: 'ELEGANT CHARMS' },
    { id: 'under-1999', priceMax: 1999, tagline: 'LUXURY STATEMENTS' }
];
const RUPEE = '\u20B9';

const parsePriceValue = (value) => {
    if (value === undefined || value === null) return null;
    const cleaned = String(value).replace(/[^0-9]/g, '');
    if (!cleaned) return null;
    const numeric = Number(cleaned);
    return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
};

const getPriceFromItem = (item) => {
    if (!item) return null;
    if (item.priceMax !== undefined && item.priceMax !== null && item.priceMax !== '') {
        return parsePriceValue(item.priceMax);
    }
    if (item.price !== undefined && item.price !== null && item.price !== '') {
        return parsePriceValue(item.price);
    }
    if (item.path && String(item.path).includes('price_max=')) {
        const query = String(item.path).split('price_max=')[1]?.split('&')[0];
        return parsePriceValue(query);
    }
    if (item.name || item.label) {
        return parsePriceValue(item.name || item.label);
    }
    return null;
};

const WomenPriceRange = ({ sectionData }) => {
    const priceRanges = useMemo(() => {
        const configuredItems = Array.isArray(sectionData?.items) ? sectionData.items : [];
        const normalized = configuredItems
            .map((item, index) => {
                const priceMax = getPriceFromItem(item);
                if (!priceMax) return null;
                return {
                    id: item.itemId || item.id || `women-price-${index + 1}`,
                    label: 'Under',
                    price: `${RUPEE}${priceMax}`,
                    priceMax,
                    path: buildWomenShopPath({ filter: 'womens', priceMax }),
                    tagline: item.tag || defaultPriceRanges[index]?.tagline || 'CURATED PICKS'
                };
            })
            .filter(Boolean);

        if (normalized.length > 0) return normalized;

        return defaultPriceRanges.map((item) => ({
            ...item,
            label: 'Under',
            price: `${RUPEE}${item.priceMax}`,
            path: buildWomenShopPath({ filter: 'womens', priceMax: item.priceMax })
        }));
    }, [sectionData]);

    return (
        <section className="pt-2 pb-2 md:pt-12 md:pb-8 bg-white overflow-hidden">
            <div className="container mx-auto px-4 md:px-8 max-w-[1300px]">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    className="flex flex-col items-center mb-2.5 md:mb-5"
                >
                    <span
                        className="text-[10px] md:text-[11px] font-bold tracking-[0.25em] uppercase mb-1 inline-block px-3 py-0.5 md:py-1 rounded-full bg-[#C59B27]/10"
                        style={{ color: '#C59B27' }}
                    >
                        Luxury within Reach
                    </span>
                    <h2 className="text-[13px] md:text-[28px] font-display text-gray-900 tracking-tight">
                        {sectionData?.label || 'Curated Price Points'}
                    </h2>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[0.84fr_1.16fr_0.84fr] gap-2 md:gap-4 items-end">
                    {priceRanges.map((item, idx) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: idx * 0.15, ease: [0.22, 1, 0.36, 1] }}
                            className={`w-full ${idx === 1 ? '' : 'md:pb-5'}`}
                        >
                            <Link to={item.path} className="group relative block w-full outline-none">
                                <div
                                    className="relative flex flex-col items-center justify-center text-center overflow-hidden transition-all duration-700 ease-[0.22, 1, 0.36, 1] group-hover:shadow-[0_45px_100px_-20px_rgba(0,0,0,0.5)]"
                                    style={{
                                        background: 'linear-gradient(135deg, #1C1917 0%, #141211 50%, #0A0908 100%)',
                                        borderRadius: '16px',
                                        padding: idx === 1 ? 'clamp(12px, 3.8vw, 40px) 18px' : 'clamp(10px, 3.1vw, 30px) 14px',
                                        minHeight: idx === 1 ? 'clamp(72px, 16vw, 170px)' : 'clamp(60px, 12.5vw, 132px)',
                                        border: '1px solid rgba(197, 155, 39, 0.2)'
                                    }}
                                >
                                    <div
                                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none"
                                        style={{
                                            background: 'linear-gradient(45deg, transparent 0%, rgba(255,255,255,0.08) 45%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.08) 55%, transparent 100%)',
                                            transform: 'translateX(-100%) translateY(-100%)',
                                            animation: 'shine 4s infinite linear'
                                        }}
                                    />

                                    <div
                                        className="absolute inset-x-0 top-0 h-28 md:h-40 opacity-0 group-hover:opacity-30 transition-opacity duration-700 pointer-events-none"
                                        style={{
                                            background: 'radial-gradient(circle at 50% 0%, #C59B27 0%, transparent 70%)'
                                        }}
                                    />

                                    <div className="relative z-10 transition-transform duration-500 group-hover:-translate-y-2">
                                        <p
                                            className="text-white/60 font-semibold tracking-[0.22em] uppercase mb-1.5 md:mb-2"
                                            style={{ fontSize: idx === 1 ? 'clamp(9px, 1vw, 12px)' : 'clamp(8px, 0.85vw, 10px)' }}
                                        >
                                            {item.label}
                                        </p>

                                        <h3
                                            className="text-white font-bold leading-none"
                                            style={{
                                                fontSize: idx === 1 ? 'clamp(24px, 4.2vw, 48px)' : 'clamp(20px, 3.2vw, 36px)',
                                                fontFamily: "'Playfair Display', serif",
                                                fontWeight: 800,
                                                letterSpacing: '-1px',
                                                textShadow: '0 4px 15px rgba(0,0,0,0.4)'
                                            }}
                                        >
                                            {item.price}
                                        </h3>

                                        <div className="h-0 group-hover:h-6 overflow-hidden transition-all duration-500 opacity-0 group-hover:opacity-100 mt-1.5 md:mt-2">
                                            <p
                                                className="text-[#E8D198] font-bold tracking-[0.15em] whitespace-nowrap"
                                                style={{ fontSize: idx === 1 ? 'clamp(8px, 1vw, 10px)' : 'clamp(7px, 0.85vw, 9px)' }}
                                            >
                                                {item.tagline}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="absolute inset-0 rounded-[16px] pointer-events-none border border-white/0 group-hover:border-white/10 transition-all duration-500" />
                                    <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#C59B27] to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700 w-0 group-hover:w-full mx-auto" />
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes shine {
                    0% { transform: translateX(-150%) translateY(-150%) rotate(45deg); }
                    20% { transform: translateX(150%) translateY(150%) rotate(45deg); }
                    100% { transform: translateX(150%) translateY(150%) rotate(45deg); }
                }`
            }}
            />
        </section>
    );
};

export default WomenPriceRange;
