import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, ArrowUpRight, Tag } from 'lucide-react';

import editEverydayImg from '@assets/edits/edit_everyday.png';
import editSolitaireImg from '@assets/edits/edit_solitaire.png';
import editBridalImg from '@assets/edits/edit_bridal.png';
import editAtelierImg from '@assets/edits/edit_atelier.png';
import fallbackDiamondImg from '@assets/diamonds/round.png';

const DEFAULT_EDITS = [
    {
        id: 'edit-everyday',
        itemId: 'edit-everyday',
        name: 'Everyday Sparkle',
        label: 'Everyday Sparkle',
        tag: 'Under ₹35,000',
        badge: 'Under ₹35,000',
        subtitle: 'Delicate rings, minimalist studs, and dainty pendants designed for effortless daily radiance.',
        path: '/shop?metal=diamond&priceMax=35000',
        image: editEverydayImg,
    },
    {
        id: 'edit-solitaire',
        itemId: 'edit-solitaire',
        name: 'The Solitaire Edit',
        label: 'The Solitaire Edit',
        tag: 'Signature Solitaires',
        badge: 'Signature Solitaires',
        subtitle: 'Statement single-stone diamond rings and classic 4-prong pendants for milestone engagements.',
        path: '/shop?metal=diamond&search=solitaire',
        image: editSolitaireImg,
    },
    {
        id: 'edit-bridal',
        itemId: 'edit-bridal',
        name: 'Bridal & Statement',
        label: 'Bridal & Statement',
        tag: 'Grand Celebrations',
        badge: 'Grand Celebrations',
        subtitle: 'Extravagant diamond necklaces, chandelier earrings, and heirloom cocktail cuffs for grand celebrations.',
        path: '/shop?metal=diamond&search=necklace',
        image: editBridalImg,
    },
    {
        id: 'edit-office',
        itemId: 'edit-office',
        name: 'Modern Atelier',
        label: 'Modern Atelier',
        tag: 'Contemporary Chic',
        badge: 'Contemporary Chic',
        subtitle: 'Clean geometric profiles and stackable diamond bands designed for effortless boardroom poise.',
        path: '/shop?metal=diamond&search=ring',
        image: editAtelierImg,
    },
];

// Helper to determine the best matching image asset
const resolveItemImage = (item, idx) => {
    if (item?.image && typeof item.image === 'string' && item.image.trim() !== '') {
        return item.image;
    }
    if (item?.imageUrl && typeof item.imageUrl === 'string' && item.imageUrl.trim() !== '') {
        return item.imageUrl;
    }

    const key = String(item?.itemId || item?.id || item?.name || item?.label || '').toLowerCase();
    if (key.includes('everyday') || key.includes('35000') || key.includes('sparkle')) return editEverydayImg;
    if (key.includes('solitaire') || key.includes('single')) return editSolitaireImg;
    if (key.includes('bridal') || key.includes('statement') || key.includes('wedding') || key.includes('necklace')) return editBridalImg;
    if (key.includes('office') || key.includes('atelier') || key.includes('modern') || key.includes('chic') || key.includes('ring')) return editAtelierImg;

    return DEFAULT_EDITS[idx % DEFAULT_EDITS.length]?.image || fallbackDiamondImg;
};

