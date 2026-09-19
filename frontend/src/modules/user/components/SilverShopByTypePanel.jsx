import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Sparkles } from 'lucide-react';
import { resolveLegacyCmsAsset } from '../utils/legacyCmsAssets';

import ringsImg from '@assets/categories/rings.png';
import earringsImg from '@assets/categories/earrings.png';
import silverchainsImg from '@assets/categories/silverchains.png';
import braceletsImg from '@assets/categories/bracelets.png';

export const DEFAULT_SILVER_TYPES = [
    {
        id: 'silver-rings',
        name: '925 Silver Rings',
        tag: 'Everyday elegance in genuine sterling silver',
        image: ringsImg,
        path: '/shop?metal=silver&silver_type=925&category=finger-ring',
        accent: '#94A3B8'
    },
    {
        id: 'silver-earrings',
        name: '925 Silver Earrings',
        tag: 'Timeless silver styles for every occasion',
        image: earringsImg,
        path: '/shop?metal=silver&silver_type=925&category=earrings',
        accent: '#94A3B8'
    },
    {
        id: 'silver-chains',
        name: '925 Silver Chains & Necklaces',
        tag: 'Classic silver essentials',
        image: silverchainsImg,
        path: '/shop?metal=silver&silver_type=925&category=necklace',
        accent: '#94A3B8'
    },
    {
        id: 'silver-bracelets',
        name: '925 Silver Bracelets',
        tag: 'Refined styles for everyday wear',
        image: braceletsImg,
        path: '/shop?metal=silver&silver_type=925&category=bracelet',
        accent: '#94A3B8'
    }
];

const SilverShopByTypePanel = ({
    sectionData = null,
    className = '',
    layout = 'panel' // 'panel' (desktop column) | 'horizontal' (mobile/tablet bar)
}) => {
    const title = String(sectionData?.settings?.title || 'Shop by Silver').trim();
    const subtitle = String(sectionData?.settings?.subtitle || 'Handcrafted 925 Sterling Silver').trim();
    const badge = String(sectionData?.settings?.badge || 'Pure 925 Silver').trim();

    const items = useMemo(() => {
        const configuredItems = Array.isArray(sectionData?.items) ? sectionData.items : [];
        if (configuredItems.length === 0) {
            return DEFAULT_SILVER_TYPES;
        }

        return configuredItems.slice(0, 4).map((item, index) => {
            const fallback = DEFAULT_SILVER_TYPES[index] || DEFAULT_SILVER_TYPES[0];
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
                        <Sparkles className="w-3.5 h-3.5 text-stone-500" />
                        <span className="font-serif text-sm sm:text-base font-medium text-[#141211]">
                            {title}
                        </span>
                    </div>
                    <span className="text-[10px] text-stone-500 uppercase tracking-wider font-sans font-semibold">
                        {subtitle}
                    </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
                    {items.map((item) => (
                        <Link
                            key={item.id}
                            to={item.path}
                            className="group flex flex-col items-center text-center p-2.5 sm:p-3 rounded-xl bg-white border border-[#E8DFD0] hover:border-stone-400 hover:shadow-xs transition-all duration-300 min-h-[44px]"
                        >
                            <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full p-0.5 bg-gradient-to-tr from-white to-stone-100 border-2 border-[#E8DFD0] group-hover:border-stone-400 shadow-xs overflow-hidden mb-2 transition-transform duration-300 group-hover:scale-105">
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-full h-full object-cover rounded-full"
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/30 via-transparent to-transparent pointer-events-none" />
                            </div>
                            <span className="font-serif text-xs sm:text-sm font-medium text-[#141211] group-hover:text-stone-800 transition-colors line-clamp-1">
                                {item.name}
                            </span>
                            <span className="text-[9px] text-stone-400 font-sans hidden sm:block line-clamp-1 mt-0.5">
                                {item.tag}
                            </span>
                        </Link>
                    ))}
                </div>
            </div>
        );
    }

    // Default: 'panel' for desktop side-by-side layout
    return (
        <div
            className={`h-full flex flex-col justify-between bg-[#FAF8F5] rounded-3xl border border-[#E8DFD0] hover:border-stone-400 p-5 lg:p-6 shadow-xs hover:shadow-[0_16px_36px_rgba(20,18,17,0.06)] transition-all duration-500 ${className}`}
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
                <p className="text-stone-500 text-xs font-sans mb-5">
                    {subtitle}
                </p>

                {/* Silver Types List */}
                <div className="space-y-2.5">
                    {items.map((item) => (
                        <Link
                            key={item.id}
                            to={item.path}
                            className="group flex items-center justify-between p-2.5 lg:p-3 rounded-2xl bg-white border border-[#E8DFD0] hover:border-stone-400 hover:shadow-[0_8px_20px_rgba(20,18,17,0.06)] transition-all duration-300"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                {/* Thumbnail Circle */}
                                <div className="relative w-11 h-11 lg:w-12 lg:h-12 rounded-full shrink-0 p-0.5 bg-gradient-to-tr from-white to-stone-100 border-2 border-[#E8DFD0] group-hover:border-stone-400 shadow-xs overflow-hidden transition-transform duration-500 group-hover:scale-108">
                                    <img
                                        src={item.image}
                                        alt={item.name}
                                        className="w-full h-full object-cover rounded-full"
                                        loading="lazy"
                                    />
                                    {/* Specular Glint */}
                                    <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/30 via-transparent to-transparent pointer-events-none" />
                                </div>

                                {/* Label & Tagline */}
                                <div className="min-w-0">
                                    <h4 className="font-serif text-sm font-medium text-[#141211] group-hover:text-stone-800 transition-colors line-clamp-1">
                                        {item.name}
                                    </h4>
                                    <span className="text-[10px] uppercase font-sans tracking-[0.12em] text-stone-400 group-hover:text-stone-600 transition-colors line-clamp-1">
                                        {item.tag}
                                    </span>
                                </div>
                            </div>

                            {/* Chevron Action */}
                            <div className="w-6 h-6 rounded-full bg-stone-50 group-hover:bg-[#141211] flex items-center justify-center shrink-0 ml-2 transition-all duration-300">
                                <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-white transition-transform duration-300 group-hover:translate-x-0.5" />
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Bottom Atelier Link / Assurance */}
            <div className="pt-4 mt-5 border-t border-[#E8DFD0]/70 flex items-center justify-between">
                <span className="text-[11px] text-stone-500 font-serif italic">
                    Certified 925 Sterling Silver
                </span>
                <Link
                    to="/shop?metal=silver"
                    className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-stone-700 hover:text-[#141211] transition-colors"
                >
                    <span>All Silver</span>
                    <ChevronRight className="w-3 h-3" />
                </Link>
            </div>
        </div>
    );
};

export default SilverShopByTypePanel;
