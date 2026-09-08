import React from 'react';
import { Link } from 'react-router-dom';
import { useShop } from '../../../context/ShopContext';
import { useHomepageCms } from '../hooks/useHomepageCms';
import ProductCard from './ProductCard';
import bondWife from '@assets/bond_wife.png';
import bondHusband from '@assets/bond_husband.png';
import bondMother from '@assets/bond_mother.png';
import bondBrothers from '@assets/bond_brothers.png';
import bondSister from '@assets/bond_sister.png';
import bondFriends from '@assets/bond_friends.png';
import { resolveLegacyCmsAsset } from '../utils/legacyCmsAssets';
import { ensureSilverHomePath } from '../utils/silverHomePaths';
import { matchesRequestedMetal } from '../utils/productMetal';

const FALLBACK_RECIPIENTS = [
    { id: 'wife', name: 'Wife', image: bondWife, path: ensureSilverHomePath('/collection/bond/wife') },
    { id: 'husband', name: 'Husband', image: bondHusband, path: ensureSilverHomePath('/collection/bond/husband') },
    { id: 'mother', name: 'Mother', image: bondMother, path: ensureSilverHomePath('/collection/bond/mother') },
    { id: 'brothers', name: 'Brothers', image: bondBrothers, path: ensureSilverHomePath('/collection/bond/brothers') },
    { id: 'sister', name: 'Sister', image: bondSister, path: ensureSilverHomePath('/collection/bond/sister') },
    { id: 'friends', name: 'Friends', image: bondFriends, path: ensureSilverHomePath('/collection/bond/friends') }
];

const PerfectGift = () => {
    const { products } = useShop();
    const { data: homepageSections = {} } = useHomepageCms();
    
    // Config for Top categories
    const bondSection = homepageSections?.['shop-by-bond'];
    const bondSettings = bondSection?.settings || {};

    // Config for Bottom product strip
    const giftSection = homepageSections?.['featured-gifts'];
    const giftSettings = giftSection?.settings || {};
    const giftProductLimit = Math.max(1, Number(giftSettings.productLimit) || 4);

    const curatedGiftIds = React.useMemo(() => {
        return Array.isArray(giftSection?.items)
            ? giftSection.items
                .flatMap((item) => [item?.productId, item?.id, item?._id])
                .filter(Boolean)
                .map((id) => String(id))
            : [];
    }, [giftSection?.items]);

    const featuredGifts = React.useMemo(() => {
        if (!products || products.length === 0) return [];

        // Keep this strip silver-safe on Silver Home.
        const validProducts = products.filter((product) =>
            (product.id || product._id)
            && product.name
            && (product.stockStatus !== 'out_of_stock')
            && matchesRequestedMetal(product, 'silver')
        );

        // If CMS has curated product IDs, attempt to use them first.
        if (curatedGiftIds.length > 0) {
            const productMap = new Map(validProducts.map((product) => [String(product.id || product._id), product]));
            const curated = curatedGiftIds
                .map((pid) => productMap.get(String(pid)))
                .filter(Boolean)
                .slice(0, giftProductLimit);
            if (curated.length > 0) return curated;
        }

        // Sorting rule:
        // 1. Gift/Set keyword in Name
        // 2. Trending
        // 3. Newest
        const sorted = [...validProducts].sort((a, b) => {
            const aName = (a.name || '').toLowerCase();
            const bName = (b.name || '').toLowerCase();
            const aIsGift = aName.includes('gift') || aName.includes('set') || aName.includes('combo');
            const bIsGift = bName.includes('gift') || bName.includes('set') || bName.includes('combo');
            
            if (aIsGift !== bIsGift) return bIsGift ? 1 : -1;

            const aIsTrending = a.isTrending || a.tags?.isTrending;
            const bIsTrending = b.isTrending || b.tags?.isTrending;
            if (aIsTrending !== bIsTrending) return bIsTrending ? 1 : -1;

            const aDate = new Date(a.createdAt || 0);
            const bDate = new Date(b.createdAt || 0);
            return bDate - aDate;
        });

        const sliced = sorted.slice(0, giftProductLimit);
        return sliced;
    }, [curatedGiftIds, products, giftProductLimit]);

    const recipients = (bondSection?.items?.length ? bondSection.items : FALLBACK_RECIPIENTS).map((item, index) => {
        if (!bondSection?.items?.length) return item;
        const bondKey = String(item.bondKey || item.id || '').trim().toLowerCase() || `bond-${index + 1}`;
        return {
            id: item.itemId || item.id || `bond-${index + 1}`,
            name: item.name || 'Bond',
            image: resolveLegacyCmsAsset(item.image, ''),
            path: ensureSilverHomePath(`/collection/bond/${bondKey}`)
        };
    });

    return (
        <section className="pt-2 pb-6 md:pt-4 md:pb-20 bg-white text-black overflow-hidden font-sans border-b border-gray-100">
            <div className="container mx-auto px-4">
                
                {/* Section Title */}
                <div className="text-center mb-8 md:mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight mb-3">
                        {bondSettings.title || 'Shop by Bond'}
                    </h2>
                    <p className="text-gray-500 text-[10px] md:text-xs uppercase tracking-[0.3em] font-semibold">
                        {bondSettings.subtitle || 'Curated for your loved ones'}
                    </p>
                </div>
                
                {/* Bonds Category Grid */}
                <div className="flex overflow-x-auto scrollbar-hide gap-4 md:gap-6 pb-4 md:pb-6 px-1 md:px-2 max-w-[1500px] mx-auto justify-start md:justify-center">
                    {recipients.map((item) => (
                        <Link 
                            key={item.id} 
                            to={item.path} 
                            className="flex flex-col items-center shrink-0 w-[130px] md:w-[210px] group"
                        >
                            <div className="bg-[#F3F3F3] p-1.5 md:p-2 rounded-2xl md:rounded-3xl w-full flex flex-col items-center transition-all duration-500 group-hover:bg-[#EAEAEA] group-hover:translate-y-[-6px] shadow-sm">
                                <div className="w-full aspect-[4/5] overflow-hidden rounded-xl md:rounded-2xl mb-3">
                                    <img
                                        src={item.image}
                                        alt={item.name}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                </div>
                                <h3 className="text-[14px] md:text-[16px] font-semibold text-gray-800 tracking-tight pb-3 px-2 text-center leading-none">
                                    {item.name}
                                </h3>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Featured Products Sub-section */}
                {featuredGifts.length > 0 && (
                <div className="mt-4 md:mt-8 pt-4 md:pt-8 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-4 md:mb-8">
                        <div>
                            <h3 className="text-xl md:text-2xl font-semibold text-gray-900 tracking-tight">
                                {giftSettings.title || 'Featured Gifts'}
                            </h3>
                            <p className="text-gray-500 text-[10px] md:text-xs uppercase tracking-widest mt-0.5">
                                {giftSettings.subtitle || 'Handpicked for the perfect moment'}
                            </p>
                        </div>
                        <Link to="/shop" className="text-[10px] font-bold uppercase tracking-wider text-[#C59B27] hover:text-[#141211] transition-all border-b border-transparent hover:border-[#141211]">
                            {giftSettings.ctaLabel || 'View All'}
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
                        {featuredGifts.map((p) => (
                            <ProductCard key={p.id || p._id} product={p} />
                        ))}
                    </div>
                </div>
                )}

            </div>
        </section>
    );
};

export default PerfectGift;

