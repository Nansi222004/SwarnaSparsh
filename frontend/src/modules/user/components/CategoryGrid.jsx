import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useHomepageCms } from '../hooks/useHomepageCms';
import { useShop } from '../../../context/ShopContext';
import { resolveLegacyCmsAsset } from '../utils/legacyCmsAssets';

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
    return resolveLegacyCmsAsset(rawImage, rawImage);
};

const normalizeItems = (items = [], liveCategories = []) => items
    .filter((item) => Boolean(item?.name && item?.path))
    .map((item, index) => ({
        id: item.itemId || item.id || `category-grid-item-${index + 1}`,
        name: item.name,
        image: resolveItemImage(item, liveCategories),
        path: item.path,
        badge: item.badge || ''
    }));

const CategoryGrid = () => {
    const scrollRef = useRef(null);
    const { data: homepageSections = {}, isLoading: isCmsLoading } = useHomepageCms();
    const { categories: liveCategories = [], isLoading: isShopLoading } = useShop();
    const sectionData = homepageSections?.['category-grid'];
    const [activeIndex, setActiveIndex] = useState(0);
    const [totalDots, setTotalDots] = useState(0);

    const categories = useMemo(() => {
        const rawItems = sectionData?.items || [];
        if (rawItems.length > 0) {
            return normalizeItems(rawItems, liveCategories);
        }
        if (liveCategories.length > 0) {
            return liveCategories.map((cat, idx) => ({
                id: cat._id || cat.id || `live-cat-${idx}`,
                name: cat.name,
                image: cat.image || '',
                path: `/category/${cat.slug || cat.path || ''}`,
                badge: ''
            })).filter(c => Boolean(c.name && c.image));
        }
        return [];
    }, [sectionData?.items, liveCategories]);

    useEffect(() => {
        const updateDots = () => {
            if (scrollRef.current) {
                const { scrollWidth, clientWidth } = scrollRef.current;
                const pages = Math.ceil(scrollWidth / clientWidth);
                setTotalDots(pages > 1 ? pages : 0);
            }
        };
        // Small timeout to ensure DOM is fully rendered before calculating width
        const timer = setTimeout(updateDots, 100);
        window.addEventListener('resize', updateDots);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', updateDots);
        };
    }, [categories]);

    const handleScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, clientWidth } = scrollRef.current;
            const index = Math.round(scrollLeft / clientWidth);
            setActiveIndex(index);
        }
    };

    if ((isCmsLoading && !sectionData) || (categories.length === 0 && (isCmsLoading || isShopLoading))) {
        return (
            <div className="w-full bg-white py-3 md:py-6 relative">
                <div className="container mx-auto px-4">
                    <div className="flex overflow-x-auto scrollbar-hide gap-4 md:gap-7 pb-2 md:pb-4 px-1 md:px-2">
                        {[1, 2, 3, 4, 5, 6].map((idx) => (
                            <div
                                key={idx}
                                className="flex flex-col shrink-0 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden w-[120px] md:w-[160px] animate-pulse"
                            >
                                <div className="w-full aspect-square bg-gray-100 flex items-center justify-center">
                                    <div className="w-8 h-8 rounded-full bg-gray-200/60" />
                                </div>
                                <div className="p-3 bg-white border-t border-gray-50 flex items-center justify-center">
                                    <div className="h-3 w-16 bg-gray-200/80 rounded-full" />
                                </div>
                            </div>
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
        <div className="w-full bg-[#FAF8F5]/60 py-4 md:py-8 relative group border-y border-[#E8DFD0]/40">
            <div className="container mx-auto px-4 relative">
                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="flex overflow-x-auto scrollbar-hide gap-4 md:gap-6 pb-2 md:pb-4 px-1 snap-x snap-mandatory"
                >
                    {categories.map((category, index) => (
                        <Link
                            key={category.id}
                            to={category.path}
                            className="flex flex-col group/item cursor-pointer shrink-0 snap-start bg-white rounded-2xl shadow-sm hover:shadow-xl hover:shadow-[#C59B27]/10 border border-[#E8DFD0] hover:border-[#C59B27] overflow-hidden w-[125px] sm:w-[145px] md:w-[170px] transition-all duration-400 ease-out"
                        >
                            <div className="relative w-full aspect-square overflow-hidden bg-stone-100">
                                <img
                                    src={category.image}
                                    alt={category.name}
                                    loading={index < 4 ? 'eager' : 'lazy'}
                                    decoding={index < 4 ? 'sync' : 'async'}
                                    className="w-full h-full object-cover group-hover/item:scale-108 transition-transform duration-700 ease-out"
                                />
                                {category.badge ? (
                                    <div className="absolute top-2 right-2 bg-gradient-to-r from-[#C59B27] to-[#DFB750] text-[#141211] text-[8px] md:text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md uppercase font-bold tracking-wider z-20">
                                        <span>✦</span>
                                        {category.badge}
                                    </div>
                                ) : null}

                                {/* Sliding Button Overlay */}
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#141211] via-[#1C1917]/95 to-transparent pt-6 pb-2.5 md:pb-3 transform translate-y-full group-hover/item:translate-y-0 transition-transform duration-400 ease-in-out flex items-center justify-center z-10">
                                    <span className="text-[9px] md:text-[10px] font-bold text-[#E8D198] uppercase tracking-[0.2em] flex items-center gap-1">
                                        Explore <ChevronRight className="w-3 h-3 text-[#C59B27]" />
                                    </span>
                                </div>
                            </div>
                            <div className="p-3 text-center bg-white border-t border-[#E8DFD0]/60">
                                <span className="text-[12px] md:text-[14px] font-semibold text-stone-800 group-hover/item:text-[#C59B27] transition-colors tracking-tight line-clamp-1">
                                    {category.name}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Pagination Dots */}
                {totalDots > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-4 md:mt-5">
                        {Array.from({ length: totalDots }).map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => {
                                    if (scrollRef.current) {
                                        scrollRef.current.scrollTo({
                                            left: idx * scrollRef.current.clientWidth,
                                            behavior: 'smooth'
                                        });
                                    }
                                }}
                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                    idx === activeIndex 
                                        ? 'w-6 bg-[#C59B27]' 
                                        : 'w-2 bg-stone-300 hover:bg-[#C59B27]/50'
                                }`}
                                aria-label={`Go to slide ${idx + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CategoryGrid;
