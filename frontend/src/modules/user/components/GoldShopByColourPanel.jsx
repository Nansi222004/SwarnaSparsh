import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Sparkles, ShieldCheck } from 'lucide-react';
import { resolveLegacyCmsAsset } from '../utils/legacyCmsAssets';

import whiteImg from '@assets/gold_color_white.png';
import roseImg from '@assets/gold_color_rose.png';
import yellowImg from '@assets/gold_color_yellow.png';

export const DEFAULT_GOLD_TONES = [
    {
        id: 'white-gold',
        itemId: 'colour-white-gold',
        toneKey: 'white-gold',
        name: 'White Gold',
        toneLabel: 'White Gold',
        tag: 'Pure Modern Brilliance',
        image: whiteImg,
        path: '/shop?metal=gold&tone=white-gold',
        swatchBorder: 'border-slate-300',
        swatchGlint: 'from-slate-200/60 to-white/90',
        accentColor: '#94A3B8'
    },
    {
        id: 'rose-gold',
        itemId: 'colour-rose-gold',
        toneKey: 'rose-gold',
        name: 'Rose Gold',
        toneLabel: 'Rose Gold',
        tag: 'Warm Romantic Glow',
        image: roseImg,
        path: '/shop?metal=gold&tone=rose-gold',
        swatchBorder: 'border-rose-300',
        swatchGlint: 'from-rose-200/60 to-white/90',
        accentColor: '#E17B8A'
    },
    {
        id: 'gold',
        itemId: 'colour-gold',
        toneKey: 'gold',
        name: 'Yellow Gold',
        toneLabel: 'Yellow Gold',
        tag: 'Classic 22K Radiance',
        image: yellowImg,
        path: '/shop?metal=gold&tone=gold',
        swatchBorder: 'border-amber-400',
        swatchGlint: 'from-amber-200/60 to-white/90',
        accentColor: '#C59B27'
    }
];

/**
 * Sanitizes and resolves items for the Gold Collection Shop by Colour panel.
 * - Completely filters out Pure 925 Silver, Oxidised Silver, and all plated items.
 * - Guarantees only the 3 canonical gold tones: White Gold, Rose Gold, Yellow Gold.
 * - Preserves both `id` and `itemId` for full Admin CMS schema compatibility.
 */
export const resolveGoldTones = (configuredItems = []) => {
    if (!Array.isArray(configuredItems) || configuredItems.length === 0) {
        return DEFAULT_GOLD_TONES;
    }

    const isSilverOrPlated = (item) => {
        const fullText = `${item?.name || ''} ${item?.label || ''} ${item?.tag || ''} ${item?.subtitle || ''} ${item?.itemId || ''} ${item?.id || ''} ${item?.path || ''}`.toLowerCase();
        return (
            fullText.includes('silver') ||
            fullText.includes('oxidi') ||
            fullText.includes('oxydis') ||
            fullText.includes('plated') ||
            item?.metalKey === 'silver' ||
            item?.metalKey === 'oxidised'
        );
    };

    const eligibleItems = configuredItems.filter((item) => !isSilverOrPlated(item));

    const findMatchingConfig = (toneKey) => {
        return eligibleItems.find((item) => {
            const text = `${item?.name || ''} ${item?.label || ''} ${item?.tag || ''} ${item?.itemId || ''} ${item?.id || ''} ${item?.path || ''}`.toLowerCase();
            if (toneKey === 'white-gold') {
                return text.includes('white');
            }
            if (toneKey === 'rose-gold') {
                return text.includes('rose');
            }
            if (toneKey === 'gold') {
                return !text.includes('white') && !text.includes('rose') && (text.includes('yellow') || text.includes('gold'));
            }
            return false;
        });
    };

    return DEFAULT_GOLD_TONES.map((defTone) => {
        const matched = findMatchingConfig(defTone.toneKey);
        if (!matched) return defTone;

        const resolvedImg = matched?.image ? resolveLegacyCmsAsset(matched.image, defTone.image) : defTone.image;
        const validPath = matched?.path && matched.path.includes('tone=') ? matched.path : defTone.path;

        return {
            ...defTone,
            id: matched.id || matched.itemId || defTone.id,
            itemId: matched.itemId || matched.id || defTone.itemId,
            name: matched.label || matched.name || defTone.name,
            tag: matched.tag || matched.subtitle || defTone.tag,
            image: resolvedImg || defTone.image,
            path: validPath
        };
    });
};

