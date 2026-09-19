import React, { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Sparkles } from 'lucide-react';
import { useHomepageCms } from '../hooks/useHomepageCms';
import { useShop } from '../../../context/ShopContext';
import { resolveLegacyCmsAsset } from '../utils/legacyCmsAssets';
import { getCategoryFallback, handleImageError } from '../../../utils/imageFallbacks';
import GoldShopByColourPanel from './GoldShopByColourPanel';
import SilverShopByTypePanel from './SilverShopByTypePanel';
import DiamondShopByTypePanel from './DiamondShopByTypePanel';

const resolveItemImage = (item, liveCategories = []) => {
    const rawImage = String(item?.image || '').trim();

    // 1. Explicit uploaded remote/Cloudinary or static path
    if (
        /^(https?:)?\/\//i.test(rawImage) ||
        rawImage.startsWith('data:') ||
        rawImage.startsWith('blob:') ||
        rawImage.startsWith('/uploads/') ||
        rawImage.startsWith('/media/')
    ) {
        return rawImage;
    }

    // 2. Try to match live Category database record from Admin -> Categories if categoryId exists
    const categoryId = item?.categoryId || item?.id;
    const itemName = String(item?.name || item?.label || '').trim().toLowerCase();
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

    // 3. Fallback to legacy asset map or category fallback
    const resolved = resolveLegacyCmsAsset(rawImage, rawImage);
    return resolved || getCategoryFallback(item);
};

const normalizeItems = (items = [], liveCategories = [], fallbackList = []) => {
    const source = items.length > 0 ? items : fallbackList;
    return source
        .filter((item) => Boolean(item?.name || item?.label))
        .map((item, index) => {
            const fallback = getCategoryFallback(item);
            const resolvedImg = resolveItemImage(item, liveCategories);
            return {
                id: item.itemId || item.id || `item-${index + 1}`,
                name: item.label || item.name,
                image: resolvedImg || fallback,
                fallbackImage: fallback,
                path: item.path || '/shop',
                badge: item.badge || ''
            };
        });
};