// Subcomponent for each luxury curated edit card
const CuratedEditCard = ({ item, fallbackItem, index }) => {
    const defaultAsset = resolveItemImage(item, index);
    const [imgSrc, setImgSrc] = useState(defaultAsset);
    const [imgFailed, setImgFailed] = useState(false);

    const handleImageError = () => {
        if (!imgFailed) {
            setImgFailed(true);
            setImgSrc(fallbackItem.image || fallbackDiamondImg);
        }
    };

    const title = item.name || item.label || fallbackItem.name;
    const badgeText = item.tag || item.badge || fallbackItem.tag;
    const desc = item.subtitle || item.description || fallbackItem.subtitle;
    const targetPath = item.path || fallbackItem.path;

    return (
        <Link
            to={targetPath}
            className="group relative flex flex-col bg-white rounded-2xl sm:rounded-3xl overflow-hidden border border-stone-200/80 hover:border-[#C6A04A]/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_35px_rgba(198,160,74,0.14)] transition-all duration-500 transform hover:-translate-y-1.5 focus:outline-hidden"
        >
            {/* Image Container with zoom-on-hover */}
            <div className="relative w-full aspect-[4/3] sm:aspect-[16/11] overflow-hidden bg-stone-100">
                <img
                    src={imgSrc}
                    alt={title}
                    onError={handleImageError}
                    loading="lazy"
                    className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-108"
                />

                {/* Ambient luxury gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500 pointer-events-none" />

                {/* Glassmorphic Badge Pill */}
                <div className="absolute top-3 sm:top-3.5 left-3 sm:left-3.5 z-10 inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-white/95 backdrop-blur-md border border-white/70 text-[#171717] text-[10px] sm:text-[11px] font-bold tracking-wider uppercase shadow-xs group-hover:border-[#C6A04A]/60 transition-colors">
                    <Tag className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#C6A04A]" />
                    <span>{badgeText}</span>
                </div>

                {/* Floating Quick-Action Circle */}
                <div className="absolute top-3 sm:top-3.5 right-3 sm:right-3.5 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/90 backdrop-blur-md border border-white/70 flex items-center justify-center text-[#171717] group-hover:bg-[#C6A04A] group-hover:text-white group-hover:border-[#C6A04A] transition-all duration-300 shadow-xs">
                    <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
            </div>

            {/* Content Container */}
            <div className="p-5 sm:p-6 flex flex-col flex-1 justify-between bg-white">
                <div>
                    <h3 className="font-serif text-lg sm:text-xl font-medium text-[#171717] group-hover:text-[#C6A04A] transition-colors duration-300 leading-snug mb-2">
                        {title}
                    </h3>
                    <p className="text-xs sm:text-[13px] text-stone-500 font-light leading-relaxed line-clamp-2 mb-4 sm:mb-5">
                        {desc}
                    </p>
                </div>

                {/* CTA Footer with Animated Arrow */}
                <div className="pt-3.5 sm:pt-4 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-[#171717] group-hover:text-[#C6A04A] transition-colors duration-300 inline-flex items-center gap-2">
                        <span>Explore Edit</span>
                        <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform duration-300 group-hover:translate-x-1.5" />
                    </span>
                    <span className="text-[10px] text-stone-400 font-medium tracking-wide">
                        Alankar Fine Jewels
                    </span>
                </div>
            </div>
        </Link>
    );
};

const DiamondCuratedCollections = ({ sectionData }) => {
    const settings = sectionData?.settings || {};
    const title = settings.title || 'Curated Diamond Edits';
    const subtitle = settings.subtitle || 'Selected by our creative studio for specific budgets, styling moods, and moments';
    const badge = settings.badge || 'Curated Moods';

    const items = Array.isArray(sectionData?.items) && sectionData.items.length > 0
        ? sectionData.items
        : DEFAULT_EDITS;

    return (
        <section className="py-12 sm:py-16 md:py-20 bg-[#FAFBFD]/60 border-b border-stone-200/60">
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-stone-200 bg-white text-[#171717] text-[10px] md:text-[11px] font-bold uppercase tracking-[0.25em] mb-2.5 shadow-2xs">
                        <Sparkles className="w-3.5 h-3.5 text-[#C6A04A]" />
                        <span>{badge}</span>
                    </div>
                    <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-[#171717] font-normal tracking-tight mb-2.5">
                        {title}
                    </h2>
                    <p className="text-xs sm:text-sm text-stone-500 font-light leading-relaxed">
                        {subtitle}
                    </p>
                </div>

                {/* Edits Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
                    {items.map((item, idx) => {
                        const fallback = DEFAULT_EDITS[idx % DEFAULT_EDITS.length];
                        return (
                            <CuratedEditCard
                                key={item.itemId || item.id || idx}
                                item={item}
                                fallbackItem={fallback}
                                index={idx}
                            />
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default DiamondCuratedCollections;