const GoldShopByColourPanel = ({
    sectionData = null,
    className = '',
    layout = 'panel' // 'panel' (desktop column) | 'horizontal' (mobile/tablet bar)
}) => {
    const title = String(sectionData?.settings?.title || 'Shop by Colour').trim();
    const subtitle = String(sectionData?.settings?.subtitle || 'Choose Your Gold Tone').trim();
    const badge = String(sectionData?.settings?.badge || 'Atelier Palette').trim();

    const tones = useMemo(() => {
        const configured = Array.isArray(sectionData?.items) ? sectionData.items : [];
        return resolveGoldTones(configured);
    }, [sectionData?.items]);

    // Horizontal layout for mobile & tablet screens
    if (layout === 'horizontal') {
        return (
            <div className={`w-full max-w-full overflow-hidden bg-[#FAF8F5] rounded-2xl border border-[#E8DFD0] p-3 sm:p-5 ${className}`}>
                <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-[#E8DFD0]/60 min-w-0">
                    <div className="flex items-center gap-1.5 shrink-0">
                        <Sparkles className="w-3.5 h-3.5 text-[#C59B27]" />
                        <span className="font-serif text-sm sm:text-base font-medium text-[#141211]">
                            {title}
                        </span>
                    </div>
                    <span className="text-[10px] text-stone-400 uppercase tracking-wider font-sans hidden sm:inline-block">
                        {subtitle}
                    </span>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full">
                    {tones.map((tone) => (
                        <Link
                            key={tone.id || tone.itemId}
                            to={tone.path}
                            className="group flex flex-col items-center text-center p-2 sm:p-3 rounded-xl bg-white border border-[#E8DFD0] hover:border-[#C59B27] hover:shadow-xs transition-all duration-300 min-h-[44px] min-w-0 w-full"
                        >
                            <div className={`relative w-11 h-11 sm:w-14 sm:h-14 rounded-full p-0.5 bg-gradient-to-tr from-white to-stone-100 border-2 ${tone.swatchBorder} group-hover:border-[#C59B27] shadow-xs overflow-hidden mb-1.5 transition-transform duration-300 group-hover:scale-105 shrink-0`}>
                                <img
                                    src={tone.image}
                                    alt={tone.name}
                                    className="w-full h-full object-cover rounded-full"
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/35 via-transparent to-transparent pointer-events-none" />
                            </div>
                            <span className="font-serif text-[11px] sm:text-xs md:text-sm font-medium text-[#141211] group-hover:text-[#C59B27] transition-colors leading-tight text-center w-full break-words min-h-[26px] flex items-center justify-center">
                                {tone.name}
                            </span>
                            <span className="text-[9px] text-stone-400 font-sans hidden sm:block line-clamp-1 mt-0.5 tracking-wider uppercase w-full truncate">
                                {tone.tag}
                            </span>
                        </Link>
                    ))}
                </div>
            </div>
        );
    }

    // Default: 'panel' for desktop side-by-side layout in Gold Collection Grid
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

                {/* Tone Options List — strictly White Gold, Rose Gold, Yellow Gold */}
                <div className="space-y-3.5">
                    {tones.map((tone) => (
                        <Link
                            key={tone.id || tone.itemId}
                            to={tone.path}
                            className="group flex items-center justify-between p-3 lg:p-3.5 rounded-2xl bg-white border border-[#E8DFD0] hover:border-[#C59B27] hover:shadow-[0_8px_20px_rgba(20,18,17,0.06)] transition-all duration-300"
                        >
                            <div className="flex items-center gap-3.5 min-w-0">
                                {/* Swatch / Thumbnail Circle with metallic tone rim */}
                                <div className={`relative w-12 h-12 lg:w-13 lg:h-13 rounded-full shrink-0 p-0.5 bg-gradient-to-tr from-white to-stone-100 border-2 ${tone.swatchBorder} group-hover:border-[#C59B27] shadow-xs overflow-hidden transition-transform duration-500 group-hover:scale-108`}>
                                    <img
                                        src={tone.image}
                                        alt={tone.name}
                                        className="w-full h-full object-cover rounded-full"
                                        loading="lazy"
                                    />
                                    {/* Specular Glint */}
                                    <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/35 via-transparent to-transparent pointer-events-none" />
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
                <div className="flex items-center gap-1.5 text-stone-500">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#C59B27]" />
                    <span className="text-[11px] font-serif italic">
                        18K & 22K Certified Artistry
                    </span>
                </div>
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
