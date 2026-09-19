import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Sparkles } from 'lucide-react';
import { resolveLegacyCmsAsset } from '../utils/legacyCmsAssets';

import whiteImg from '@assets/gold_color_white.png';
import roseImg from '@assets/gold_color_rose.png';
import yellowImg from '@assets/gold_color_yellow.png';

export const DEFAULT_GOLD_TONES = [
    {
        id: 'white-gold',
        name: 'White Gold',
        tag: 'Pure Modern Brilliance',
        image: whiteImg,
        path: '/shop?metal=gold&tone=white-gold',
        gradient: 'from-[#E2E8F0] via-[#F8FAFC] to-[#CBD5E1]',
        ringColor: 'border-[#CBD5E1]',
        accent: '#94A3B8'
    },
    {
        id: 'rose-gold',
        name: 'Rose Gold',
        tag: 'Warm Romantic Glow',
        image: roseImg,
        path: '/shop?metal=gold&tone=rose-gold',
        gradient: 'from-[#FFD1DA] via-[#FFF1F2] to-[#EE9CA7]',
        ringColor: 'border-[#EE9CA7]',
        accent: '#E17B8A'
    },
    {
        id: 'gold',
        name: 'Gold',
        tag: 'Classic 22K Radiance',
        image: yellowImg,
        path: '/shop?metal=gold',
        gradient: 'from-[#FDE68A] via-[#FEF3C7] to-[#D97706]',
        ringColor: 'border-[#C59B27]',
        accent: '#C59B27'
    }
];

