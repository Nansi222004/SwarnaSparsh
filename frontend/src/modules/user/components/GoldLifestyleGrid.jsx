import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { resolveLegacyCmsAsset } from '../utils/legacyCmsAssets';

import casualImg from '@assets/gold_lifestyle/gold_casual_wear.jpg';
import partyImg from '@assets/gold_lifestyle/gold_party_wear.png';
import giftCardImg from '@assets/gold_lifestyle/gold_gift_card.png';
import traditionalImg from '@assets/gold_lifestyle/gold_traditional.png';
import minimalisticImg from '@assets/gold_lifestyle/gold_minimalistic.png';
import twinningImg from '@assets/gold_lifestyle/gold_twinning.png';
import dateNightImg from '@assets/gold_lifestyle/gold_date_nights.png';
import bridesmaidImg from '@assets/gold_lifestyle/gold_bridesmaid.jpg';

const fallbackItems = [
    {
        id: 'gold-cat-1',
        title: 'Casual Wear',
        subtitle: 'Everyday elegance',
        image: casualImg,
        path: '/shop?search=casual&metal=gold'
    },
    {
        id: 'gold-cat-2',
        title: 'Party Wear',
        subtitle: 'Shine at every celebration',
        image: partyImg,
        path: '/shop?search=party&metal=gold'
    },
    {
        id: 'gold-cat-3',
        title: 'Gold Gift Card',
        subtitle: 'A gift that lasts forever',
        image: giftCardImg,
        path: '/help'
    },
    {
        id: 'gold-cat-4',
        title: 'Traditional',
        subtitle: 'Timeless heritage',
        image: traditionalImg,
        path: '/shop?search=traditional&metal=gold'
    },
    {
        id: 'gold-cat-5',
        title: 'Minimalistic',
        subtitle: 'Quiet luxury',
        image: minimalisticImg,
        path: '/shop?search=minimalistic&metal=gold'
    },
    {
        id: 'gold-cat-6',
        title: 'Twinning',
        subtitle: 'Shared style & bond',
        image: twinningImg,
        path: '/shop?search=twinning&metal=gold'
    },
    {
        id: 'gold-cat-7',
        title: 'Date Nights',
        subtitle: 'Elegant romance',
        image: dateNightImg,
        path: '/shop?search=date-night&metal=gold'
    },
    {
        id: 'gold-cat-8',
        title: 'Gifts for Bridesmaid',
        subtitle: 'Thoughtful luxury gifting',
        image: bridesmaidImg,
        path: '/shop?search=bridesmaid&metal=gold'
    }
];

const ensureGoldCategoryPath = (path, categoryId = '') => {
    const normalizedCategory = String(categoryId || '').trim();
    const source = String(path || '').trim();
    if (!source || !source.startsWith('/shop')) {
        return source || '/shop?metal=gold';
    }
    const queryString = source.startsWith('/shop') && source.includes('?') ? source.split('?')[1] : '';
    const params = new URLSearchParams(queryString);
    params.set('metal', 'gold');
    if (normalizedCategory) params.set('category', normalizedCategory);
    const query = params.toString();
    return `/shop${query ? `?${query}` : '?metal=gold'}`;
};

const GoldLifestyleGrid = ({ sectionData = null }) => {
    const navigate = useNavigate();

    const title = sectionData?.settings?.title || sectionData?.label || "Gold Collection";
    const eyebrow = sectionData?.settings?.eyebrow || "EXPLORE OUR";
    const subtitle = sectionData?.settings?.subtitle || "For every moment that matters";
    const viewAllPath = sectionData?.settings?.viewAllLink || sectionData?.settings?.viewAllPath || "/shop?metal=gold";

    const items = useMemo(() => {
        const configured = Array.isArray(sectionData?.items) ? sectionData.items : [];
        if (configured.length === 0) return fallbackItems;

        return fallbackItems.map((fallback, idx) => {
            const item = configured[idx] || {};
            return {
                id: item?.itemId || item?.id || fallback.id,
                title: item?.name || item?.label || fallback.title,
                subtitle: item?.subtitle || item?.description || fallback.subtitle,
                image: resolveLegacyCmsAsset(item?.image, fallback.image),
                path: ensureGoldCategoryPath(item?.path || fallback.path, item?.categoryId)
            };
        });
    }, [sectionData]);

    return (
        <section className="w-full py-10 md:py-16 bg-white">
            <div className="container mx-auto px-4 md:px-6 max-w-[1450px]">
                {/* Section Header */}
                <div className="text-center mb-8 md:mb-12 relative">
                    <span className="text-[10.5px] md:text-xs font-bold uppercase tracking-[0.3em] text-[#C59B27] block mb-2">
                        {eyebrow}
                    </span>
                    <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#2F0A0F] font-normal tracking-tight mb-3">
                        {title}
                    </h2>
                    <div className="h-[2px] w-14 md:w-20 bg-[#C59B27] mx-auto rounded-full mb-3" />
                    <p className="font-serif italic text-stone-600 text-sm sm:text-base md:text-lg max-w-lg mx-auto">
                        {subtitle}
                    </p>

                    {/* View All link if present */}
                    {viewAllPath && (
                        <div className="mt-3 md:absolute md:right-0 md:bottom-2">
                            <Link
                                to={viewAllPath}
                                className="inline-flex items-center gap-1.5 text-xs md:text-sm font-semibold uppercase tracking-[0.18em] text-[#8C6B1C] hover:text-[#C59B27] transition-colors group/viewall"
                            >
                                <span>View All</span>
                                <ChevronRight className="w-4 h-4 transition-transform duration-300 group-hover/viewall:translate-x-1" />
                            </Link>
                        </div>
                    )}
                </div>

                {/* 2-Row Luxury Editorial Grid: Desktop (4 cols x 2 rows), Tablet (2 cols x 4 rows), Mobile (1 col x 8 rows) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
                    {items.map((item) => (
                        <motion.div
                            key={item.id}
                            whileHover={{ y: -4 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            onClick={() => navigate(item.path)}
                            className="group flex flex-col bg-[#FDFBF7] rounded-2xl overflow-hidden border border-[#E8DFD0]/70 hover:border-[#C59B27]/40 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer"
                        >
                            {/* Card Image */}
                            <div className="relative w-full aspect-[4/3] overflow-hidden bg-[#FAF6F0]">
                                <img
                                    src={item.image}
                                    alt={item.title}
                                    loading="lazy"
                                    decoding="async"
                                    className="w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                            </div>

                            {/* Card Info Area */}
                            <div className="p-4 md:p-5 flex items-center justify-between gap-3 bg-[#FCFAF6] group-hover:bg-[#FFFDF9] transition-colors duration-300">
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-serif text-lg md:text-xl text-[#2F0A0F] group-hover:text-[#8C6B1C] transition-colors duration-300 truncate leading-snug">
                                        {item.title}
                                    </h3>
                                    <p className="font-sans text-xs md:text-[13px] text-stone-500 font-light tracking-wide mt-0.5 truncate">
                                        {item.subtitle}
                                    </p>
                                </div>
                                <div className="w-8 h-8 md:w-9 md:h-9 rounded-full border border-[#D4AF37]/30 bg-white group-hover:bg-[#C59B27] flex items-center justify-center shrink-0 shadow-xs transition-all duration-300 group-hover:border-[#C59B27]">
                                    <ArrowRight className="w-3.5 h-3.5 text-[#8C6B1C] group-hover:text-white transition-all duration-300 group-hover:translate-x-0.5" />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default GoldLifestyleGrid;
