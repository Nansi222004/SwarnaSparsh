import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ChevronRight, Gem } from 'lucide-react';
import { resolveLegacyCmsAsset } from '../utils/legacyCmsAssets';

import ringsImg from '@assets/categories/rings.png';
import earringsImg from '@assets/categories/earrings.png';
import pendantsImg from '@assets/categories/pendants.png';
import banglesImg from '@assets/categories/bangle.png';
import braceletsImg from '@assets/categories/bracelets.png';
import mangalsutraImg from '@assets/categories/mangalsutra.png';
import nosepinImg from '@assets/categories/nosepin.png';
import solitaireImg from '@assets/diamond_ring.png';

const DEFAULT_CATEGORIES = [
    { id: 'dcat-1', name: 'Diamond Rings', tag: 'Solitaires & Bands', path: '/shop?metal=diamond&search=ring', image: ringsImg },
    { id: 'dcat-2', name: 'Diamond Earrings', tag: 'Studs & Drops', path: '/shop?metal=diamond&search=earring', image: earringsImg },
    { id: 'dcat-3', name: 'Diamond Pendants', tag: 'Chains & Lockets', path: '/shop?metal=diamond&search=necklace', image: pendantsImg },
    { id: 'dcat-4', name: 'Diamond Bangles', tag: 'Kadas & Cuffs', path: '/shop?metal=diamond&search=bangles', image: banglesImg },
    { id: 'dcat-5', name: 'Solitaire Jewellery', tag: 'Certified Solitaires', path: '/shop?metal=diamond&search=solitaire', image: solitaireImg },
    { id: 'dcat-6', name: 'Diamond Mangalsutra', tag: 'Sacred Sparkle', path: '/shop?metal=diamond&search=mangalsutra', image: mangalsutraImg },
    { id: 'dcat-7', name: 'Diamond Bracelets', tag: 'Tennis & Charm', path: '/shop?metal=diamond&search=bracelet', image: braceletsImg },
    { id: 'dcat-8', name: 'Diamond Nose Pins', tag: 'Subtle Radiance', path: '/shop?metal=diamond&search=nosepin', image: nosepinImg },
];

const DiamondCategoryShowcase = ({ sectionData }) => {
    const settings = sectionData?.settings || {};
    const title = settings.title || 'Curated Diamond Categories';
    const subtitle = settings.subtitle || 'Everyday elegance to grand celebrations, crafted in fine gold and certified diamonds.';
    const badge = settings.badge || 'Signature Atelier';

    const categories = useMemo(() => {
        const rawItems = Array.isArray(sectionData?.items) && sectionData.items.length > 0
            ? sectionData.items
            : DEFAULT_CATEGORIES;

        return rawItems.map((item, index) => {
            const fallback = DEFAULT_CATEGORIES[index] || DEFAULT_CATEGORIES[0];
            const resolvedImg = resolveLegacyCmsAsset(item.image, fallback.image) || fallback.image;
            return {
                id: item.itemId || item.id || `dcat-${index + 1}`,
                name: item.label || item.name || fallback.name,
                tag: item.tag || item.subtitle || fallback.tag,
                image: resolvedImg,
                path: item.path || fallback.path
            };
        });
    }, [sectionData?.items]);

    return (
        <section className="py-14 md:py-20 bg-white border-b border-stone-200/60">
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-10 md:mb-14">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-stone-200 bg-[#FAFBFD] text-[#171717] text-[10px] md:text-[11px] font-bold uppercase tracking-[0.25em] mb-3 shadow-2xs">
                        <Gem className="w-3.5 h-3.5 text-[#C6A04A]" />
                        <span>{badge}</span>
                    </div>
                    <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-[#171717] font-normal tracking-tight mb-3">
                        {title}
                    </h2>
                    <p className="text-xs sm:text-sm text-stone-500 font-light max-w-lg mx-auto leading-relaxed">
                        {subtitle}
                    </p>
                </div>

                {/* Category Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    {categories.map((cat) => (
                        <Link
                            key={cat.id}
                            to={cat.path}
                            className="group relative bg-[#FAFBFD] rounded-2xl overflow-hidden border border-stone-200/80 hover:border-[#C6A04A] shadow-xs hover:shadow-[0_16px_36px_rgba(23,23,23,0.08)] transition-all duration-400 flex flex-col justify-between"
                        >
                            {/* Image Box */}
                            <div className="relative aspect-square w-full overflow-hidden bg-white p-6 flex items-center justify-center">
                                <img
                                    src={cat.image}
                                    alt={cat.name}
                                    loading="lazy"
                                    className="max-h-[85%] max-w-[85%] object-contain transition-transform duration-500 group-hover:scale-110"
                                />
                                <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/90 border border-stone-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-xs">
                                    <Sparkles className="w-3 h-3 text-[#C6A04A]" />
                                </div>
                            </div>

                            {/* Caption Footer */}
                            <div className="p-4 bg-white border-t border-stone-100 flex items-center justify-between">
                                <div>
                                    <h3 className="font-serif text-sm sm:text-base font-medium text-[#171717] group-hover:text-[#C6A04A] transition-colors line-clamp-1">
                                        {cat.name}
                                    </h3>
                                    <p className="text-[10px] sm:text-[11px] font-sans text-stone-400 tracking-wider uppercase mt-0.5">
                                        {cat.tag}
                                    </p>
                                </div>
                                <div className="w-6 h-6 rounded-full bg-stone-50 group-hover:bg-[#171717] group-hover:text-white flex items-center justify-center transition-colors shrink-0 ml-2">
                                    <ChevronRight className="w-3 h-3 text-stone-400 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default DiamondCategoryShowcase;
