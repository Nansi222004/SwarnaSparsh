import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Sparkles } from 'lucide-react';
import { useHomepageCms } from '../hooks/useHomepageCms';
import { useShop } from '../../../context/ShopContext';
import { resolveLegacyCmsAsset } from '../utils/legacyCmsAssets';
import { getCategoryFallback, handleImageError } from '../../../utils/imageFallbacks';

const resolveItemImage = (item, liveCategories = []) => {
    const rawImage = String(item?.image || '').trim();

    // 1. If it's an explicitly uploaded remote/Cloudinary image on the section item, use it
    if (
        /^(https?:)?\/\//i.test(rawImage) ||
        rawImage.startsWith('data:') ||
        rawImage.startsWith('blob:') ||
        rawImage.startsWith('/uploads/') ||
        rawImage.startsWith('/media/')
    ) {
        return rawImage;
    }

    // 2. Try to match live Category database record from Admin -> Categories
    const categoryId = item?.categoryId || item?.id;
    const itemName = String(item?.name || '').trim().toLowerCase();
    const itemPath = String(item?.path || '').trim().toLowerCase();

    const matched = liveCategories.find((cat) => {
        if (!cat) return false;
        if (categoryId && String(cat._id || cat.id) === String(categoryId)) return true;
        if (cat.name && String(cat.name).trim().toLowerCase() === itemName) return true;
        if (cat.slug && itemPath.includes(String(cat.slug).trim().toLowerCase())) return true;
        return false;
    });

    if (matched?.image && /^(https?:)?\/\//i.test(matched.image)) {
        return matched.image;
    }

    // 3. Fallback to legacy asset map or raw image
    const resolved = resolveLegacyCmsAsset(rawImage, rawImage);
    return resolved || getCategoryFallback(item);
};

const normalizeItems = (items = [], liveCategories = []) => items
    .filter((item) => Boolean(item?.name && item?.path))
    .map((item, index) => {
        const fallback = getCategoryFallback(item);
        const resolvedImg = resolveItemImage(item, liveCategories);
        return {
            id: item.itemId || item.id || `category-grid-item-${index + 1}`,
            name: item.name,
            image: resolvedImg || fallback,
            fallbackImage: fallback,
            path: item.path,
            badge: item.badge || ''
        };
    });

