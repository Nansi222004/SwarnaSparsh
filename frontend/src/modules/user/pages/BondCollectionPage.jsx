import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronRight, ShieldCheck, RefreshCw, RotateCcw, Star } from 'lucide-react';
import { useShop } from '../../../context/ShopContext';
import ProductCard from '../components/ProductCard';
import { matchesRequestedMetal } from '../utils/productMetal';

// Import Banners
import bannerWife from '@assets/banner_bond_wife.png';
import bannerHusband from '@assets/banner_bond_husband.png';
import bannerMother from '@assets/banner_bond_mother.png';
import bannerBrothers from '@assets/banner_bond_brothers.png';
import bannerSister from '@assets/banner_bond_sister.png';
import bannerFriends from '@assets/banner_bond_friends.png';

const BONDS_CONFIG = {
    wife: {
        title: "The Love of a Wife",
        subtitle: "Elegance as Timeless as Your Bond",
        banner: bannerWife,
        accent: "#D4AF37", // Gold
        themeColor: "#0D1C12", // Dark Forest
        offer: "Making Charges Starts @ 0%",
        offerDesc: "On All Silver Sets",
    },
    husband: {
        title: "For the Strong & Steady",
        subtitle: "Refined Silver for the Modern Man",
        banner: bannerHusband,
        accent: "#C0C0C0", // Silver
        themeColor: "#1A1A1A", // Neutral Dark
        offer: "Upto 15% OFF",
        offerDesc: "On Luxury Men's Collection",
    },
    mother: {
        title: "A Mother's Grace",
        subtitle: "Celebrate Her Unconditional Love",
        banner: bannerMother,
        accent: "#EBD0D4", // Rose Gold/Pink
        themeColor: "#3D2B2E", // Warm Dark Brown
        offer: "Special Mother's Duo",
        offerDesc: "Buy 1 Get 1 at 50% Off",
    },
    brothers: {
        title: "Brothers for Life",
        subtitle: "Robust Designs for Every Adventure",
        banner: bannerBrothers,
        accent: "#4A90E2", // Blueish
        themeColor: "#101820", // Deep Naval
        offer: "Flat 10% Off",
        offerDesc: "on Bracelet Bundles",
    },
    sister: {
        title: "The Best Sister",
        subtitle: "Trendy Styles for Your Partner in Crime",
        banner: bannerSister,
        accent: "#F5A623", // Amber
        themeColor: "#2C1E12", // Earthy Brown
        offer: "Free Charm",
        offerDesc: "On Orders Over ₹4999",
    },
    friends: {
        title: "Infinite Friendships",
        subtitle: "Match Your Sparkle with Your Bestie",
        banner: bannerFriends,
        accent: "#7ED321", // Green
        themeColor: "#1E2A1E", // Natural Forest
        offer: "Buy 2 Save 20%",
        offerDesc: "On Friendship Bands",
    }
};

const BondCollectionPage = () => {
    const { bondId } = useParams();
    const { products } = useShop();
    const [shopNowHover, setShopNowHover] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const metalQuery = new URLSearchParams(location.search).get('metal');

    const config = BONDS_CONFIG[bondId] || BONDS_CONFIG.wife;

    const filteredProducts = useMemo(() => {
        if (!products) return [];
        const real = products.filter(p => {
            const searchStr = `${p.name} ${p.description} ${p.category}`.toLowerCase();
            const bondMatch = searchStr.includes(bondId.toLowerCase()) || searchStr.includes('gift');
            const metalMatch = matchesRequestedMetal(p, metalQuery);
            return bondMatch && metalMatch;
        });

        return real.slice(0, 16);
    }, [products, bondId, metalQuery]);

    useEffect(() => {
        
    }, [bondId]);

    return (
        <div className="bg-white min-h-screen">
            {/* HERO SECTION */}
            <div className="w-full h-[180px] md:h-[300px] flex overflow-hidden">
                <div className="relative w-[55%] md:w-[65%] h-full overflow-hidden" style={{ backgroundColor: config.themeColor }}>
                    <img
                        src={config.banner}
                        alt={config.title}
                        className="w-full h-full object-cover opacity-90 transition-transform duration-1000 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/20" />
                    <div className="absolute bottom-4 md:bottom-8 left-4 md:left-10">
                        <p className="text-white text-[10px] md:text-[14px] font-bold uppercase tracking-[0.4em] mb-1 opacity-80" style={{ color: config.accent }}>
                            {config.subtitle}
                        </p>
                    </div>
                </div>

                <div 
                    className="relative w-[45%] md:w-[35%] h-full flex flex-col items-center justify-center p-4 text-white"
                    style={{ background: `linear-gradient(135deg, ${config.themeColor} 0%, #000 100%)` }}
                >
                    <div className="absolute top-4 right-4 text-white/10 text-[40px]">✦</div>
                    <div className="text-center max-w-[280px]">
                        <h1 className="font-serif font-bold leading-tight mb-2 md:mb-4" style={{ fontSize: 'clamp(18px, 4vw, 36px)' }}>
                            {config.title}
                        </h1>
                        <div className="h-px w-12 bg-white/30 mx-auto mb-4" />
                        <div className="border border-white/20 rounded-lg px-3 md:px-6 py-3 md:py-5 bg-white/5 backdrop-blur-sm">
                            <p className="text-white/60 text-[8px] md:text-[11px] uppercase tracking-widest mb-1">Limited Time</p>
                            <h2 className="font-black text-[18px] md:text-[28px] leading-tight mb-1" style={{ color: config.accent }}>
                                {config.offer}
                            </h2>
                            <p className="text-white/50 text-[7px] md:text-[10px] mb-4 uppercase tracking-tighter">
                                {config.offerDesc}
                            </p>
                            <button 
                                onMouseEnter={() => setShopNowHover(true)}
                                onMouseLeave={() => setShopNowHover(false)}
                                className="inline-flex items-center gap-2 bg-white text-black text-[8px] md:text-[12px] font-black uppercase tracking-widest px-4 md:px-6 py-2 md:py-3 rounded-full hover:bg-opacity-90 transition-all"
                            >
                                Shop All
                                <ArrowRight className={`w-3 h-3 transition-all ${shopNowHover ? 'translate-x-1' : ''}`} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* PRODUCTS */}
            <div className="container mx-auto px-4 py-16 max-w-7xl">
                <div className="flex items-center justify-between mb-10 pb-4 border-b border-gray-100">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Curated Designs</h2>
                        <p className="text-gray-400 text-sm mt-1 uppercase tracking-widest font-medium">Filtered for {bondId}</p>
                    </div>
                    <Link to="/shop" className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-black transition-all">
                        View All
                    </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {filteredProducts.map((p) => (
                        <motion.div 
                            key={p.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <ProductCard product={p} />
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BondCollectionPage;

