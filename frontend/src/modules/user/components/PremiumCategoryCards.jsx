import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import womenImg from '@assets/cat_women_portrait_new.jpg';
import menImg from '@assets/cat_men_premium.png';
import giftingImg from '@assets/gifting_still_life.jpg';

const FOR_HER_DATA = {
    badge: 'FOR HER • TIMELESS CHARM',
    title: 'For Her',
    description: 'Brilliant solitaires, teardrop pendants & delicate necklaces.',
    cta: 'SHOP FOR HER',
    path: '/category/women',
    image: womenImg,
    chips: [
        { label: 'Earrings', path: '/shop?category=earrings' },
        { label: 'Pendants', path: '/shop?category=pendants' },
        { label: 'Necklaces', path: '/shop?category=necklaces' }
    ]
};

const FOR_HIM_DATA = {
    badge: 'FOR HIM • CURATED STATEMENT',
    title: 'For Him',
    description: 'Handcrafted signet rings, curb chains & statement kadas.',
    cta: 'SHOP FOR HIM',
    path: '/category/men',
    image: menImg,
    chips: [
        { label: 'Chains', path: '/shop?category=chains' },
        { label: 'Rings', path: '/shop?category=rings' },
        { label: 'Bracelets', path: '/shop?category=bracelets' }
    ]
};

const GIFTING_DATA = {
    badge: 'THE ART OF GIVING',
    title: 'Curated Couple Bands & Sets',
    description: 'Matching hallmark 925 silver pairs with luxury keepsake packaging.',
    cta: 'EXPLORE GIFTING',
    path: '/shop?category=rings',
    image: giftingImg
};

