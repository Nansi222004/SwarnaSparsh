import React, { useRef, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, Search } from 'lucide-react';

import roundDiamondImg from '@assets/diamonds/round.png';
import ovalDiamondImg from '@assets/diamonds/oval.png';
import princessDiamondImg from '@assets/diamonds/princess.png';
import pearDiamondImg from '@assets/diamonds/pear.png';
import cushionDiamondImg from '@assets/diamonds/cushion.png';
import emeraldDiamondImg from '@assets/diamonds/emerald.png';
import heartDiamondImg from '@assets/diamonds/heart.png';
import marquiseDiamondImg from '@assets/diamonds/marquise.png';

const FALLBACK_SHAPE_IMAGES = {
    round: roundDiamondImg,
    oval: ovalDiamondImg,
    princess: princessDiamondImg,
    pear: pearDiamondImg,
    cushion: cushionDiamondImg,
    emerald: emeraldDiamondImg,
    heart: heartDiamondImg,
    marquise: marquiseDiamondImg,
};

const DEFAULT_SHAPES = [
    {
        key: 'round',
        name: 'Round Brilliant',
        subtitle: 'Maximum Fire & Scintillation',
        image: roundDiamondImg,
        fallbackImage: roundDiamondImg,
        path: '/shop?metal=diamond&shape=round'
    },
    {
        key: 'oval',
        name: 'Oval Cut',
        subtitle: 'Elongated Elegance',
        image: ovalDiamondImg,
        fallbackImage: ovalDiamondImg,
        path: '/shop?metal=diamond&shape=oval'
    },
    {
        key: 'princess',
        name: 'Princess Cut',
        subtitle: 'Modern Geometric Sparkle',
        image: princessDiamondImg,
        fallbackImage: princessDiamondImg,
        path: '/shop?metal=diamond&shape=princess'
    },
    {
        key: 'pear',
        name: 'Pear Cut',
        subtitle: 'Graceful Teardrop Silhouette',
        image: pearDiamondImg,
        fallbackImage: pearDiamondImg,
        path: '/shop?metal=diamond&shape=pear'
    },
    {
        key: 'cushion',
        name: 'Cushion Cut',
        subtitle: 'Romantic Pillow Softness',
        image: cushionDiamondImg,
        fallbackImage: cushionDiamondImg,
        path: '/shop?metal=diamond&shape=cushion'
    },
    {
        key: 'emerald',
        name: 'Emerald Cut',
        subtitle: 'Sophisticated Step-cut Hall of Mirrors',
        image: emeraldDiamondImg,
        fallbackImage: emeraldDiamondImg,
        path: '/shop?metal=diamond&shape=emerald'
    },
    {
        key: 'heart',
        name: 'Heart Cut',
        subtitle: 'Symbol of Everlasting Devotion',
        image: heartDiamondImg,
        fallbackImage: heartDiamondImg,
        path: '/shop?metal=diamond&shape=heart'
    },
    {
        key: 'marquise',
        name: 'Marquise Cut',
        subtitle: 'Regal Boat-Shaped Carat Presence',
        image: marquiseDiamondImg,
        fallbackImage: marquiseDiamondImg,
        path: '/shop?metal=diamond&shape=marquise'
    },
];

