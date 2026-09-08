import React, { useState } from 'react';
import { Heart, ShoppingBag, Star } from 'lucide-react';
import { useShop } from '../../../context/ShopContext';
import { useAuth } from '../../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import latestRing from '@assets/latest_drop_ring.png';
import latestBracelet from '@assets/latest_drop_bracelet.png';
import latestNecklace from '@assets/latest_drop_necklace.png';
import latestEarrings from '@assets/latest_drop_earrings.png';
import newAnklets from '@assets/new_launch_anklets.png';

// Import high-end generated product shots for missing DB images
import premiumRingProduct from '@assets/premium_ring_product.png';
import premiumBraceletProduct from '@assets/premium_bracelet_product.png';
import premiumPendantProduct from '@assets/premium_pendant_product.png';
import premiumNecklaceProduct from '@assets/premium_necklace_product.png';

const fallbackProductMap = {
    ring: premiumRingProduct,
    pendant: premiumPendantProduct,
    necklace: premiumNecklaceProduct,
    bracelet: premiumBraceletProduct
};

const fallbackModelMap = {
    ring: latestRing,
    pendant: latestNecklace,
    earring: latestEarrings,
    bracelet: latestBracelet,
    anklet: newAnklets
};

import { getProductPrice, getProductMRP, formatCurrency } from '../utils/price';
import { getProductCardUrl } from '../../../utils/imageUtils';