const GoldShopByColourPanel = ({
    sectionData = null,
    className = '',
    layout = 'panel' // 'panel' (desktop column) | 'horizontal' (mobile/tablet bar)
}) => {
    const title = String(sectionData?.settings?.title || 'Shop by Colour').trim();
    const subtitle = String(sectionData?.settings?.subtitle || 'Choose Your Gold Tone').trim();
    const badge = String(sectionData?.settings?.badge || 'Atelier Palette').trim();

    const tones = useMemo(() => {
        const configuredItems = Array.isArray(sectionData?.items) ? sectionData.items : [];
        if (configuredItems.length === 0) {
            return DEFAULT_GOLD_TONES;
        }

        return configuredItems.slice(0, 3).map((item, index) => {
            const fallback = DEFAULT_GOLD_TONES[index] || DEFAULT_GOLD_TONES[0];
            const resolvedImg = resolveLegacyCmsAsset(item?.image, fallback.image) || fallback.image;

            return {
                id: item.itemId || item.id || fallback.id,
                name: item.label || item.name || fallback.name,
                tag: item.tag || item.subtitle || fallback.tag,
                image: resolvedImg,
                path: item.path || fallback.path,
                gradient: fallback.gradient,
                ringColor: fallback.ringColor,
                accent: fallback.accent
            };
        });
    }, [sectionData?.items]);

    if (layout === 'horizontal') {
        return (
            <div className={`w-full bg-[#FAF8F5] rounded-2xl border border-[#E8DFD0] p-4 sm:p-5 ${className}`}>
                <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-[#E8DFD0]/60">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-[#C59B27]" />
                        <span className="font-serif text-sm sm:text-base font-medium text-[#141211]">
                            {title}
                        </span>
                    </div>
                    <span className="text-[10px] text-stone-500 uppercase tracking-wider font-sans font-semibold">
                        {subtitle}
                    </span>
                </div>

                <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
                    {tones.map((tone) => (
                        <Link
                            key={tone.id}
                            to={tone.path}
                            className="group flex flex-col items-center text-center p-2 sm:p-3 rounded-xl bg-white border border-[#E8DFD0] hover:border-[#C59B27] hover:shadow-xs transition-all duration-300 min-h-[44px]"
                        >
                            <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full p-0.5 bg-gradient-to-tr from-white to-stone-100 border-2 border-[#E8DFD0] group-hover:border-[#C59B27] shadow-xs overflow-hidden mb-2 transition-transform duration-300 group-hover:scale-105">
                                <img
                                    src={tone.image}
                                    alt={tone.name}
                                    className="w-full h-full object-cover rounded-full"
                                    loading="lazy"
                                />
                            </div>
                            <span className="font-serif text-xs sm:text-sm font-medium text-[#141211] group-hover:text-[#C59B27] transition-colors line-clamp-1">
                                {tone.name}
                            </span>
                            <span className="text-[9px] text-stone-400 font-sans hidden sm:block line-clamp-1 mt-0.5">
                                {tone.tag}
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
            className={`h-full flex flex-col justify-between bg-[#FAF8F5] rounded-3xl border border-[#E8DFD0] hover:border-[#C59B27]/80 p-6 lg:p-7 shadow-xs hover:shadow-[0_16px_36px_rgba(20,18,17,0.06)] transition-all duration-500 ${className}`}
        >
            {/* Header */}
            <div>
                <div className="inline-flex items-center gap-1.5 mb-2 text-[#C59B27] text-[10px] uppercase font-bold tracking-[0.25em]">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{badge}</span>
                </div>
                <h3 className="font-serif text-xl lg:text-2xl text-[#141211] font-medium tracking-tight mb-1">
                    {title}
                </h3>
                <p className="text-stone-500 text-xs font-sans mb-6">
                    {subtitle}
                </p>

                {/* Tone Options List */}
                <div className="space-y-3.5">
                    {tones.map((tone) => (
                        <Link
                            key={tone.id}
                            to={tone.path}
                            className="group flex items-center justify-between p-3 lg:p-3.5 rounded-2xl bg-white border border-[#E8DFD0] hover:border-[#C59B27] hover:shadow-[0_8px_20px_rgba(20,18,17,0.06)] transition-all duration-300"
                        >
                            <div className="flex items-center gap-3.5 min-w-0">
                                {/* Swatch / Thumbnail Circle */}
                                <div className="relative w-12 h-12 lg:w-13 lg:h-13 rounded-full shrink-0 p-0.5 bg-gradient-to-tr from-white to-stone-100 border-2 border-[#E8DFD0] group-hover:border-[#C59B27] shadow-xs overflow-hidden transition-transform duration-500 group-hover:scale-108">
                                    <img
                                        src={tone.image}
                                        alt={tone.name}
                                        className="w-full h-full object-cover rounded-full"
                                        loading="lazy"
                                    />
                                    {/* Specular Glint */}
                                    <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/30 via-transparent to-transparent pointer-events-none" />
                                </div>

                                {/* Label & Tagline */}
                                <div className="min-w-0">
                                    <h4 className="font-serif text-sm lg:text-[15px] font-medium text-[#141211] group-hover:text-[#C59B27] transition-colors line-clamp-1">
                                        {tone.name}
                                    </h4>
                                    <span className="text-[10px] uppercase font-sans tracking-[0.14em] text-stone-400 group-hover:text-stone-600 transition-colors line-clamp-1">
                                        {tone.tag}
                                    </span>
                                </div>
                            </div>

                            {/* Chevron Action */}
                            <div className="w-7 h-7 rounded-full bg-stone-50 group-hover:bg-[#141211] flex items-center justify-center shrink-0 ml-2 transition-all duration-300">
                                <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-[#E8D198] transition-transform duration-300 group-hover:translate-x-0.5" />
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Bottom Atelier Link / Assurance */}
            <div className="pt-6 mt-6 border-t border-[#E8DFD0]/70 flex items-center justify-between">
                <span className="text-[11px] text-stone-500 font-serif italic">
                    18K & 22K Certified Artistry
                </span>
                <Link
                    to="/shop?metal=gold"
                    className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#C59B27] hover:text-[#141211] transition-colors"
                >
                    <span>All Gold</span>
                    <ChevronRight className="w-3 h-3" />
                </Link>
            </div>
        </div>
    );
};

export default GoldShopByColourPanel;
