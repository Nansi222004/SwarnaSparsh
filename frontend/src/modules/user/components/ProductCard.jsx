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
                    className={`fixed z-[9999] w-44 h-44 object-cover shadow-2xl pointer-events-none border-2 border-[#C6A04A] rounded-xl ${flyingType === 'cart' ? 'animate-fly-cart' : 'animate-fly-heart'}`}
                    style={{ left: '50%', top: '50%' }}
                />
            )}

            <div
                className="group/card relative w-full flex flex-col bg-white overflow-hidden cursor-pointer border border-[#E8E0D2] hover:border-[#C6A04A] rounded-2xl transition-all duration-500 hover:shadow-[0_8px_24px_rgba(23,23,23,0.08)]"
                onClick={handleProductOpen}
            >
                {/* Visual Area — Editorial ratio & warm surface */}
                <div className="relative aspect-[4/4] overflow-hidden bg-[#FAF7F0] border-b border-[#E8E0D2]">
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
                            <span className="bg-[#171717] text-[#E5CC85] border border-[#C6A04A]/40 text-[8px] md:text-[9px] font-bold px-2 py-0.5 uppercase tracking-widest rounded-md shadow-sm">
                                Bestseller
                            </span>
                        )}
                        {(product.tags?.isNewArrival || product.tags?.isNewLaunch) && (
                            <span className="bg-[#FAF7F0] text-[#171717] border border-[#C6A04A] text-[8px] md:text-[9px] font-bold px-2 py-0.5 uppercase tracking-widest rounded-md shadow-sm">
                                New Arrival
                            </span>
                        )}
                        {hasDiscount && discountPercent > 0 && (
                            <span className="bg-[#C6A04A] text-[#171717] text-[8px] md:text-[9px] font-black px-1.5 py-0.5 uppercase tracking-wider rounded-md shadow-sm">
                                {discountPercent}% Off
                            </span>
                        )}
                    </div>

                    {/* Quick Action Buttons (Glassmorphic & Restrained) */}
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-20">
                        <button
                            onClick={handleWishlist}
                            className={`w-7 h-7 md:w-8 md:h-8 rounded-full bg-white/90 backdrop-blur-md border border-[#E8E0D2] flex items-center justify-center shadow-xs transition-all duration-300 hover:border-[#C6A04A] hover:scale-105 ${isWishlisted ? 'text-[#C6A04A] bg-[#FAF7F0]' : 'text-[#77716A] hover:text-[#C6A04A]'}`}
                            title={isWishlisted ? "In your wishlist" : "Add to wishlist"}
                            aria-label="Wishlist"
                        >
                            <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-current text-[#C6A04A]' : ''}`} />
                        </button>

                        <button
                            onClick={handleAddToCart}
                            className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-white/90 backdrop-blur-md border border-[#E8E0D2] flex items-center justify-center shadow-xs transition-all duration-300 hover:border-[#C6A04A] hover:scale-105 text-[#77716A] hover:text-[#C6A04A]"
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
                        <span className="text-[9px] md:text-[10px] font-sans font-semibold uppercase tracking-[0.18em] text-[#C6A04A] line-clamp-1">
                            {categoryName || 'Fine Jewellery'}
                        </span>
                        
                        {/* 3. Rating */}
                        <div className="flex items-center gap-1">
                            <Star className="w-2.5 h-2.5 fill-[#C6A04A] text-[#C6A04A]" />
                            <span className="text-[10px] font-bold text-[#242424]">{ratingValue}</span>
                            {reviewCount > 0 && (
                                <span className="text-[9px] text-[#77716A]">({reviewCount})</span>
                            )}
                        </div>
                    </div>

                    {/* 2. Product Name in Elegant Serif */}
                    <h3 className="font-serif text-[12px] md:text-[14px] font-medium text-[#171717] line-clamp-1 group-hover/card:text-[#C6A04A] transition-colors leading-snug mb-2">
                        {product.name}
                    </h3>

                    {/* 4 & 5. Price and MRP / Discount */}
                    <div className="flex items-baseline gap-2 mb-3 mt-auto">
                        <span className="text-[15px] md:text-[17px] font-bold text-[#171717] font-sans tracking-tight">
                            {formatCurrency(effectivePrice)}
                        </span>
                        {hasDiscount && (
                            <span className="text-[11px] md:text-[12px] text-[#77716A] line-through font-normal">
                                {formatCurrency(effectiveOriginalPrice)}
                            </span>
                        )}
                    </div>

                    {/* Editorial CTA */}
                    <button
                        onClick={handleProductOpen}
                        className="w-full bg-[#171717] text-[#FAF7F0] hover:bg-[#C6A04A] hover:text-[#171717] font-sans font-semibold text-[10px] md:text-[11px] py-2 rounded-xl transition-all duration-300 uppercase tracking-[0.14em] active:scale-[0.99] flex items-center justify-center gap-1 shadow-xs border border-[#171717] hover:border-[#C6A04A]"
                    >
                        Explore Piece
                    </button>
                </div>
            </div>
        </>
    );
};

export default ProductCard;