const ProductCard = ({ product, isWishlistPage = false, requireLogin = false, loginSource = 'men' }) => {
    const { addToCart, addToWishlist, removeFromWishlist, wishlist } = useShop();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [flying, setFlying] = useState(false);
    const [flyingType, setFlyingType] = useState('cart'); // 'cart' or 'heart'

    const safeWishlist = Array.isArray(wishlist) ? wishlist : [];
    const isWishlisted = safeWishlist.some(item => (item.id || item._id) === (product.id || product._id));

    // Dynamic Image Resolution
    const productImages = Array.isArray(product.images) ? product.images.filter(Boolean) : [];
    const variantImages = Array.isArray(product.variants)
        ? product.variants.flatMap((v) => (Array.isArray(v?.variantImages) ? v.variantImages : [])).filter(Boolean)
        : [];

    const dbImages = productImages.length > 0 ? productImages : variantImages;

    const resolvePrimaryImage = () => {
        if (dbImages[0]) return dbImages[0];
        const categoryData = product.category;
        const categoryName = (typeof categoryData === 'object' ? categoryData?.name : categoryData) || '';
        const searchStr = String(categoryName + ' ' + (product.name || '')).toLowerCase();
        if (searchStr.includes('ring')) return fallbackProductMap.ring;
        if (searchStr.includes('necklace') || searchStr.includes('choker') || searchStr.includes('set')) return fallbackProductMap.necklace;
        if (searchStr.includes('pendant') || searchStr.includes('chain')) return fallbackProductMap.pendant;
        if (searchStr.includes('bracelet')) return fallbackProductMap.bracelet;
        return null;
    };

    const primaryImage = resolvePrimaryImage();

    const resolveSecondaryImage = () => {
        if (productImages.length >= 2) return productImages[1];
        if (productImages.length === 0) {
            const variantHover = variantImages.find((img) => img && img !== primaryImage);
            if (variantHover) return variantHover;
        }
        if (!dbImages[0]) {
            const categoryData = product.category;
            const categoryName = (typeof categoryData === 'object' ? categoryData?.name : categoryData) || '';
            const searchStr = String(categoryName + ' ' + (product.name || '')).toLowerCase();
            if (searchStr.includes('ring')) return fallbackModelMap.ring;
            if (searchStr.includes('necklace') || searchStr.includes('choker') || searchStr.includes('set')) return fallbackModelMap.pendant;
            if (searchStr.includes('pendant') || searchStr.includes('chain')) return fallbackModelMap.pendant;
            if (searchStr.includes('earring')) return fallbackModelMap.earring;
            if (searchStr.includes('bracelet')) return fallbackModelMap.bracelet;
            if (searchStr.includes('anklet')) return fallbackModelMap.anklet;
        }
        return null;
    };
    const secondaryImage = resolveSecondaryImage();

    // Use Centralized Price Logic
    const effectivePrice = getProductPrice(product);
    const effectiveOriginalPrice = getProductMRP(product);

    const reviewCount = Number(product.reviewCount ?? product.reviews ?? 0);

    const handleProductOpen = () => {
        navigate(`/product/${product.id || product._id}`);
    };

    const handleAddToCart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (product.status === 'Draft' || product.active === false) {
            toast.error("This product is currently unavailable");
            return;
        }
        setFlyingType('cart');
        setFlying(true);
        addToCart(product);
        setTimeout(() => {
            setFlying(false);
            toast.success('Added to cart!', { icon: '🛒' });
        }, 800);
    };

    const handleWishlist = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isWishlisted) {
            setFlyingType('heart');
            setFlying(true);
            addToWishlist(product);
            setTimeout(() => setFlying(false), 800);
        } else {
            removeFromWishlist(product.id || product._id);
        }
    };

    return (
        <>
            {/* Flying Image Animation Element — keyframes are in index.css */}
            {flying && primaryImage && (
                <img
                    src={primaryImage}
                    alt=""
                    className={`fixed z-[9999] w-48 h-48 object-cover shadow-2xl pointer-events-none border-4 border-white ${flyingType === 'cart' ? 'animate-fly-cart' : 'animate-fly-heart'}`}
                    style={{ left: '50%', top: '50%' }}
                />
            )}

            <div className="group/card relative w-full flex flex-col bg-white overflow-hidden cursor-pointer border border-[#E8DFD0]/70 hover:border-[#C59B27] rounded-xl transition-all duration-300 hover:shadow-[0_10px_28px_rgba(20,18,17,0.08)]" onClick={handleProductOpen}>
                <div className="relative aspect-square overflow-hidden bg-[#FAF8F5] rounded-t-xl mb-2">
                    {primaryImage ? (
                        <>
                            <img
                                src={getProductCardUrl(primaryImage)}
                                alt={product.name}
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover/card:scale-105"
                            />
                            {secondaryImage && (
                                <img
                                    src={getProductCardUrl(secondaryImage)}
                                    alt={`${product.name} detail`}
                                    loading="lazy"
                                    decoding="async"
                                    className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover/card:opacity-100 transition-opacity duration-[1.2s] ease-in-out"
                                />
                            )}
                        </>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-300 text-[10px] uppercase tracking-widest font-bold">
                            Swarna Sparsh
                        </div>
                    )}

                    {/* Dynamic Urgency Badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                        {(product.isTrending || product.tags?.isTrending) && (
                            <div className="bg-gradient-to-r from-[#D4AF37] to-[#C59B27] text-[#141211] text-[8px] md:text-[9px] font-black px-2 py-0.5 uppercase tracking-widest rounded shadow-sm">
                                Bestseller
                            </div>
                        )}
                        {(product.tags?.isNewArrival || product.tags?.isNewLaunch) && (
                            <div className="bg-emerald-700 text-white text-[8px] md:text-[9px] font-bold px-2 py-0.5 uppercase tracking-widest rounded shadow-sm">
                                New Arrival
                            </div>
                        )}
                        {product.tags?.isMostGifted && (
                            <div className="bg-[#1C1917] text-[#E8D198] border border-[#C59B27]/40 text-[8px] md:text-[9px] font-bold px-2 py-0.5 uppercase tracking-widest rounded shadow-sm">
                                Most Gifted
                            </div>
                        )}
                        {(product.isPremium || product.tags?.isPremium) && (
                            <div className="bg-gradient-to-r from-purple-800 to-indigo-900 text-white text-[8px] md:text-[9px] font-bold px-2 py-0.5 uppercase tracking-widest rounded shadow-sm">
                                Premium
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleWishlist}
                        className={`absolute top-2 right-2 z-20 w-7 h-7 md:w-8 md:h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm transition-all transform hover:scale-110 ${isWishlisted ? 'text-[#C59B27]' : 'text-gray-400 hover:text-[#C59B27]'}`}
                        title="Add to Wishlist"
                    >
                        <Heart className={`w-3.5 h-3.5 md:w-4 md:h-4 ${isWishlisted ? 'fill-current text-[#C59B27]' : ''}`} />
                    </button>

                    <button
                        onClick={handleAddToCart}
                        className="absolute top-2 right-10 md:right-11 z-20 w-7 h-7 md:w-8 md:h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm transition-all transform hover:scale-110 text-gray-400 hover:text-[#C59B27]"
                        title="Add to Cart"
                    >
                        <ShoppingBag className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </button>

                    <div className="absolute bottom-2 left-2 z-10 bg-white/95 px-2 py-0.5 rounded flex items-center gap-1 shadow-sm border border-[#E8DFD0]">
                        <span className="text-[10px] font-bold text-gray-800">{product.rating || 4.5}</span>
                        <Star className="w-2.5 h-2.5 fill-[#C59B27] text-[#C59B27]" />
                        <div className="w-px h-2.5 bg-gray-200 mx-0.5" />
                        <span className="text-[10px] text-gray-500">{reviewCount || 0}</span>
                    </div>
                </div>

                <div className="flex flex-col px-3 pb-3 pt-1">
                    <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-[15px] md:text-[17px] font-bold text-[#1C1917] tracking-tight font-sans">
                            {formatCurrency(effectivePrice)}
                        </span>
                        {effectiveOriginalPrice > effectivePrice && (
                            <span className="text-[11px] md:text-[12px] text-[#948B83] line-through font-normal opacity-80">
                                {formatCurrency(effectiveOriginalPrice)}
                            </span>
                        )}
                    </div>
                    
                    <h3 className="text-[11px] md:text-[13px] font-serif font-medium text-[#1C1917] line-clamp-1 group-hover/card:text-[#C59B27] transition-colors leading-snug mb-2">
                        {product.name}
                    </h3>

                    {(product.priceDrop || (effectiveOriginalPrice > effectivePrice)) && (
                        <div className="mb-2 flex items-center">
                            <span className="px-2 py-0.5 bg-[#FAF4E6] text-[#8C6A12] text-[8px] md:text-[9px] font-bold uppercase tracking-wider rounded border border-[#E5CE93]">
                                Special Offer
                            </span>
                        </div>
                    )}
                    
                    <div className="w-full mt-auto pt-1">
                        <button 
                            onClick={handleProductOpen}
                            className="w-full bg-[#1C1917] text-white hover:bg-[#C59B27] hover:text-[#1C1917] font-semibold text-[10px] md:text-[11px] py-2 rounded-lg transition-all duration-300 uppercase tracking-[0.12em] active:scale-[0.98] flex items-center justify-center gap-1.5 shadow-sm"
                        >
                            View Piece
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ProductCard;
