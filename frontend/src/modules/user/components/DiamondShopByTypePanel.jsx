import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Sparkles, Gem } from 'lucide-react';
import { resolveLegacyCmsAsset } from '../utils/legacyCmsAssets';

import naturalDiamondImg from '@assets/hero/diamond_luxury.png';
import labGrownDiamondImg from '@assets/hero/diamond_elegance_campaign.png';

export const DEFAULT_DIAMOND_TYPES = [
    {
        id: 'diamond-natural',
        name: 'Natural Diamonds',
        tag: 'Timeless Brilliance, Naturally Formed',
        image: naturalDiamondImg,
        path: '/shop?metal=diamond&diamondType=natural',
        accent: '#D4AF37'
    },
    {
        id: 'diamond-lab-grown',
        name: 'Lab-Grown Diamonds',
        tag: 'Modern Brilliance, Beautifully Created',
        image: labGrownDiamondImg,
        path: '/shop?metal=diamond&diamondType=lab_grown',
        accent: '#60A5FA'
    }
];

const DiamondShopByTypePanel = ({
    sectionData = null,
    className = '',
    layout = 'panel' // 'panel' (desktop column) | 'horizontal' (mobile/tablet bar)
}) => {
    const title = String(sectionData?.settings?.title || 'Shop by Diamond Type').trim();
    const subtitle = String(sectionData?.settings?.subtitle || 'Discover brilliance, your way.').trim();
    const badge = String(sectionData?.settings?.badge || 'DIAMOND COLLECTION').trim();

    const items = useMemo(() => {
        const configuredItems = Array.isArray(sectionData?.items) ? sectionData.items : [];
        if (configuredItems.length === 0) {
            return DEFAULT_DIAMOND_TYPES;
        }

        return configuredItems.slice(0, 2).map((item, index) => {
            const fallback = DEFAULT_DIAMOND_TYPES[index] || DEFAULT_DIAMOND_TYPES[0];
            const resolvedImg = resolveLegacyCmsAsset(item?.image, fallback.image) || fallback.image;

            return {
                id: item.itemId || item.id || fallback.id,
                name: item.label || item.name || fallback.name,
                tag: item.tag || item.subtitle || fallback.tag,
                image: resolvedImg,
                path: item.path || fallback.path,
                accent: fallback.accent
            };
        });
    }, [sectionData?.items]);

    if (layout === 'horizontal') {
        return (
            <div className={`w-full bg-[#FAF8F5] rounded-2xl border border-[#E8DFD0] p-4 sm:p-5 ${className}`}>
                <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-[#E8DFD0]/60">
                    <div className="flex items-center gap-2">
                        <Gem className="w-3.5 h-3.5 text-stone-700" />
                        <span className="font-serif text-sm sm:text-base font-medium text-[#141211]">
                            {title}
                        </span>
                    </div>
                    <span className="text-[10px] text-stone-500 uppercase tracking-wider font-sans font-semibold">
                        {subtitle}
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {items.map((item) => (
                        <Link
                            key={item.id}
                            to={item.path}
                            className="group flex items-center p-3 sm:p-3.5 rounded-xl bg-white border border-[#E8DFD0] hover:border-stone-400 hover:shadow-xs transition-all duration-300 min-h-[44px] gap-3.5"
                        >
                            <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full p-0.5 bg-gradient-to-tr from-white to-stone-100 border-2 border-[#E8DFD0] group-hover:border-stone-400 shadow-xs overflow-hidden shrink-0 transition-transform duration-300 group-hover:scale-105">
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-full h-full object-cover rounded-full"
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/30 via-transparent to-transparent pointer-events-none" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <span className="font-serif text-sm sm:text-base font-medium text-[#141211] group-hover:text-stone-900 transition-colors block line-clamp-1">
                                    {item.name}
                                </span>
                                <span className="text-[10px] text-stone-500 font-sans line-clamp-1 mt-0.5">
                                    {item.tag}
                                </span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-stone-900 transition-transform group-hover:translate-x-1 shrink-0" />
                        </Link>
                    ))}
                </div>
            </div>
        );
    }

    // Default: 'panel' for desktop side-by-side layout
    return (
        <div
            className={`h-full flex flex-col justify-between bg-[#FAF8F5] rounded-3xl border border-[#E8DFD0] hover:border-stone-400 p-6 lg:p-7 shadow-xs hover:shadow-[0_16px_36px_rgba(20,18,17,0.06)] transition-all duration-500 ${className}`}
        >
            {/* Header */}
            <div>
                <div className="inline-flex items-center gap-1.5 mb-2 text-stone-600 text-[10px] uppercase font-bold tracking-[0.25em]">
                    <Sparkles className="w-3.5 h-3.5 text-stone-500" />
                    <span>{badge}</span>
                </div>
                <h3 className="font-serif text-xl lg:text-2xl text-[#141211] font-medium tracking-tight mb-1">
                    {title}
                </h3>
                <p className="text-stone-500 text-xs font-sans mb-6">
                    {subtitle}
                </p>

                {/* Diamond Types List (2 Luxury Cards) */}
                <div className="space-y-4">
                    {items.map((item) => (
                        <Link
                            key={item.id}
                            to={item.path}
                            className="group flex items-center justify-between p-3.5 lg:p-4 rounded-2xl bg-white border border-[#E8DFD0] hover:border-stone-400 hover:shadow-[0_8px_20px_rgba(20,18,17,0.06)] transition-all duration-300"
                        >
                            <div className="flex items-center gap-3.5 min-w-0">
                                {/* Specular Thumbnail Circle */}
                                <div className="relative w-13 h-13 lg:w-14 lg:h-14 rounded-full shrink-0 p-0.5 bg-gradient-to-tr from-white to-stone-100 border-2 border-[#E8DFD0] group-hover:border-stone-400 shadow-xs overflow-hidden transition-transform duration-500 group-hover:scale-108">
                                    <img
                                        src={item.image}
                                        alt={item.name}
                                        className="w-full h-full object-cover rounded-full"
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/35 via-transparent to-transparent pointer-events-none" />
                                </div>

                                {/* Label & Tagline */}
                                <div className="min-w-0">
                                    <h4 className="font-serif text-base font-medium text-[#141211] group-hover:text-stone-900 transition-colors line-clamp-1">
                                        {item.name}
                                    </h4>
                                    <span className="text-[10px] uppercase font-sans tracking-[0.12em] text-stone-400 group-hover:text-stone-600 transition-colors line-clamp-1">
                                        {item.tag}
                                    </span>
                                </div>
                            </div>

                            {/* Chevron Action */}
                            <div className="w-7 h-7 rounded-full bg-stone-50 group-hover:bg-[#141211] flex items-center justify-center shrink-0 ml-2 transition-all duration-300">
                                <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-white transition-transform duration-300 group-hover:translate-x-0.5" />
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Bottom Atelier Link / Assurance */}
            <div className="pt-6 mt-6 border-t border-[#E8DFD0]/70 flex items-center justify-between">
                <span className="text-[11px] text-stone-500 font-serif italic">
                    Certified Authenticity & Grading
                </span>
                <Link
                    to="/shop?metal=diamond"
                    className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-stone-700 hover:text-[#141211] transition-colors"
                >
                    <span>All Diamonds</span>
                    <ChevronRight className="w-3 h-3" />
                </Link>
            </div>
        </div>
    );
};

export default DiamondShopByTypePanel;