const CollectionCategoryGrid = ({
    sectionKey = 'category-grid',
    defaultTitle = 'Shop by Category',
    defaultEyebrow = 'Curated Dimensions',
    defaultSubtitle = '',
    defaultItems = [],
    bgClass = 'bg-[#FAF8F5]'
}) => {
    const scrollRef = useRef(null);
    const { data: homepageSections = {}, isLoading: isCmsLoading, isSuccess } = useHomepageCms();
    const { categories: liveCategories = [], isLoading: isShopLoading } = useShop();
    const sectionData = homepageSections?.[sectionKey];
    const [activeIndex, setActiveIndex] = useState(0);

    // 1. Independent visibility check: respect isActive toggle from Admin CMS
    if (sectionData && sectionData.isActive === false) {
        return null;
    }
    // If CMS loaded successfully and this section is omitted from active response, hide it
    if (isSuccess && Object.keys(homepageSections).length > 0 && !sectionData) {
        return null;
    }

    const categories = useMemo(() => {
        const rawItems = Array.isArray(sectionData?.items) ? sectionData.items : [];
        return normalizeItems(rawItems, liveCategories, defaultItems);
    }, [sectionData?.items, liveCategories, defaultItems]);

    const leadCategory = categories[0] || null;
    const supportingCategories = categories.slice(1);

    // Gold, Silver & Diamond Collection Side Panel Integration Checks
    const isGoldGrid = sectionKey === 'gold-collection-grid';
    const isSilverGrid = sectionKey === 'silver-collection-grid';
    const isDiamondGrid = sectionKey === 'diamond-collection-grid';

    const goldSectionData = isGoldGrid ? homepageSections?.['shop-by-colour'] : null;
    const isGoldPanelActive = isGoldGrid && goldSectionData?.isActive !== false && goldSectionData?.settings?.enabled !== false;
    const goldPanelPosition = goldSectionData?.settings?.position || 'right';

    const silverSectionData = isSilverGrid ? homepageSections?.['shop-by-silver'] : null;
    const isSilverPanelActive = isSilverGrid && silverSectionData?.isActive !== false && silverSectionData?.settings?.enabled !== false;
    const silverPanelPosition = silverSectionData?.settings?.position || 'right';

    const diamondSectionData = isDiamondGrid ? homepageSections?.['shop-by-diamond'] : null;
    const isDiamondPanelActive = isDiamondGrid && diamondSectionData?.isActive !== false && diamondSectionData?.settings?.enabled !== false;
    const diamondPanelPosition = diamondSectionData?.settings?.position || 'right';

    const isSidePanelActive = isGoldPanelActive || isSilverPanelActive || isDiamondPanelActive;
    const sidePanelPosition = isGoldGrid ? goldPanelPosition : isSilverGrid ? silverPanelPosition : diamondPanelPosition;

    const handleScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, clientWidth } = scrollRef.current;
            const index = Math.round(scrollLeft / clientWidth);
            setActiveIndex(index);
        }
    };

    if ((isCmsLoading && !sectionData) || (categories.length === 0 && (isCmsLoading || isShopLoading))) {
        return (
            <div className={`w-full ${bgClass} py-8 md:py-12 border-y border-[#E8DFD0]/60`}>
                <div className="container mx-auto px-4 md:px-8 max-w-[1440px]">
                    <div className="h-6 w-48 bg-stone-200/60 rounded-md mb-6 animate-pulse" />
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                        {[1, 2, 3, 4, 5, 6].map((idx) => (
                            <div key={idx} className="aspect-square bg-stone-200/50 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (categories.length === 0) {
        return null;
    }

    const sectionTitle = sectionData?.settings?.title || sectionData?.label || defaultTitle;
    const sectionEyebrow = sectionData?.settings?.badge || sectionData?.settings?.subtitle || defaultEyebrow;
    const sectionDescription = sectionData?.settings?.description || defaultSubtitle || `${categories.length} Handcrafted Categories`;

    // Render helper for supporting category cards
    const renderSupportingCard = (cat) => (
        <Link
            key={cat.id}
            to={cat.path}
            className="group flex flex-col justify-between h-full bg-white rounded-2xl overflow-hidden border border-[#E8DFD0] hover:border-[#C59B27] shadow-xs hover:shadow-[0_16px_36px_rgba(20,18,17,0.1)] transition-all duration-400"
        >
            <div className="relative flex-1 min-h-[140px] w-full overflow-hidden bg-stone-100">
                <img
                    src={cat.image}
                    alt={cat.name}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => handleImageError(e, cat.fallbackImage)}
                    className="w-full h-full object-cover object-center transition-transform duration-[1.2s] ease-out group-hover:scale-108"
                />
                {cat.badge && (
                    <span className="absolute top-2.5 right-2.5 bg-[#141211]/85 text-[#E8D198] text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full z-10 border border-[#C59B27]/40 shadow-xs">
                        {cat.badge}
                    </span>
                )}
            </div>

            <div className="p-3.5 bg-white border-t border-[#E8DFD0]/60 flex flex-col justify-between shrink-0">
                <div className="flex items-center justify-between gap-1 mb-1">
                    <h4 className="text-xs sm:text-sm font-serif font-medium text-[#141211] group-hover:text-[#C59B27] transition-colors line-clamp-1">
                        {cat.name}
                    </h4>
                    <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-[#C59B27] transition-all transform group-hover:translate-x-1 shrink-0" />
                </div>
                <span className="text-[9px] uppercase font-sans font-semibold tracking-[0.16em] text-[#C59B27] group-hover:text-[#141211] transition-colors">
                    Explore Collection
                </span>
            </div>
        </Link>
    );

    // Render helper for lead category card
    const renderLeadCard = () => (
        leadCategory && (
            <Link
                to={leadCategory.path}
                className="group block relative h-full min-h-[460px] rounded-3xl overflow-hidden bg-white border border-[#E8DFD0] hover:border-[#C59B27] shadow-xs hover:shadow-[0_20px_40px_rgba(20,18,17,0.12)] transition-all duration-500"
            >
                <img
                    src={leadCategory.image}
                    alt={leadCategory.name}
                    loading="eager"
                    decoding="async"
                    onError={(e) => handleImageError(e, leadCategory.fallbackImage)}
                    className="w-full h-full object-cover transition-transform duration-[1.6s] ease-out group-hover:scale-106"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-[#141211] via-[#141211]/30 to-transparent z-10" />

                {leadCategory.badge ? (
                    <div className="absolute top-4 left-4 z-20 bg-[#C59B27] text-[#141211] text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md">
                        {leadCategory.badge}
                    </div>
                ) : (
                    <div className="absolute top-4 left-4 z-20 bg-[#141211]/80 backdrop-blur-sm border border-[#C59B27]/40 text-[#E8D198] text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                        Atelier Spotlight
                    </div>
                )}

                <div className="absolute bottom-6 inset-x-6 z-20 text-[#FAF8F5]">
                    <span className="text-[10px] font-sans font-semibold uppercase tracking-[0.2em] text-[#E8D198] mb-1 block">
                        Signature Category
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
        )
    );

    return (
        <section
            id={sectionKey}
            className={`w-full ${bgClass} py-8 md:py-16 border-y border-[#E8DFD0]/60 relative`}
        >
            <div className="container mx-auto px-4 md:px-8 max-w-[1440px]">
                {/* Section Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-12">
                    <div>
                        <div className="inline-flex items-center gap-2 mb-2 text-[#C59B27] text-[10px] uppercase font-bold tracking-[0.3em]">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>{sectionEyebrow}</span>
                        </div>
                        <h2 className="font-serif text-2xl md:text-4xl text-[#141211] font-normal tracking-tight">
                            {sectionTitle}
                        </h2>
                    </div>
                    <div className="hidden md:flex items-center gap-2 mt-3 md:mt-0">
                        <span className="text-stone-500 text-xs font-sans">
                            {sectionDescription}
                        </span>
                        <div className="w-10 h-[1px] bg-[#C59B27]" />
                    </div>
                </div>

                {/* ── DESKTOP ASYMMETRIC / EDITORIAL COMPOSITION (lg+) ── */}
                {isSidePanelActive ? (
                    // Gold or Silver Collection Grid + Side Panel layout
                    <div className="hidden lg:grid lg:grid-cols-12 gap-6 items-stretch">
                        {sidePanelPosition === 'left' && (
                            <div className="lg:col-span-3">
                                {isGoldPanelActive && <GoldShopByColourPanel sectionData={goldSectionData} />}
                                {isSilverPanelActive && <SilverShopByTypePanel sectionData={silverSectionData} />}
                                {isDiamondPanelActive && <DiamondShopByTypePanel sectionData={diamondSectionData} />}
                            </div>
                        )}

                        {/* Visual Lead Category (4 columns) */}
                        <div className="lg:col-span-4">
                            {renderLeadCard()}
                        </div>

                        {/* Supporting Categories (5 columns, 2x2 grid) */}
                        <div className="lg:col-span-5 grid grid-cols-2 gap-4">
                            {supportingCategories.slice(0, 4).map(renderSupportingCard)}
                        </div>

                        {sidePanelPosition !== 'left' && (
                            <div className="lg:col-span-3">
                                {isGoldPanelActive && <GoldShopByColourPanel sectionData={goldSectionData} />}
                                {isSilverPanelActive && <SilverShopByTypePanel sectionData={silverSectionData} />}
                                {isDiamondPanelActive && <DiamondShopByTypePanel sectionData={diamondSectionData} />}
                            </div>
                        )}
                    </div>
                ) : (
                    // Standard 12-column layout (Diamond, CategoryGrid, or Gold/Silver when panel is disabled)
                    <div className="hidden lg:grid lg:grid-cols-12 gap-6">
                        {leadCategory && (
                            <div className="lg:col-span-4">
                                {renderLeadCard()}
                            </div>
                        )}

                        <div className="lg:col-span-8 grid grid-cols-3 xl:grid-cols-4 gap-4">
                            {supportingCategories.slice(0, 8).map(renderSupportingCard)}
                        </div>
                    </div>
                )}

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

                {/* Mobile / Tablet Shop by Colour Bar */}
                {isGoldPanelActive && (
                    <div className="mt-6 lg:hidden">
                        <GoldShopByColourPanel sectionData={goldSectionData} layout="horizontal" />
                    </div>
                )}

                {/* Mobile / Tablet Shop by Silver Bar */}
                {isSilverPanelActive && (
                    <div className="mt-6 lg:hidden">
                        <SilverShopByTypePanel sectionData={silverSectionData} layout="horizontal" />
                    </div>
                )}

                {/* Mobile / Tablet Shop by Diamond Bar */}
                {isDiamondPanelActive && (
                    <div className="mt-6 lg:hidden">
                        <DiamondShopByTypePanel sectionData={diamondSectionData} layout="horizontal" />
                    </div>
                )}
            </div>
        </section>
    );
};

export default CollectionCategoryGrid;
