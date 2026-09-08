import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useHomepageCms } from '../hooks/useHomepageCms';
import { resolveLegacyCmsAsset } from '../utils/legacyCmsAssets';
import { IMAGE_FALLBACKS, handleImageError } from '../../../utils/imageFallbacks';

const DynamicPromoBanner = () => {
    const { data: homepageSections = {} } = useHomepageCms();
    const sectionData = homepageSections?.['dynamic-promo-banner'];

    const bannerItems = useMemo(() => {
        const items = Array.isArray(sectionData?.items) ? sectionData.items : [];
        return items
            .filter((item) => Boolean(item?.image))
            .filter((item) => {
                const label = String(item.label || item.title || '').toLowerCase();
                return !label.includes('unique story in golds') && !label.includes('unique story in gold');
            })
            .map((item, index) => ({
                id: item.itemId || item.id || `dynamic-promo-${index + 1}`,
                image: resolveLegacyCmsAsset(item.image, item.image),
                mobileImage: item.mobileImage ? resolveLegacyCmsAsset(item.mobileImage, item.mobileImage) : null,
                link: item.path || '/shop',
                title: item.label || 'Timeless Indian Elegance',
                name: item.name || '',
                tag: item.tag || 'Atelier Collection',
                subtitle: item.subtitle || 'Handcrafted heirlooms designed for life’s most cherished celebrations.',
                ctaLabel: item.ctaLabel || 'Explore Atelier'
            }));
    }, [sectionData?.items]);

    const [currentIndex, setCurrentIndex] = useState(0);
    const autoplayMs = Number(sectionData?.settings?.autoplayMs) || 5000;

    useEffect(() => {
        if (bannerItems.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % bannerItems.length);
        }, autoplayMs);
        return () => clearInterval(timer);
    }, [autoplayMs, bannerItems.length]);

    useEffect(() => {
        if (currentIndex >= bannerItems.length) {
            setCurrentIndex(0);
        }
    }, [currentIndex, bannerItems.length]);

    if (bannerItems.length === 0) {
        return null;
    }

    const renderBannerSlide = (banner) => {
        return (
            <Link to={banner.link} className="block w-full group focus:outline-none">
                {/* ── DESKTOP EDITORIAL COMPOSITION (md+) ── */}
                <div className="hidden md:grid md:grid-cols-12 w-full min-h-[440px] lg:min-h-[500px] bg-[#141211] rounded-3xl overflow-hidden border border-[#C59B27]/30 shadow-2xl relative">
                    {/* Left Wing: Editorial Typography & Copy */}
                    <div className="md:col-span-6 lg:col-span-5 flex flex-col justify-between p-8 lg:p-14 z-10 relative bg-gradient-to-r from-[#141211] via-[#1A1816] to-[#141211]">
                        {/* Eyebrow & Brand Tag */}
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full bg-[#C59B27]/10 border border-[#C59B27]/30 text-[#E8D198] text-[10px] uppercase font-bold tracking-[0.25em]">
                                <Sparkles className="w-3 h-3 text-[#C59B27]" />
                                <span>{banner.tag || 'Swarna Sparsh Atelier'}</span>
                            </div>

                            {/* Headline */}
                            <h1 className="font-serif text-3xl lg:text-5xl text-[#FAF8F5] font-normal tracking-tight leading-[1.12]">
                                {banner.title}
                            </h1>

                            {/* Gold Divider Rule */}
                            <div className="w-16 h-[2px] bg-gradient-to-r from-[#C59B27] to-transparent" />

                            {/* Subtitle */}
                            {banner.subtitle && (
                                <p className="text-stone-300 font-sans text-sm lg:text-base font-light leading-relaxed max-w-md pt-2">
                                    {banner.subtitle}
                                </p>
                            )}
                        </div>

                        {/* CTA Button */}
                        <div className="pt-8">
                            <span className="inline-flex items-center gap-3 bg-gradient-to-r from-[#C59B27] via-[#D8AD38] to-[#C59B27] text-[#141211] font-sans font-bold text-xs uppercase tracking-[0.18em] px-8 py-4 rounded-full shadow-[0_8px_24px_rgba(197,155,39,0.25)] transition-all duration-300 group-hover:shadow-[0_12px_32px_rgba(197,155,39,0.4)] group-hover:scale-[1.02]">
                                <span>{banner.ctaLabel}</span>
                                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                            </span>
                        </div>
                    </div>

                    {/* Right Wing: Large Editorial Jewellery Image */}
                    <div className="md:col-span-6 lg:col-span-7 relative overflow-hidden bg-stone-900">
                        <img
                            src={banner.image}
                            alt={banner.title}
                            loading="eager"
                            decoding="async"
                            onError={(e) => handleImageError(e, IMAGE_FALLBACKS.editorial)}
                            className="w-full h-full object-cover object-center transition-transform duration-[1.8s] ease-out group-hover:scale-105"
                        />
                        {/* Refined gradient overlay at junction */}
                        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#141211] to-transparent pointer-events-none" />
                        <div className="absolute inset-0 border-l border-[#C59B27]/20 pointer-events-none" />
                    </div>
                </div>

                {/* ── MOBILE EDITORIAL COMPOSITION (< md) ── */}
                <div className="block md:hidden w-full bg-[#141211] overflow-hidden rounded-2xl border border-[#C59B27]/30 shadow-lg">
                    {/* Visual Banner */}
                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-stone-900">
                        <img
                            src={banner.mobileImage || banner.image}
                            alt={banner.title}
                            loading="eager"
                            decoding="async"
                            onError={(e) => handleImageError(e, IMAGE_FALLBACKS.editorial)}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#141211] via-black/20 to-transparent" />
                        
                        {banner.tag && (
                            <div className="absolute top-3 left-3 bg-[#141211]/85 backdrop-blur-sm border border-[#C59B27]/40 px-2.5 py-0.5 rounded-full text-[#E8D198] text-[9px] font-bold uppercase tracking-wider">
                                {banner.tag}
                            </div>
                        )}
                    </div>

                    {/* Content Box below image for optimal mobile readability */}
                    <div className="p-5 flex flex-col items-start gap-2 bg-[#141211]">
                        <h2 className="font-serif text-xl sm:text-2xl text-[#FAF8F5] font-normal leading-snug tracking-tight">
                            {banner.title}
                        </h2>

                        {banner.subtitle && (
                            <p className="text-stone-300 text-xs font-light leading-relaxed line-clamp-2">
                                {banner.subtitle}
                            </p>
                        )}

                        <div className="w-full pt-3">
                            <span className="w-full inline-flex items-center justify-center gap-2 bg-[#C59B27] text-[#141211] font-bold text-xs uppercase tracking-wider py-3 rounded-xl shadow-md">
                                <span>{banner.ctaLabel}</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </span>
                        </div>
                    </div>
                </div>
            </Link>
        );
    };

    const activeBanner = bannerItems[currentIndex] || bannerItems[0];

    return (
        <section className="w-full bg-white py-3 md:py-6 relative">
            <div className="container mx-auto px-3 md:px-6 max-w-[1440px]">
                <div className="relative">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentIndex}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.6 }}
                            className="w-full"
                        >
                            {renderBannerSlide(activeBanner)}
                        </motion.div>
                    </AnimatePresence>

                    {/* Elegant Slide Indicators (When multiple slides exist) */}
                    {bannerItems.length > 1 && (
                        <div className="absolute bottom-3 md:bottom-6 right-6 md:right-10 flex items-center gap-2 z-20">
                            {bannerItems.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentIndex(i)}
                                    className={`h-1.5 transition-all duration-400 rounded-full ${
                                        i === currentIndex
                                            ? 'w-8 bg-[#C59B27]'
                                            : 'w-2 bg-white/40 hover:bg-white/70'
                                    }`}
                                    aria-label={`Slide ${i + 1}`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default DynamicPromoBanner;
