import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
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
            // If curated list resolves to real products, use it; otherwise fall through to all products
            if (curated.length > 0) return curated;
        }

        // Always fall back to latest products from catalogue
        return validProducts
            .filter((product) => product?.id && product?.name)
            .sort((a, b) => new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0))
            .slice(0, productLimit);
    }, [curatedProductIds, productLimit, products]);

    // Only hide if admin has explicitly deactivated this section
    if (sectionData?.isActive === false) return null;

    // Don't render until products have loaded
    if (displayProducts.length === 0) return null;

    const eyebrow = settings.eyebrow?.trim() || 'Our Collection';
    const title = settings.title?.trim() || 'All Jewellery';
    const ctaLabel = settings.ctaLabel?.trim() || 'View Full Collection';
    const ctaLink = '/shop';

    return (
        <section className="pt-4 pb-2 md:py-12 bg-white">
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex flex-col md:flex-row md:justify-between items-center md:items-end text-center md:text-left mb-10 md:mb-16 gap-6">
                    <div className="flex flex-col items-center md:items-start">
                        <span className="text-[10px] md:text-sm uppercase tracking-[0.4em] text-[#C59B27] font-bold mb-1 md:mb-2">{eyebrow}</span>
                        <h2 className="text-xl md:text-4xl font-display text-[#141211]">{title}</h2>
                        <div className="h-1 w-12 bg-[#C59B27] mt-2 rounded-full md:hidden"></div>
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                    {displayProducts.map((product) => (
                        <ProductCard key={product.id || product._id} product={product} />
                    ))}
                </div>

                <div className="mt-5 md:mt-16 flex justify-center">
                    <Link
                        to={ctaLink}
                        className="group flex items-center gap-3 text-sm font-medium text-[#141211] transition-all"
                    >
                        <span className="border-b border-[#141211] pb-0.5 group-hover:text-[#C59B27] group-hover:border-[#C59B27] transition-all">
                            {ctaLabel}
                        </span>
                        <ShoppingBag className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default AllJewellery;