const CategoryGrid = () => {
    const scrollRef = useRef(null);
    const { data: homepageSections = {}, isLoading: isCmsLoading } = useHomepageCms();
    const { categories: liveCategories = [], isLoading: isShopLoading } = useShop();
    const sectionData = homepageSections?.['category-grid'];
    const [activeIndex, setActiveIndex] = useState(0);

    const categories = useMemo(() => {
        const rawItems = sectionData?.items || [];
        if (rawItems.length > 0) {
            return normalizeItems(rawItems, liveCategories);
        }
        if (liveCategories.length > 0) {
            return liveCategories.map((cat, idx) => {
                const fallback = getCategoryFallback(cat);
                return {
                    id: cat._id || cat.id || `live-cat-${idx}`,
                    name: cat.name,
                    image: cat.image || fallback,
                    fallbackImage: fallback,
                    path: `/category/${cat.slug || cat.path || ''}`,
                    badge: ''
                };
            }).filter(c => Boolean(c.name));
        }
        return [];
    }, [sectionData?.items, liveCategories]);

    const leadCategory = categories[0] || null;
    const supportingCategories = categories.slice(1);

    const handleScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, clientWidth } = scrollRef.current;
            const index = Math.round(scrollLeft / clientWidth);
            setActiveIndex(index);
        }
    };

    if ((isCmsLoading && !sectionData) || (categories.length === 0 && (isCmsLoading || isShopLoading))) {
        return (
            <div className="w-full bg-white py-6">
                <div className="container mx-auto px-4">
                    <div className="h-6 w-48 bg-stone-100 rounded-md mb-6 animate-pulse" />
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                        {[1, 2, 3, 4, 5, 6].map((idx) => (
                            <div key={idx} className="aspect-square bg-stone-100 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (categories.length === 0) {
        return null;
    }

    return (
        <section className="w-full bg-[#FAF8F5] py-8 md:py-16 border-y border-[#E8DFD0]/60 relative">
            <div className="container mx-auto px-4 md:px-8 max-w-[1440px]">
                {/* Section Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-12">
                    <div>
                        <div className="inline-flex items-center gap-2 mb-2 text-[#C59B27] text-[10px] uppercase font-bold tracking-[0.3em]">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Curated Dimensions</span>
                        </div>
                        <h2 className="font-serif text-2xl md:text-4xl text-[#141211] font-normal tracking-tight">
                            {sectionData?.label || 'Shop by Category'}
                        </h2>
                    </div>
                    <div className="hidden md:flex items-center gap-2 mt-3 md:mt-0">
                        <span className="text-stone-500 text-xs font-sans">
                            {categories.length} Handcrafted Categories
                        </span>
                        <div className="w-10 h-[1px] bg-[#C59B27]" />
                    </div>
                </div>

                {/* ── DESKTOP ASYMMETRIC / EDITORIAL COMPOSITION (lg+) ── */}
                <div className="hidden lg:grid lg:grid-cols-12 gap-6">
                    {/* Visual Lead Category (Left 4 columns, prominent portrait frame) */}
                    {leadCategory && (
                        <div className="lg:col-span-4">
                            <Link
                                to={leadCategory.path}
                                className="group block relative h-full min-h-[460px] rounded-3xl overflow-hidden bg-white border border-[#E8DFD0] hover:border-[#C59B27] shadow-sm hover:shadow-[0_20px_40px_rgba(20,18,17,0.12)] transition-all duration-500"
                            >
                                <img
                                    src={leadCategory.image}
                                    alt={leadCategory.name}
                                    loading="eager"
                                    decoding="async"
                                    onError={(e) => handleImageError(e, leadCategory.fallbackImage)}
                                    className="w-full h-full object-cover transition-transform duration-[1.6s] ease-out group-hover:scale-106"
                                />

                                {/* Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-[#141211] via-[#141211]/30 to-transparent z-10" />

                                {/* Badge */}
                                {leadCategory.badge ? (
                                    <div className="absolute top-4 left-4 z-20 bg-[#C59B27] text-[#141211] text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md">
                                        {leadCategory.badge}
                                    </div>
                                ) : (
                                    <div className="absolute top-4 left-4 z-20 bg-[#141211]/80 backdrop-blur-sm border border-[#C59B27]/40 text-[#E8D198] text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                                        Atelier Spotlight
                                    </div>
                                )}

                                {/* Bottom Info Panel */}
                                <div className="absolute bottom-6 inset-x-6 z-20 text-[#FAF8F5]">
                                    <span className="text-[10px] font-sans font-semibold uppercase tracking-[0.2em] text-[#E8D198] mb-1 block">
                                        Signature Collection
                                    </span>
                                    <h3 className="font-serif text-2xl lg:text-3xl font-medium tracking-tight mb-3">
                                        {leadCategory.name}
                                    </h3>
                                    <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-[#FAF8F5] group-hover:text-[#C59B27] transition-colors font-bold">
                                        <span>Explore Collection</span>
                                        <ChevronRight className="w-4 h-4 text-[#C59B27] transition-transform group-hover:translate-x-1" />
                                    </div>
                                </div>
                            </Link>
                        </div>
                    )}

                    {/* Supporting Categories (Right 8 columns, 2x3 or 2x4 grid) */}
                    <div className="lg:col-span-8 grid grid-cols-3 xl:grid-cols-4 gap-4">
                        {supportingCategories.slice(0, 8).map((cat) => (
                            <Link
                                key={cat.id}
                                to={cat.path}
                                className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-[#E8DFD0] hover:border-[#C59B27] shadow-xs hover:shadow-[0_12px_28px_rgba(20,18,17,0.08)] transition-all duration-400"
                            >
                                <div className="relative aspect-square overflow-hidden bg-stone-100">
                                    <img
                                        src={cat.image}
                                        alt={cat.name}
                                        loading="lazy"
                                        decoding="async"
                                        onError={(e) => handleImageError(e, cat.fallbackImage)}
                                        className="w-full h-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-108"
                                    />
                                    {cat.badge && (
                                        <span className="absolute top-2 right-2 bg-[#141211] text-[#E8D198] text-[8px] font-bold px-2 py-0.5 rounded-full z-10 border border-[#C59B27]/40">
                                            {cat.badge}
                                        </span>
                                    )}
                                </div>
                                <div className="p-3 text-center bg-white border-t border-[#E8DFD0]/40 flex items-center justify-between">
                                    <span className="text-xs font-serif font-medium text-[#141211] group-hover:text-[#C59B27] transition-colors line-clamp-1">
                                        {cat.name}
                                    </span>
                                    <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-[#C59B27] transition-all transform group-hover:translate-x-0.5 shrink-0" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* ── MOBILE & TABLET RESPONSIVE FLOW (< lg) ── */}
                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="flex lg:hidden overflow-x-auto scrollbar-hide gap-3.5 pb-2 snap-x snap-mandatory"
                >
                    {categories.map((category, index) => {
                        const isLead = index === 0;
                        return (
                            <Link
                                key={category.id}
                                to={category.path}
                                className={`group/item flex flex-col shrink-0 snap-start bg-white rounded-2xl border border-[#E8DFD0] hover:border-[#C59B27] overflow-hidden transition-all duration-300 ${
                                    isLead ? 'w-[170px] sm:w-[200px] border-[#C59B27]/60 shadow-sm' : 'w-[130px] sm:w-[150px]'
                                }`}
                            >
                                <div className="relative aspect-square overflow-hidden bg-stone-100">
                                    <img
                                        src={category.image}
                                        alt={category.name}
                                        loading={index < 3 ? 'eager' : 'lazy'}
                                        decoding="async"
                                        onError={(e) => handleImageError(e, category.fallbackImage)}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover/item:scale-106"
                                    />
                                    {isLead && (
                                        <div className="absolute top-2 left-2 bg-[#141211]/80 backdrop-blur-xs text-[#E8D198] text-[8px] font-bold px-2 py-0.5 rounded-full border border-[#C59B27]/40">
                                            Spotlight
                                        </div>
                                    )}
                                </div>
                                <div className="p-2.5 text-center bg-white border-t border-[#E8DFD0]/50">
                                    <span className="text-[11px] sm:text-xs font-serif font-medium text-[#141211] group-hover/item:text-[#C59B27] transition-colors line-clamp-1">
                                        {category.name}
                                    </span>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default CategoryGrid;