const DiamondShapeSelector = ({ sectionData, selectedShape = null, onSelectShape = null }) => {
    const navigate = useNavigate();
    const scrollContainerRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const settings = sectionData?.settings || {};
    const title = settings.title || 'Discover Your Signature Cut';
    const subtitle = settings.subtitle || 'Each facet geometry reflects light with a unique character and brilliance';
    const badge = settings.badge || 'CUT & SILHOUETTE';

    const shapes = Array.isArray(sectionData?.items) && sectionData.items.length > 0
        ? sectionData.items.map((item, idx) => {
            const fallback = DEFAULT_SHAPES[idx] || DEFAULT_SHAPES[0];
            const rawKey = (item.itemId || item.id || item.name || item.key || '').toLowerCase().replace(/cut|brilliant|shape|\s|-|_/g, '');
            const shapeKey = Object.keys(FALLBACK_SHAPE_IMAGES).find(k => rawKey.includes(k)) || fallback.key;
            const fallbackImg = FALLBACK_SHAPE_IMAGES[shapeKey] || fallback.image;
            const hasCustomImage = typeof item.image === 'string' && item.image.trim().length > 0 && !item.image.includes('placeholder');
            return {
                key: shapeKey,
                name: item.label || item.name || fallback.name,
                subtitle: item.tag || item.subtitle || fallback.subtitle,
                image: hasCustomImage ? item.image : fallbackImg,
                fallbackImage: fallbackImg,
                path: item.path || fallback.path
            };
        })
        : DEFAULT_SHAPES;

    const checkScrollButtons = () => {
        if (!scrollContainerRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
        setCanScrollLeft(scrollLeft > 10);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    };

    useEffect(() => {
        const el = scrollContainerRef.current;
        if (!el) return;
        checkScrollButtons();
        el.addEventListener('scroll', checkScrollButtons, { passive: true });
        window.addEventListener('resize', checkScrollButtons);
        return () => {
            el.removeEventListener('scroll', checkScrollButtons);
            window.removeEventListener('resize', checkScrollButtons);
        };
    }, [shapes]);

    const scroll = (direction) => {
        if (!scrollContainerRef.current) return;
        const scrollAmount = direction === 'left' ? -260 : 260;
        scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    };

    const handleCardClick = (shape, isSelected) => {
        if (onSelectShape) {
            onSelectShape(isSelected ? null : shape.key);
        } else {
            navigate(shape.path);
        }
    };

    return (
        <section className="py-12 sm:py-16 md:py-20 bg-[#FAF8F4] border-b border-[#E8DFD1] overflow-hidden">
            <div className="max-w-[1460px] mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* ── Section Header ────────────────────────────────────── */}
                <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
                    {/* Top Diamond Emblem */}
                    <div className="flex items-center justify-center gap-3 mb-2.5">
                        <span className="h-[1px] w-10 sm:w-14 bg-gradient-to-r from-transparent to-[#C59B27]/70" />
                        <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#C59B27]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="6 3 18 3 22 9 12 22 2 9" />
                        </svg>
                        <span className="h-[1px] w-10 sm:w-14 bg-gradient-to-l from-transparent to-[#C59B27]/70" />
                    </div>

                    {/* Badge / Category Label */}
                    <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.26em] text-[#8C7A68] block mb-2 font-sans">
                        {badge}
                    </span>

                    {/* Main Title */}
                    <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-[42px] text-[#141211] font-normal tracking-tight leading-tight mb-2.5">
                        {title}
                    </h2>

                    {/* Subtitle */}
                    <p className="text-xs sm:text-sm md:text-[15px] text-[#6B6156] font-light leading-relaxed max-w-2xl mx-auto">
                        {subtitle}
                    </p>
                </div>

                {/* ── Carousel with Navigation Controls ─────────────────── */}
                <div className="relative group/carousel px-1 sm:px-2">
                    
                    {/* Left Scroll Button */}
                    {canScrollLeft && (
                        <button
                            type="button"
                            onClick={() => scroll('left')}
                            aria-label="Scroll left"
                            className="absolute -left-1 sm:-left-3 lg:-left-5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/95 backdrop-blur-sm shadow-[0_6px_20px_rgba(0,0,0,0.1)] border border-[#E8DFD0] flex items-center justify-center text-[#141211] hover:text-[#C59B27] hover:border-[#C59B27] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
                        >
                            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                    )}

                    {/* Right Scroll Button */}
                    {canScrollRight && (
                        <button
                            type="button"
                            onClick={() => scroll('right')}
                            aria-label="Scroll right"
                            className="absolute -right-1 sm:-right-3 lg:-right-5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/95 backdrop-blur-sm shadow-[0_6px_20px_rgba(0,0,0,0.1)] border border-[#E8DFD0] flex items-center justify-center text-[#141211] hover:text-[#C59B27] hover:border-[#C59B27] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
                        >
                            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                    )}

                    {/* Card Track */}
                    <div
                        ref={scrollContainerRef}
                        className="flex items-stretch gap-3 sm:gap-3.5 md:gap-4 overflow-x-auto no-scrollbar scroll-smooth py-5 px-1 sm:px-2 snap-x snap-mandatory overscroll-x-contain lg:justify-between"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {shapes.map((shape) => {
                            const isSelected = selectedShape === shape.key;

                            return (
                                <div
                                    key={shape.key}
                                    onClick={() => handleCardClick(shape, isSelected)}
                                    className={`group relative flex flex-col justify-between bg-white rounded-2xl p-2 sm:p-2.5 pb-3.5 border transition-all duration-300 ease-out cursor-pointer select-none text-center snap-start w-[140px] sm:w-[152px] md:w-[160px] lg:w-[calc((100%-7*14px)/8)] min-w-[134px] max-w-[172px] shrink-0 ${
                                        isSelected
                                            ? 'border-[#C59B27] shadow-[0_14px_30px_rgba(197,155,39,0.22)] scale-[1.04] -translate-y-1 ring-1 ring-[#C59B27]/40'
                                            : 'border-[#EBE3D5] hover:border-[#C59B27] hover:shadow-[0_14px_30px_rgba(197,155,39,0.18)] hover:scale-[1.04] hover:-translate-y-1'
                                    }`}
                                >
                                    {/* 1. Diamond Image Container */}
                                    <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-[#F7EFE6] flex items-center justify-center shadow-inner">
                                        <img
                                            src={shape.image}
                                            alt={`${shape.name} Diamond Cut`}
                                            loading="lazy"
                                            onError={(e) => {
                                                e.currentTarget.onerror = null;
                                                e.currentTarget.src = shape.fallbackImage || roundDiamondImg;
                                            }}
                                            className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-115 transform-gpu"
                                        />

                                        {/* Magnifier Glass Overlay Icon (Reveals smoothly on hover) */}
                                        <div className="absolute top-2 right-2 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#8A6A24]/75 backdrop-blur-xs text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100 border border-white/40 shadow-xs pointer-events-none">
                                            <Search className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" strokeWidth={2.2} />
                                        </div>
                                    </div>

                                    {/* 2. Shape Info */}
                                    <div className="flex-1 flex flex-col justify-between pt-2.5 sm:pt-3">
                                        <div>
                                            <h3 className="font-serif text-[13px] sm:text-[14px] font-bold text-[#141211] group-hover:text-[#9E7820] transition-colors duration-300 tracking-tight leading-snug">
                                                {shape.name}
                                            </h3>
                                            <p className="text-[10px] sm:text-[11px] text-[#7A7065] font-normal leading-snug px-0.5 mt-1 min-h-[28px] sm:min-h-[32px] flex items-center justify-center line-clamp-2">
                                                {shape.subtitle}
                                            </p>
                                        </div>

                                        {/* 3. Action Circle Button */}
                                        <div className="mt-2.5 flex items-center justify-center">
                                            <div
                                                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                                                    isSelected
                                                        ? 'bg-[#C59B27] text-white shadow-xs'
                                                        : 'bg-[#F4EDE2] text-[#8C7D6B] group-hover:bg-[#C59B27] group-hover:text-white group-hover:shadow-xs group-hover:translate-x-0.5'
                                                }`}
                                            >
                                                <ArrowRight className="w-3 h-3 transition-transform duration-300" strokeWidth={2.2} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── Section Footer: CTA & Note ────────────────────────── */}
                <div className="mt-8 sm:mt-12 text-center flex flex-col items-center">
                    {/* View All Diamond Shapes in Store Button */}
                    <Link
                        to="/shop?metal=diamond"
                        className="inline-flex items-center gap-2.5 px-6 sm:px-8 py-2.5 sm:py-3 rounded-full border border-[#C59B27] bg-white text-[#141211] hover:bg-[#141211] hover:text-[#E8D198] hover:border-[#141211] text-[11px] sm:text-xs font-bold uppercase tracking-[0.18em] transition-all duration-300 shadow-sm hover:shadow-md group"
                    >
                        <span>View All Diamond Shapes in Store</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#C59B27] group-hover:text-[#E8D198] group-hover:translate-x-1 transition-transform" />
                    </Link>

                    {/* Bottom Subtitle Note */}
                    <p className="text-xs sm:text-[13px] text-[#786E65] font-light tracking-wide mt-3">
                        From timeless classics to rare silhouettes, find the cut that reflects you.
                    </p>
                </div>

            </div>
        </section>
    );
};

export default DiamondShapeSelector;