const PremiumCategoryCards = () => {
    const navigate = useNavigate();
    const containerRef = useRef(null);
    const isInView = useInView(containerRef, { once: true, margin: '-40px' });

    return (
        <section
            ref={containerRef}
            className="py-10 md:py-14 lg:py-16 bg-[#FAF9F5] overflow-hidden border-b border-stone-200/60 font-sans"
        >
            <div className="container mx-auto px-4 max-w-[1240px]">
                {/* 1. Section Header */}
                <div className="flex flex-col items-center mb-6 md:mb-10 text-center">
                    <motion.span
                        initial={{ opacity: 0, y: 8 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.5 }}
                        className="text-[10px] md:text-[11px] font-bold tracking-[0.35em] text-[#C59B27] uppercase mb-2 block"
                    >
                        GIFT THE EXCELLENCE
                    </motion.span>

                    <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.5, delay: 0.08 }}
                        className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.5rem] font-serif text-stone-900 tracking-tight leading-tight mb-2.5"
                    >
                        Shop by <span className="italic font-light text-[#C59B27]">Recipient</span>
                    </motion.h2>

                    <motion.div
                        initial={{ opacity: 0, scaleX: 0 }}
                        animate={isInView ? { opacity: 1, scaleX: 1 } : {}}
                        transition={{ duration: 0.5, delay: 0.15 }}
                        className="w-10 h-[1.5px] bg-[#C59B27] rounded-full"
                    />
                </div>

                {/* 2. Asymmetrical Editorial Composition */}
                <div className="flex flex-col lg:flex-row gap-5 lg:gap-6 items-stretch">
                    
                    {/* 3. For Her Feature Card (60–65% width on Desktop) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        onClick={() => navigate(FOR_HER_DATA.path)}
                        className="w-full lg:w-[62%] relative rounded-2xl md:rounded-3xl overflow-hidden cursor-pointer group bg-stone-900 border border-stone-200/70 hover:border-[#C59B27]/60 shadow-sm hover:shadow-xl transition-all duration-500 h-[380px] sm:h-[430px] md:h-[460px] lg:h-[510px] flex flex-col justify-between p-5 md:p-7"
                    >
                        {/* Background Image */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            <img
                                src={FOR_HER_DATA.image}
                                alt={FOR_HER_DATA.title}
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-cover object-[center_20%] transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                            />
                            {/* Cinematic Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/30 to-transparent opacity-95 transition-opacity duration-500 group-hover:opacity-90" />
                            <div className="absolute inset-0 bg-[#C59B27]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 mix-blend-overlay" />
                        </div>

                        {/* Top Bar: Floating Glass Badge */}
                        <div className="relative z-10 flex items-center justify-between w-full">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/35 backdrop-blur-md border border-white/20 text-[#FAF8F5] text-[9px] md:text-[10px] font-medium tracking-[0.22em] uppercase shadow-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#C59B27]" />
                                <span>{FOR_HER_DATA.badge}</span>
                            </div>
                        </div>

                        {/* Bottom Content Area */}
                        <div className="relative z-10">
                            <h3 className="font-serif text-3xl sm:text-4xl md:text-5xl text-white font-normal tracking-tight mb-2 drop-shadow-sm leading-tight">
                                {FOR_HER_DATA.title}
                            </h3>

                            <p className="text-stone-200/95 text-xs sm:text-sm font-light leading-relaxed mb-4 max-w-[440px]">
                                {FOR_HER_DATA.description}
                            </p>

                            {/* Primary CTA & Refined Category Shortcut Buttons */}
                            <div className="flex flex-wrap items-center gap-3 md:gap-4">
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(FOR_HER_DATA.path);
                                    }}
                                    className="inline-flex items-center gap-2 px-4 py-2 md:px-5 md:py-2.5 rounded-full bg-white text-stone-900 hover:bg-[#C59B27] hover:text-white text-[10.5px] md:text-xs font-semibold tracking-[0.14em] uppercase transition-all duration-300 shadow-sm group-hover:shadow-md group/btn"
                                >
                                    <span>{FOR_HER_DATA.cta}</span>
                                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover/btn:translate-x-1" />
                                </button>

                                {/* Refined, Minimal Category Shortcuts */}
                                <div className="flex items-center gap-2">
                                    {FOR_HER_DATA.chips.map((chip) => (
                                        <button
                                            key={chip.label}
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(chip.path);
                                            }}
                                            className="px-3 py-1 text-[11px] font-sans tracking-wide rounded-full border border-white/25 hover:border-[#C59B27] bg-black/25 hover:bg-black/45 text-stone-200 hover:text-[#C59B27] backdrop-blur-xs transition-all duration-300 cursor-pointer"
                                        >
                                            {chip.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* 4. Right Stacked Area (35–40% width on Desktop) */}
                    <div className="w-full lg:w-[38%] flex flex-col justify-between gap-4 lg:gap-5">
                        
                        {/* For Him Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            onClick={() => navigate(FOR_HIM_DATA.path)}
                            className="relative rounded-2xl md:rounded-3xl overflow-hidden cursor-pointer group bg-stone-900 border border-stone-200/70 hover:border-[#C59B27]/60 shadow-sm hover:shadow-xl transition-all duration-500 flex-1 min-h-[260px] sm:min-h-[280px] lg:min-h-[300px] flex flex-col justify-between p-5"
                        >
                            {/* Background Image */}
                            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                <img
                                    src={FOR_HIM_DATA.image}
                                    alt={FOR_HIM_DATA.title}
                                    loading="lazy"
                                    decoding="async"
                                    className="w-full h-full object-cover object-[center_18%] transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                                />
                                {/* Cinematic Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/35 to-stone-950/10 opacity-95 transition-opacity duration-500 group-hover:opacity-90" />
                                <div className="absolute inset-0 bg-[#C59B27]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 mix-blend-overlay" />
                            </div>

                            {/* Top Bar: Floating Glass Badge */}
                            <div className="relative z-10 flex items-center justify-between w-full">
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/35 backdrop-blur-md border border-white/20 text-[#FAF8F5] text-[9px] md:text-[9.5px] font-medium tracking-[0.22em] uppercase shadow-sm">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#C59B27]" />
                                    <span>{FOR_HIM_DATA.badge}</span>
                                </div>
                            </div>

                            {/* Bottom Content Area */}
                            <div className="relative z-10">
                                <h3 className="font-serif text-2xl sm:text-3xl text-white font-normal tracking-tight mb-1.5 drop-shadow-sm leading-tight">
                                    {FOR_HIM_DATA.title}
                                </h3>

                                <p className="text-stone-200/95 text-xs font-light leading-relaxed mb-3 max-w-[340px]">
                                    {FOR_HIM_DATA.description}
                                </p>

                                {/* Primary CTA & Category Shortcut Buttons */}
                                <div className="flex flex-wrap items-center gap-2.5">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(FOR_HIM_DATA.path);
                                        }}
                                        className="inline-flex items-center gap-2 px-3.5 py-1.5 md:px-4 md:py-2 rounded-full bg-white text-stone-900 hover:bg-[#C59B27] hover:text-white text-[10.5px] md:text-[11px] font-semibold tracking-[0.14em] uppercase transition-all duration-300 shadow-sm group-hover:shadow-md group/btn"
                                    >
                                        <span>{FOR_HIM_DATA.cta}</span>
                                        <ArrowRight className="w-3 h-3 transition-transform duration-300 group-hover/btn:translate-x-1" />
                                    </button>

                                    {/* Refined Category Shortcuts */}
                                    <div className="flex items-center gap-1.5">
                                        {FOR_HIM_DATA.chips.map((chip) => (
                                            <button
                                                key={chip.label}
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(chip.path);
                                                }}
                                                className="px-2.5 py-0.5 text-[10.5px] font-sans tracking-wide rounded-full border border-white/25 hover:border-[#C59B27] bg-black/25 hover:bg-black/45 text-stone-200 hover:text-[#C59B27] backdrop-blur-xs transition-all duration-300 cursor-pointer"
                                            >
                                                {chip.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Complementary Editorial Jewellery / Gifting Visual Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.6, delay: 0.25 }}
                            onClick={() => navigate(GIFTING_DATA.path)}
                            className="relative rounded-2xl md:rounded-3xl overflow-hidden cursor-pointer group bg-stone-950 border border-stone-200/70 hover:border-[#C59B27]/60 shadow-sm hover:shadow-xl transition-all duration-500 h-[150px] lg:h-[180px] flex flex-col justify-between p-4 md:p-5"
                        >
                            {/* Background Image */}
                            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                <img
                                    src={GIFTING_DATA.image}
                                    alt={GIFTING_DATA.title}
                                    loading="lazy"
                                    decoding="async"
                                    className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                                />
                                {/* Rich Editorial Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-r from-stone-950/95 via-stone-950/75 to-stone-950/40 opacity-95 transition-opacity duration-500 group-hover:opacity-90" />
                                <div className="absolute inset-0 bg-[#C59B27]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 mix-blend-overlay" />
                            </div>

                            {/* Top Badge */}
                            <div className="relative z-10 flex items-center justify-between">
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-[#C59B27] text-[8.5px] md:text-[9px] font-semibold tracking-[0.2em] uppercase">
                                    <Sparkles className="w-2.5 h-2.5 text-[#C59B27]" />
                                    <span>{GIFTING_DATA.badge}</span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="relative z-10">
                                <h4 className="font-serif text-lg sm:text-xl text-white font-normal tracking-tight mb-1 leading-snug">
                                    {GIFTING_DATA.title}
                                </h4>
                                <p className="text-stone-300 text-[11px] md:text-xs font-light leading-normal line-clamp-1 mb-2.5">
                                    {GIFTING_DATA.description}
                                </p>

                                <div className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold tracking-[0.14em] uppercase text-white group-hover:text-[#C59B27] transition-colors">
                                    <span>{GIFTING_DATA.cta}</span>
                                    <ArrowRight className="w-3 h-3 transition-transform duration-300 group-hover:translate-x-1" />
                                </div>
                            </div>
                        </motion.div>

                    </div>
                </div>
            </div>
        </section>
    );
};

export default PremiumCategoryCards;
