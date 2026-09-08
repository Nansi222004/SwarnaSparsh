import React, { useState } from 'react';
import { Heart, ShoppingBag, Star } from 'lucide-react';
import { useShop } from '../../../context/ShopContext';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getProductPrice, getProductMRP, formatCurrency } from '../utils/price';
import { getProductCardUrl } from '../../../utils/imageUtils';
import { getProductFallback, handleImageError } from '../../../utils/imageFallbacks';

const ProductCard = ({ product, isWishlistPage = false, requireLogin = false, loginSource = 'men' }) => {
    const { addToCart, addToWishlist, removeFromWishlist, wishlist } = useShop();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [flying, setFlying] = useState(false);
    const [flyingType, setFlyingType] = useState('cart'); // 'cart' or 'heart'

    const safeWishlist = Array.isArray(wishlist) ? wishlist : [];
    const isWishlisted = safeWishlist.some(item => (item.id || item._id) === (product.id || product._id));

    // Category Name derivation
    const categoryData = product?.category;
    const categoryName = (typeof categoryData === 'object' ? categoryData?.name : categoryData) || '';

    // Dynamic Image Resolution with robust centralized fallback
    const productImages = Array.isArray(product.images) ? product.images.filter(Boolean) : [];
    const variantImages = Array.isArray(product.variants)
        ? product.variants.flatMap((v) => (Array.isArray(v?.variantImages) ? v.variantImages : [])).filter(Boolean)
        : [];

    const dbImages = productImages.length > 0 ? productImages : variantImages;
    const fallbackImage = getProductFallback(product, categoryName);
    const primaryImage = dbImages[0] || fallbackImage;

    const secondaryImage = productImages.length >= 2
        ? productImages[1]
        : (variantImages.find((img) => img && img !== primaryImage) || null);

    // Use Centralized Price Logic
    const effectivePrice = getProductPrice(product);
    const effectiveOriginalPrice = getProductMRP(product);
    const hasDiscount = effectiveOriginalPrice > effectivePrice;
    const discountPercent = hasDiscount
        ? Math.round(((effectiveOriginalPrice - effectivePrice) / effectiveOriginalPrice) * 100)
        : 0;

    const reviewCount = Number(product.reviewCount ?? product.reviews ?? 0);
    const ratingValue = Number(product.rating || 4.8).toFixed(1);

    const handleProductOpen = () => {
        navigate(`/product/${product.id || product._id}`);
    };

    const handleAddToCart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (product.status === 'Draft' || product.active === false) {
            toast.error("This piece is currently unavailable");
            return;
        }
        setFlyingType('cart');
        setFlying(true);
        addToCart(product);
        setTimeout(() => {
            setFlying(false);
            toast.success('Added to your bag', { icon: '✨' });
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
            {/* Flying Image Animation Element */}
            {flying && primaryImage && (
                <img
                    src={primaryImage}
                    alt=""
                    className={`fixed z-[9999] w-44 h-44 object-cover shadow-2xl pointer-events-none border-2 border-[#C59B27] rounded-xl ${flyingType === 'cart' ? 'animate-fly-cart' : 'animate-fly-heart'}`}
                    style={{ left: '50%', top: '50%' }}
                />
            )}

            <div
                className="group/card relative w-full flex flex-col bg-white overflow-hidden cursor-pointer border border-[#E8DFD0] hover:border-[#C59B27] rounded-2xl transition-all duration-500 hover:shadow-[0_12px_32px_rgba(20,18,17,0.09)]"
                onClick={handleProductOpen}
            >
                {/* Visual Area — Editorial ratio & warm surface */}
                <div className="relative aspect-[4/4] overflow-hidden bg-[#FAF8F5] border-b border-[#E8DFD0]/40">
                    <img
                        src={getProductCardUrl(primaryImage)}
                        alt={product.name}
                        loading="lazy"
                        decoding="async"
                        onError={(e) => handleImageError(e, fallbackImage)}
                        className="w-full h-full object-cover transition-transform duration-[1.4s] ease-out group-hover/card:scale-106"
                    />

                    {secondaryImage && (
                        <img
                            src={getProductCardUrl(secondaryImage)}
                            alt={`${product.name} detail view`}
                            loading="lazy"
                            decoding="async"
                            onError={(e) => handleImageError(e, fallbackImage)}
                            className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover/card:opacity-100 transition-opacity duration-700 ease-in-out"
                        />
                    )}

                    {/* Editorial Urgency / Status Badges */}
                    <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
                        {(product.isTrending || product.tags?.isTrending) && (
                            <span className="bg-[#141211] text-[#E8D198] border border-[#C59B27]/40 text-[8px] md:text-[9px] font-bold px-2 py-0.5 uppercase tracking-widest rounded-md shadow-sm">
                                Bestseller
                            </span>
                        )}
                        {(product.tags?.isNewArrival || product.tags?.isNewLaunch) && (
                            <span className="bg-[#FAF8F5] text-[#141211] border border-[#C59B27] text-[8px] md:text-[9px] font-bold px-2 py-0.5 uppercase tracking-widest rounded-md shadow-sm">
                                New Arrival
                            </span>
                        )}
                        {hasDiscount && discountPercent > 0 && (
                            <span className="bg-[#C59B27] text-[#141211] text-[8px] md:text-[9px] font-black px-1.5 py-0.5 uppercase tracking-wider rounded-md shadow-sm">
                                {discountPercent}% Off
                            </span>
                        )}
                    </div>

                    {/* Quick Action Buttons (Glassmorphic & Restrained) */}
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-20">
                        <button
                            onClick={handleWishlist}
                            className={`w-7 h-7 md:w-8 md:h-8 rounded-full bg-white/90 backdrop-blur-md border border-[#E8DFD0] flex items-center justify-center shadow-xs transition-all duration-300 hover:border-[#C59B27] hover:scale-105 ${isWishlisted ? 'text-[#C59B27] bg-[#FAF8F5]' : 'text-stone-500 hover:text-[#C59B27]'}`}
                            title={isWishlisted ? "In your wishlist" : "Add to wishlist"}
                            aria-label="Wishlist"
                        >
                            <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-current text-[#C59B27]' : ''}`} />
                        </button>

                        <button
                            onClick={handleAddToCart}
                            className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-white/90 backdrop-blur-md border border-[#E8DFD0] flex items-center justify-center shadow-xs transition-all duration-300 hover:border-[#C59B27] hover:scale-105 text-stone-500 hover:text-[#C59B27]"
                            title="Add to shopping bag"
                            aria-label="Add to cart"
                        >
                            <ShoppingBag className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {/* Editorial Product Information Hierarchy */}
                <div className="flex flex-col p-3 md:p-3.5 flex-1 bg-white">
                    {/* 1. Category micro-eyebrow */}
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] md:text-[10px] font-sans font-semibold uppercase tracking-[0.18em] text-[#8C6A12] line-clamp-1">
                            {categoryName || 'Fine Jewellery'}
                        </span>
                        
                        {/* 3. Rating */}
                        <div className="flex items-center gap-1">
                            <Star className="w-2.5 h-2.5 fill-[#C59B27] text-[#C59B27]" />
                            <span className="text-[10px] font-bold text-stone-800">{ratingValue}</span>
                            {reviewCount > 0 && (
                                <span className="text-[9px] text-stone-400">({reviewCount})</span>
                            )}
                        </div>
                    </div>

                    {/* 2. Product Name in Elegant Serif */}
                    <h3 className="font-serif text-[12px] md:text-[14px] font-medium text-[#141211] line-clamp-1 group-hover/card:text-[#C59B27] transition-colors leading-snug mb-2">
                        {product.name}
                    </h3>

                    {/* 4 & 5. Price and MRP / Discount */}
                    <div className="flex items-baseline gap-2 mb-3 mt-auto">
                        <span className="text-[15px] md:text-[17px] font-bold text-[#141211] font-sans tracking-tight">
                            {formatCurrency(effectivePrice)}
                        </span>
                        {hasDiscount && (
                            <span className="text-[11px] md:text-[12px] text-stone-400 line-through font-normal">
                                {formatCurrency(effectiveOriginalPrice)}
                            </span>
                        )}
                    </div>

                    {/* Editorial CTA */}
                    <button
                        onClick={handleProductOpen}
                        className="w-full bg-[#141211] text-[#FAF8F5] hover:bg-[#C59B27] hover:text-[#141211] font-sans font-semibold text-[10px] md:text-[11px] py-2 rounded-xl transition-all duration-300 uppercase tracking-[0.14em] active:scale-[0.99] flex items-center justify-center gap-1 shadow-xs border border-[#141211] hover:border-[#C59B27]"
                    >
                        Explore Piece
                    </button>
                </div>
            </div>
        </>
    );
};

export default ProductCard;
