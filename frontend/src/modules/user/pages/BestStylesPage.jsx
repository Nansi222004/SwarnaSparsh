import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Star } from 'lucide-react';
import { useShop } from '../../../context/ShopContext';
import ProductCard from '../components/ProductCard';

// Placeholder Banner (since image generation is unavailable)
import bannerHero from '@assets/banner_party.png'; 

const BestStylesPage = () => {
    const { products } = useShop();
    const [shopNowHover, setShopNowHover] = useState(false);
    const navigate = useNavigate();

    const filteredProducts = useMemo(() => {
        const list = Array.isArray(products) ? products : [];
        const valid = list.filter((p) => (p?.id || p?._id) && p?.name);

        const score = (p) => {
            const trending = (p?.isTrending || p?.tags?.isTrending) ? 1000 : 0;
            const rating = Number(p?.rating || 0) * 100;
            const reviews = Number(p?.reviewCount || p?.reviews || 0);
            const ts = new Date(p?.createdAt || p?.updatedAt || 0).getTime() || 0;
            return trending + rating + Math.min(reviews, 999) + (ts / 1e12);
        };

        return [...valid].sort((a, b) => score(b) - score(a)).slice(0, 20);
    }, [products]);

    useEffect(() => {
        
    }, []);

    return (
        <div className="bg-white min-h-screen">
            {/* HERO BANNER SECTION (The "Boutique Flow") */}
            <div className="w-full h-[200px] md:h-[350px] flex overflow-hidden">
                <div className="relative w-[60%] md:w-[65%] h-full overflow-hidden bg-[#1D1D1D]">
                    <img
                        src={bannerHero}
                        alt="Best Styles"
                        className="w-full h-full object-cover opacity-80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/20" />
                    <div className="absolute bottom-6 md:bottom-12 left-6 md:left-14">
                        <p className="text-[#E8D198] text-[10px] md:text-[16px] font-bold uppercase tracking-[0.5em] mb-2">
                            PREMIUM SELECTION
                        </p>
                    </div>
                </div>

                <div 
                    className="relative w-[40%] md:w-[35%] h-full flex flex-col items-center justify-center p-6 text-white"
                    style={{ background: 'linear-gradient(135deg, #1C1917 0%, #141211 100%)' }}
                >
                    <div className="absolute top-6 right-6 text-white/5 text-[50px] select-none">✦</div>
                    <div className="text-center">
                        <h1 className="font-serif font-bold leading-tight mb-4" style={{ fontSize: 'clamp(20px, 5vw, 42px)' }}>
                            Best Styles
                        </h1>
                        <p className="text-white/60 text-[8px] md:text-[12px] uppercase tracking-[0.2em] mb-6">
                            Luxury Crafted for Minimalists
                        </p>
                        <div className="h-px w-16 bg-[#C59B27] mx-auto mb-8" />
                        
                        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 md:p-8 border border-white/10">
                            <h2 className="text-[24px] md:text-[40px] font-black text-[#E8D198] leading-none mb-2">
                                UPTO 50% OFF
                            </h2>
                            <p className="text-white/40 text-[7px] md:text-[10px] uppercase tracking-widest mb-6">
                                Seasonal Favourites Only
                            </p>
                            <button 
                                onClick={() => navigate('/shop')}
                                onMouseEnter={() => setShopNowHover(true)}
                                onMouseLeave={() => setShopNowHover(false)}
                                className="bg-white text-[#141211] px-8 py-3 rounded-full text-[9px] md:text-[12px] font-bold uppercase tracking-widest hover:bg-[#C59B27] hover:text-[#141211] transition-all flex items-center gap-2 mx-auto"
                            >
                                Shop All
                                <ArrowRight className={`w-4 h-4 transition-transform ${shopNowHover ? 'translate-x-1' : ''}`} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* PRODUCT GRID SECTION */}
            <div className="container mx-auto px-4 py-20 max-w-[1450px]">
                <div className="flex flex-col md:flex-row items-center justify-between mb-12 pb-6 border-b border-gray-100 gap-4">
                    <div className="text-center md:text-left">
                        <h2 className="text-3xl md:text-4xl font-serif font-medium text-gray-900 tracking-tight">Best Sellers</h2>
                        <p className="text-gray-400 text-xs mt-2 uppercase tracking-[0.3em] font-semibold">Our most-loved pieces, curated for you</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-gray-900 font-bold text-sm tracking-widest uppercase">{filteredProducts.length} Items</span>
                        <div className="h-10 w-px bg-gray-200 hidden md:block" />
                        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-black transition-all group font-bold uppercase tracking-widest text-[10px]">
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Back
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
                    {filteredProducts.map((product, idx) => (
                        <motion.div
                            key={product.id || product._id || `best-style-${idx}`}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: (idx % 4) * 0.1 }}
                            viewport={{ once: true }}
                        >
                            <ProductCard product={product} />
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BestStylesPage;

