import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Sparkles } from 'lucide-react';
import { useShop } from '../../../context/ShopContext';
import ProductCard from './ProductCard';
import { matchesRequestedMetal } from '../utils/productMetal';
import { useHomepageCms } from '../hooks/useHomepageCms';

const AllJewellery = () => {
    const { products = [] } = useShop();
    const { data: homepageSections = {} } = useHomepageCms();
    const sectionData = homepageSections?.['all-jewellery'];
    const settings = sectionData?.settings || {};
    const productLimit = Number(settings.productLimit) > 0 ? Number(settings.productLimit) : 16;
    const curatedProductIds = Array.isArray(sectionData?.items)
        ? sectionData.items
            .flatMap((item) => [item?.productId, item?.id, item?._id])
            .filter(Boolean)
        : [];

    const displayProducts = useMemo(() => {
        // Home (/) is the Silver Jewellery landing page. Keep this section silver-safe.
        const validProducts = [...products]
            .filter((product) => product?.id && product?.name)
            .filter((product) => matchesRequestedMetal(product, 'silver'));

        // If CMS has curated product IDs, attempt to use them
        if (curatedProductIds.length > 0) {
            const productMap = new Map(validProducts.map((product) => [product.id || product._id, product]));
            const curated = curatedProductIds
                .map((id) => productMap.get(id))
                .filter(Boolean)
                .slice(0, productLimit);
            if (curated.length > 0) return curated;
        }

        // Fall back to catalogue order
        return validProducts
            .filter((product) => product?.id && product?.name)
            .sort((a, b) => new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0))
            .slice(0, productLimit);
    }, [curatedProductIds, productLimit, products]);

    if (sectionData?.isActive === false) return null;
    if (displayProducts.length === 0) return null;

    const eyebrow = settings.eyebrow?.trim() || 'Signature Showcase';
    const title = settings.title?.trim() || 'All Jewellery';
    const ctaLabel = settings.ctaLabel?.trim() || 'Explore Full Atelier';
    const ctaLink = '/shop';

    const leadProduct = displayProducts[0];
    const topSupportingProducts = displayProducts.slice(1, 5);
    const remainingProducts = displayProducts.slice(5);

    return (
        <section className="py-10 md:py-20 bg-white">
            <div className="container mx-auto px-4 md:px-8 max-w-[1440px]">
                {/* Editorial Section Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between text-left mb-10 md:mb-14">
                    <div>
                        <div className="inline-flex items-center gap-2 mb-2 text-[#C59B27] text-[10px] uppercase font-bold tracking-[0.3em]">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>{eyebrow}</span>
                        </div>
                        <h2 className="font-serif text-2xl md:text-4xl text-[#141211] font-normal tracking-tight">
                            {title}
                        </h2>
                    </div>
                    <Link
                        to={ctaLink}
                        className="hidden md:inline-flex items-center gap-2 text-xs font-sans font-bold uppercase tracking-[0.18em] text-[#141211] hover:text-[#C59B27] transition-colors pb-1 border-b border-[#141211] hover:border-[#C59B27]"
                    >
                        <span>{ctaLabel}</span>
                        <ShoppingBag className="w-3.5 h-3.5" />
                    </Link>
                </div>

                {/* ── ASYMMETRIC LEAD PRODUCT SHOWCASE ── */}
                {leadProduct && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 mb-6">
                        {/* Featured Lead Product Slot (Desktop: 5 cols, Mobile: full width) */}
                        <div className="lg:col-span-5 flex flex-col">
                            <ProductCard product={leadProduct} />
                        </div>

                        {/* Top Supporting Products (Desktop: 7 cols arranged in 2x2 grid) */}
                        <div className="lg:col-span-7 grid grid-cols-2 gap-4 md:gap-6">
                            {topSupportingProducts.map((product) => (
                                <ProductCard key={product.id || product._id} product={product} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Remaining Products in Balances Grid */}
                {remainingProducts.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mt-6">
                        {remainingProducts.map((product) => (
                            <ProductCard key={product.id || product._id} product={product} />
                        ))}
                    </div>
                )}

                {/* Mobile Bottom CTA */}
                <div className="mt-8 flex justify-center md:hidden">
                    <Link
                        to={ctaLink}
                        className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#141211] hover:text-[#C59B27] border-b border-[#141211] pb-1 transition-all"
                    >
                        <span>{ctaLabel}</span>
                        <ShoppingBag className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default AllJewellery;
