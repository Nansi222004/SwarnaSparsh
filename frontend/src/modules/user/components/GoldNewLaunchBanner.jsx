import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { resolveLegacyCmsAsset } from '../utils/legacyCmsAssets';

import ringsImg from '@assets/categories/gold_rings_green.png';
import pendantsImg from '@assets/categories/gold_pendants_green.png';
import earringsImg from '@assets/categories/gold_earrings_green.png';

const fallbackCards = [
    { id: 'rings', name: 'Rings', image: ringsImg, path: '/shop?metal=gold&category=rings', highlight: false },
    { id: 'pendants', name: 'Pendants', image: pendantsImg, path: '/shop?metal=gold&category=necklaces', highlight: true },
    { id: 'earrings', name: 'Earrings', image: earringsImg, path: '/shop?metal=gold&category=earrings', highlight: false }
];

const ensureGoldPath = (rawPath = '', categoryId = '') => {
    const normalizedCategoryId = String(categoryId || '').trim();
    if (normalizedCategoryId) return `/shop?metal=gold&category=${encodeURIComponent(normalizedCategoryId)}`;

    const source = String(rawPath || '').trim();
    if (!source) return '/shop?metal=gold';
    if (!source.startsWith('/shop')) return source;
    if (/([?&])metal=gold(&|$)/i.test(source)) return source;
    return `${source}${source.includes('?') ? '&' : '?'}metal=gold`;
};

const GoldNewLaunchBanner = ({ sectionData = null }) => {
    const navigate = useNavigate();

    const cards = useMemo(() => {
        const configured = Array.isArray(sectionData?.items) ? sectionData.items : [];
        if (configured.length === 0) return fallbackCards;

        return configured.slice(0, 3).map((item, idx) => ({
            id: item?.itemId || item?.id || `gold-new-launch-${idx + 1}`,
            name: item?.name || item?.label || fallbackCards[idx % fallbackCards.length].name,
            image: resolveLegacyCmsAsset(item?.image, fallbackCards[idx % fallbackCards.length].image),
            path: ensureGoldPath(item?.path || fallbackCards[idx % fallbackCards.length].path, item?.categoryId),
            highlight: idx === 1
        }));
    }, [sectionData]);

    const headingPrefix = String(sectionData?.settings?.prefix || '9 KT').trim() || '9 KT';
    const headingSuffix = String(sectionData?.settings?.suffix || 'Gold').trim() || 'Gold';
    const subtitle = String(sectionData?.settings?.subtitle || '& Laboratory diamonds').trim() || '& Laboratory diamonds';
    const ctaLabel = String(sectionData?.settings?.ctaLabel || 'Starts at INR 8000').trim() || 'Starts at INR 8000';
    const ctaPath = String(sectionData?.settings?.ctaPath || '/shop?metal=gold').trim() || '/shop?metal=gold';
    const ribbon = String(sectionData?.settings?.ribbonLabel || sectionData?.label || 'New Launch').trim() || 'New Launch';

    return (
        <section className="w-full py-10">
            <div className="max-w-[1450px] mx-auto px-4">
                <div className="bg-[#0D2015] rounded-[24px] overflow-hidden flex flex-col lg:flex-row relative min-h-[280px] md:min-h-[320px]">
                    <div className="absolute left-0 top-0 h-full w-full pointer-events-none opacity-15">
                        <svg className="w-[300px] h-[300px] absolute -left-16 -top-16 text-[#C9A84C]" viewBox="0 0 100 100" fill="currentColor">
                           <path d="M50 0C40 20 20 40 0 50C20 60 40 80 50 100C60 80 80 60 100 50C80 40 60 20 50 0Z" opacity="0.5"/>
                        </svg>
                    </div>

                    <div className="flex-[1.2] p-6 md:p-10 flex flex-col justify-center relative z-10">
                        <div className="inline-block bg-[#F5ECD7] text-[#0D2015] text-[10px] font-bold px-3 py-1 rounded-full mb-4 shadow-sm w-fit uppercase tracking-widest">
                            {ribbon}
                        </div>

                        <div className="mb-4">
                            <h2 className="text-[#C9A84C] font-black leading-none mb-0 flex items-baseline gap-1">
                                <span className="text-[32px] md:text-[48px]">{headingPrefix}</span>
                                <span className="text-[#C9A84C] text-[32px] md:text-[45px] font-bold ml-2">{headingSuffix}</span>
                            </h2>
                            <p className="text-white text-[14px] md:text-[16px] tracking-wide font-medium">
                                {subtitle}
                            </p>
                        </div>

                        <button
                            onClick={() => navigate(ctaPath)}
                            className="bg-[#F5ECD7] text-[#0D2015] font-black text-[13px] md:text-[15px] px-8 py-2.5 rounded-full w-fit hover:bg-[#C9A84C] hover:text-white transition-all duration-300 shadow-lg transform hover:scale-105 active:scale-95"
                            type="button"
                        >
                            {ctaLabel}
                        </button>
                    </div>

                    <div className="flex-1 bg-white/5 backdrop-blur-sm p-5 md:p-8 flex items-center justify-center relative z-10">
                        <div className="grid grid-cols-3 gap-2 md:gap-4 items-center w-full max-w-[550px] pb-4">
                            {cards.map((card) => (
                                <div key={card.id} className="flex flex-col items-center" onClick={() => navigate(card.path)}>
                                    <motion.div
                                        whileHover={{ scale: 1.05 }}
                                        className={`relative w-full aspect-[4/5] rounded-[20px] overflow-hidden border-2 md:border-[3px] border-[#C9A84C] shadow-[0_20px_50px_rgba(0,0,0,0.4)] bg-[#0D2015] cursor-pointer ${card.highlight ? 'scale-110 -translate-y-2' : 'scale-95'}`}
                                    >
                                        <img
                                            src={card.image}
                                            alt={card.name}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                    </motion.div>
                                    <span className={`text-white font-black mt-5 tracking-widest uppercase ${card.highlight ? 'text-[12px] md:text-[14px]' : 'text-[11px] md:text-[13px]'}`}>
                                        {card.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default GoldNewLaunchBanner;
