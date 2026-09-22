import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ArrowLeft } from 'lucide-react';

// Import assets for banners and purities
import goldBanner from '@assets/hero/modern_gold_fusion.png';
import silverBanner from '@assets/hero/sterling_silver_heritage.png';
import diamondBanner from '@assets/hero/eternal_diamond_brilliance.png';
import purity24k from '@assets/categories/sets.png';
import purity22k from '@assets/categories/bangle.png';
import purity18k from '@assets/categories/rings.png';
import purity14k from '@assets/categories/earrings.png';
import puritySterling from '@assets/categories/pendants.png';
import purityFine from '@assets/categories/anklets.png';

const AllJewelleryMegaMenu = ({ resetMenu, initialView = 'main', availableHeight, maxWidth }) => {
    const [view, setView] = useState(initialView); // 'main', 'gold', 'silver'

    const goldPurities = [
        // Shop.jsx expects `metal=gold` + `karat=14|18|22|24`
        { id: '24k', name: '24K GOLD', sub: 'PURE 99.9% GOLD', image: purity24k, path: '/shop?metal=gold&karat=24' },
        { id: '22k', name: '22K GOLD', sub: 'PREMIUM HALLMARKED', image: purity22k, path: '/shop?metal=gold&karat=22' },
        { id: '18k', name: '18K GOLD', sub: 'LUXURY DESIGN', image: purity18k, path: '/shop?metal=gold&karat=18' },
        { id: '14k', name: '14K GOLD', sub: 'DAILY ELEGANCE', image: purity14k, path: '/shop?metal=gold&karat=14' },
    ];

    const silverPurities = [
        // Shop.jsx expects `metal=silver` + `silver_type=fine|sterling`
        { id: '925', name: 'STERLING SILVER', sub: '925 HALLMARKED', image: puritySterling, path: '/shop?metal=silver&silver_type=sterling' },
        { id: 'fine', name: 'FINE SILVER', sub: 'PURE & SIMPLE', image: purityFine, path: '/shop?metal=silver&silver_type=fine' },
    ];

    return (
        <div 
            className="bg-white w-[820px] max-w-[calc(100vw-2rem)] min-w-0 shadow-2xl border border-gray-100 overflow-hidden relative rounded-b-2xl flex flex-col"
            style={{
                maxHeight: availableHeight ? `${availableHeight}px` : 'min(520px, calc(100vh - 140px))',
                width: maxWidth ? `${maxWidth}px` : undefined,
            }}
            data-lenis-prevent
            onWheel={(e) => e.stopPropagation()}
        >
            <div 
                className="flex-1 overflow-y-auto custom-scrollbar min-h-0 h-full overscroll-contain"
                data-lenis-prevent
                onWheel={(e) => e.stopPropagation()}
                style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#C59B27 transparent',
                }}
            >
                <AnimatePresence mode="wait">
                    {view === 'main' && (
                        <motion.div
                            key="main"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="p-4 sm:p-5 lg:p-6"
                        >
                            <h3 className="text-[#C59B27] text-[10.5px] sm:text-[11px] font-black uppercase tracking-[0.25em] mb-3 sm:mb-4">
                                Explore Metal Collections
                            </h3>

                            <div className="flex flex-col gap-2.5 sm:gap-3.5">
                                {/* Gold Collection Banner */}
                                <div 
                                    onClick={() => setView('gold')}
                                    className="group relative h-[100px] sm:h-[110px] lg:h-[118px] rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-all duration-300"
                                >
                                    <img src={goldBanner} alt="Gold" className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />
                                    <div className="absolute inset-y-0 left-5 sm:left-8 flex flex-col justify-center text-white">
                                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-0.5 sm:mb-1">GOLD COLLECTION</h2>
                                        <p className="text-[10px] sm:text-[11px] font-medium opacity-80 tracking-widest uppercase">Pure 24K • 22K • 18K • 14K</p>
                                    </div>
                                    <div className="absolute right-5 sm:right-8 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 group-hover:bg-white/40 transition-all">
                                        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                    </div>
                                </div>

                                {/* Silver Collection Banner */}
                                <div 
                                    onClick={() => setView('silver')}
                                    className="group relative h-[90px] sm:h-[100px] lg:h-[106px] rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-all duration-300"
                                >
                                    <img src={silverBanner} alt="Silver" className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
                                    <div className="absolute inset-y-0 left-5 sm:left-8 flex flex-col justify-center text-white">
                                        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight mb-0.5 sm:mb-1">SILVER COLLECTION</h2>
                                        <p className="text-[10px] sm:text-[11px] font-medium opacity-80 tracking-widest uppercase">925 Sterling • Fine Silver</p>
                                    </div>
                                    <div className="absolute right-5 sm:right-8 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 group-hover:bg-white/40 transition-all">
                                        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                    </div>
                                </div>

                                {/* Diamond Collection Banner */}
                                <Link 
                                    to="/diamond-collection"
                                    onClick={resetMenu}
                                    className="group relative h-[90px] sm:h-[100px] lg:h-[106px] rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-all duration-300 block"
                                >
                                    <img src={diamondBanner} alt="Diamond" className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
                                    <div className="absolute inset-y-0 left-5 sm:left-8 flex flex-col justify-center text-white">
                                        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight mb-0.5 sm:mb-1">DIAMOND COLLECTION</h2>
                                        <p className="text-[10px] sm:text-[11px] font-medium opacity-80 tracking-widest uppercase">Natural & Lab-Grown • Certified Brilliance</p>
                                    </div>
                                    <div className="absolute right-5 sm:right-8 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 group-hover:bg-white/40 transition-all">
                                        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                    </div>
                                </Link>
                            </div>
                        </motion.div>
                    )}

                    {view === 'gold' && (
                        <motion.div
                            key="gold"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="p-4 sm:p-6 bg-[#FFFDF7]"
                        >
                            <button 
                                onClick={() => setView('main')}
                                className="flex items-center gap-2.5 sm:gap-3 text-[#B88B4A] font-bold text-[10.5px] sm:text-[11px] uppercase tracking-[0.2em] mb-4 sm:mb-6 hover:translate-x-[-4px] transition-transform"
                            >
                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#B88B4A]/10 flex items-center justify-center">
                                    <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                </div>
                                Gold Purities
                            </button>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-[800px] mx-auto">
                                {goldPurities.map((item) => (
                                    <Link 
                                        key={item.id} 
                                        to={item.path} 
                                        onClick={resetMenu}
                                        className="group flex flex-col bg-white rounded-lg sm:rounded-xl overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md border border-gray-100 h-full"
                                    >
                                        <div className="w-full aspect-square overflow-hidden bg-[#FAF3F0]">
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                        </div>
                                        <div className="p-2 sm:p-2.5 mt-auto">
                                            <div className="w-full bg-[#B88B4A] text-white py-1.5 sm:py-2 text-center text-[8.5px] sm:text-[9px] font-bold uppercase tracking-widest transition-colors group-hover:bg-[#96713A] rounded">
                                                {item.name}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {view === 'silver' && (
                        <motion.div
                            key="silver"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="p-4 sm:p-6 bg-[#F9FAFB]"
                        >
                            <button 
                                onClick={() => setView('main')}
                                className="flex items-center gap-2.5 sm:gap-3 text-[#64748B] font-bold text-[10.5px] sm:text-[11px] uppercase tracking-[0.2em] mb-4 sm:mb-6 hover:translate-x-[-4px] transition-transform"
                            >
                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                    <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                </div>
                                Silver Purities
                            </button>

                            <div className="grid grid-cols-2 gap-3 sm:gap-5 max-w-[440px] mx-auto">
                                {silverPurities.map((item) => (
                                    <Link 
                                        key={item.id} 
                                        to={item.path} 
                                        onClick={resetMenu}
                                        className="group flex flex-col bg-white rounded-lg sm:rounded-xl overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md border border-gray-100 h-full"
                                    >
                                        <div className="w-full aspect-square overflow-hidden bg-[#F3F4F6]">
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                        </div>
                                        <div className="p-2.5 sm:p-3 mt-auto">
                                            <div className="w-full bg-[#64748B] text-white py-2 sm:py-2.5 text-center text-[10px] sm:text-[11px] font-bold uppercase tracking-widest transition-colors group-hover:bg-[#475569] rounded">
                                                {item.name}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default AllJewelleryMegaMenu;

