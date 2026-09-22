import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, ShieldCheck, Gem, Leaf } from 'lucide-react';
import { resolveLegacyCmsAsset } from '../utils/legacyCmsAssets';

import naturalDiamondImg from '@assets/hero/diamond_luxury.png';
import labGrownDiamondImg from '@assets/hero/diamond_elegance_campaign.png';

const DEFAULT_ITEMS = [
    {
        id: 'diamond-natural',
        name: 'Natural Diamonds',
        label: 'Natural Diamonds',
        tag: 'Eternal Heritage',
        subtitle: 'Formed over billions of years deep within the Earth. Rare, timeless, and certified by international gemological institutes.',
        image: naturalDiamondImg,
        path: '/shop?metal=diamond&diamondType=natural',
        badge: 'Mined from Earth',
        features: ['100% Naturally Formed', 'Certified Rarity & Heritage', 'Heirloom Investment Value']
    },
    {
        id: 'diamond-lab-grown',
        name: 'Lab-Grown Diamonds',
        label: 'Lab-Grown Diamonds',
        tag: 'Conscious Luxury',
        subtitle: 'Chemically, physically, and optically identical to mined diamonds. Crafted using advanced CVD/HPHT technology with unmatched brilliance.',
        image: labGrownDiamondImg,
        path: '/shop?metal=diamond&diamondType=lab_grown',
        badge: 'Eco-Conscious Brilliance',
        features: ['100% Chemically Identical', 'Superior Cut & Clarity', 'Remarkable Modern Value']
    }
];

const DiamondShopByType = ({ sectionData }) => {
    const settings = sectionData?.settings || {};
    const title = settings.title || 'Natural & Lab-Grown Diamonds';
    const subtitle = settings.subtitle || 'Discover your ideal brilliance with absolute authenticity, complete certification, and transparent origin.';
    const badge = settings.badge || 'Curated Origins';

    const items = useMemo(() => {
        const rawItems = Array.isArray(sectionData?.items) && sectionData.items.length > 0
            ? sectionData.items
            : DEFAULT_ITEMS;

        return rawItems.slice(0, 2).map((item, index) => {
            const fallback = DEFAULT_ITEMS[index] || DEFAULT_ITEMS[0];
            const resolvedImg = resolveLegacyCmsAsset(item.image, fallback.image) || fallback.image;
            return {
                id: item.itemId || item.id || fallback.id,
                name: item.label || item.name || fallback.name,
                tag: item.tag || fallback.tag,
                subtitle: item.subtitle || item.description || fallback.subtitle,
                image: resolvedImg,
                path: item.path || fallback.path,
                badge: fallback.badge,
                features: fallback.features
            };
        });
    }, [sectionData?.items]);

    return (
        <section className="py-14 md:py-20 bg-gradient-to-b from-white via-[#FAFBFD] to-white border-b border-stone-200/60">
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-stone-200 bg-white text-[#171717] text-[10px] md:text-[11px] font-bold uppercase tracking-[0.25em] mb-3 shadow-2xs">
                        <Sparkles className="w-3.5 h-3.5 text-[#C6A04A]" />
                        <span>{badge}</span>
                    </div>
                    <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-[#171717] font-normal tracking-tight mb-3">
                        {title}
                    </h2>
                    <p className="text-xs sm:text-sm text-stone-500 font-light max-w-xl mx-auto leading-relaxed">
                        {subtitle}
                    </p>
                </div>

                {/* Dual Split Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                    {items.map((item, idx) => {
                        const isNatural = idx === 0;
                        return (
                            <div
                                key={item.id}
                                className="group relative bg-white rounded-3xl border border-stone-200/80 hover:border-[#C6A04A]/60 shadow-xs hover:shadow-[0_20px_45px_rgba(23,23,23,0.08)] transition-all duration-500 flex flex-col justify-between overflow-hidden"
                            >
                                <div className="p-6 sm:p-8 md:p-10 flex-1 flex flex-col justify-between">
                                    <div>
                                        {/* Badge & Tag */}
                                        <div className="flex items-center justify-between gap-3 mb-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                isNatural
                                                    ? 'bg-[#FAF6ED] text-[#C6A04A] border border-[#E8DFC8]'
                                                    : 'bg-sky-50 text-sky-800 border border-sky-200/60'
                                            }`}>
                                                {isNatural ? <Gem className="w-3 h-3" /> : <Leaf className="w-3 h-3" />}
                                                <span>{item.badge}</span>
                                            </span>
                                            <span className="text-[11px] uppercase font-sans tracking-[0.2em] text-stone-400 font-semibold">
                                                {item.tag}
                                            </span>
                                        </div>

                                        {/* Title & Description */}
                                        <h3 className="font-serif text-2xl sm:text-3xl text-[#171717] font-medium tracking-tight mb-3">
                                            {item.name}
                                        </h3>
                                        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-light mb-6">
                                            {item.subtitle}
                                        </p>

                                        {/* Feature Checklist */}
                                        <ul className="space-y-2.5 mb-8">
                                            {item.features.map((feat, fIdx) => (
                                                <li key={fIdx} className="flex items-center gap-2.5 text-xs text-stone-700 font-medium">
                                                    <div className="w-4 h-4 rounded-full bg-[#FAF6ED] border border-[#C6A04A]/40 flex items-center justify-center shrink-0">
                                                        <ShieldCheck className="w-2.5 h-2.5 text-[#C6A04A]" />
                                                    </div>
                                                    <span>{feat}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Image Showcase */}
                                    <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-stone-100 border border-stone-100 mb-6">
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            loading="lazy"
                                            className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
                                    </div>

                                    {/* CTA Action */}
                                    <Link
                                        to={item.path}
                                        className={`w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all shadow-xs ${
                                            isNatural
                                                ? 'bg-[#171717] text-white hover:bg-[#C6A04A] hover:text-[#171717]'
                                                : 'bg-stone-900 text-white hover:bg-sky-900'
                                        }`}
                                    >
                                        <span>Shop {item.name}</span>
                                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default DiamondShopByType;
