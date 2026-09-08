import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

// Import assets
import imgTopLeft from '@assets/banner_daily.png';
import imgBottomLeft from '@assets/banner_elegant_silver.png';
import imgRight from '@assets/cat_bracelets.png';

const PromoBannersSection = () => {
    return (
        <section className="w-full bg-white py-6 px-4 md:px-12 overflow-hidden">
            <div className="max-w-[1450px] mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 h-auto lg:h-[400px]">
                    
                    {/* Left Stack - Square & Compact */}
                    <div className="flex flex-col gap-5 h-full">
                        
                        {/* 1. Top-Left */}
                        <Link to="/shop?sort=latest" className="relative group block h-full overflow-hidden rounded-none shadow-sm bg-[#F5EFE6]">
                            <motion.div whileHover={{ scale: 1.02 }} className="w-full h-full relative">
                                <img 
                                    src={imgTopLeft} 
                                    className="w-full h-full object-cover object-[50%_15%]" 
                                    alt="Fresh Arrivals" 
                                />
                                <div className="absolute inset-0 bg-black/5" />
                                
                                <div className="absolute top-5 left-6">
                                    <h3 className="text-xl md:text-2xl font-serif italic text-[#141211]">
                                        Fresh Arrivals
                                    </h3>
                                </div>
                                <div className="absolute bottom-5 left-6">
                                    <span className="bg-[#C59B27] text-white px-5 py-1.5 rounded-none text-[9px] font-bold uppercase tracking-widest shadow-sm">
                                        Explore now
                                    </span>
                                </div>
                            </motion.div>
                        </Link>

                        {/* 2. Bottom-Left */}
                        <Link to="/shop?metal=silver" className="relative group block h-full overflow-hidden rounded-none shadow-sm bg-[#FAF8F5]">
                            <motion.div whileHover={{ scale: 1.02 }} className="w-full h-full relative">
                                <img 
                                    src={imgBottomLeft} 
                                    className="w-full h-full object-cover" 
                                    alt="Silver Bliss" 
                                />
                                <div className="absolute inset-0 bg-black/15 flex flex-col items-center justify-center text-center p-3">
                                    <h3 className="text-white text-2xl font-serif italic">All yours</h3>
                                    <p className="text-white text-[9px] tracking-widest uppercase mb-1">Emotion, made real</p>
                                    <div className="bg-black/20 backdrop-blur-sm px-3 py-1 rounded-none border border-white/10 mt-1">
                                        <p className="text-white text-[10px]">Pure Silver Gems</p>
                                    </div>
                                </div>
                            </motion.div>
                        </Link>
                    </div>

                    {/* Right Banner - Square & Compact */}
                    <Link to="/shop?sort=most-sold" className="relative group block h-full overflow-hidden rounded-none shadow-md">
                        <motion.div 
                            whileHover={{ scale: 1.02 }} 
                            className="w-full h-full relative overflow-hidden"
                            style={{ background: 'linear-gradient(135deg, #FAF8F5 0%, #E8DFD0 100%)' }}
                        >
                            <div className="absolute top-6 left-8 z-10">
                                <h3 className="text-3xl md:text-4xl font-serif italic text-[#141211]">Bestsellers</h3>
                                <p className="text-stone-600 text-xs md:text-sm">most loved silver picks</p>
                            </div>

                            {/* Centered Product Image */}
                            <div className="absolute inset-0 flex items-center justify-center p-8 mt-12">
                                <img 
                                    src={imgRight} 
                                    className="max-w-[75%] max-h-[75%] object-contain drop-shadow-xl" 
                                    alt="Swarna Sparsh Jewelry" 
                                />
                            </div>

                            {/* Center Branding Overlay - Scaled Down */}
                            <div className="absolute bottom-[28%] left-1/2 -translate-x-1/2 z-20">
                                <div className="bg-white/95 backdrop-blur-md px-6 py-2 rounded-none shadow-md border border-[#E8DFD0]">
                                    <span className="text-[#141211] font-black text-sm tracking-[0.35em]">SWARNA SPARSH</span>
                                </div>
                            </div>

                            <div className="absolute bottom-6 right-8 z-10">
                                <span className="bg-white text-black text-[9px] font-bold uppercase tracking-widest px-6 py-2.5 rounded-none shadow-sm">
                                    Shop now
                                </span>
                            </div>
                        </motion.div>
                    </Link>

                </div>
            </div>
        </section>
    );
};

export default PromoBannersSection;

