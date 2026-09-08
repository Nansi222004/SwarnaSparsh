import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { resolveLegacyCmsAsset } from '../utils/legacyCmsAssets';

import yellowImg from '@assets/gold_color_yellow.png';
import roseImg from '@assets/gold_color_rose.png';
import whiteImg from '@assets/gold_color_white.png';
import dualImg from '@assets/gold_color_dual.png';

const fallbackColors = [
    { id: 'yellow', name: 'Yellow Gold', image: yellowImg, path: '/shop?metal=gold&search=Yellow Gold', gradient: 'bg-gradient-to-tr from-[#DEB36D] to-[#F7E2AF]' },
    { id: 'rose', name: 'Rose Gold', image: roseImg, path: '/shop?metal=gold&search=Rose Gold', gradient: 'bg-gradient-to-tr from-[#E6A0A0] to-[#FAD4D4]' },
    { id: 'white', name: 'White Gold', image: whiteImg, path: '/shop?metal=gold&search=White Gold', gradient: 'bg-gradient-to-tr from-[#C0C0C0] to-[#E8E8E8]' },
    { id: 'dual', name: 'Dual tone Gold', image: dualImg, path: '/shop?metal=gold&search=Dual tone Gold', gradient: 'bg-gradient-to-tr from-[#E8C59A] via-[#E8E8E8] to-[#E6A0A0]' },
];

const ensureGoldCategoryPath = (rawPath, categoryId = '') => {
    const source = String(rawPath || '/shop').trim();
    const queryString = source.startsWith('/shop') && source.includes('?') ? source.split('?')[1] : '';
    const params = new URLSearchParams(queryString);
    params.set('metal', 'gold');
    const normalizedCategoryId = String(categoryId || '').trim();
    if (normalizedCategoryId) params.set('category', normalizedCategoryId);
    const query = params.toString();
    return `/shop${query ? `?${query}` : '?metal=gold'}`;
};

const GoldShopByColour = ({ sectionData = null }) => {
    const navigate = useNavigate();

    const colors = useMemo(() => {
        const configured = Array.isArray(sectionData?.items) ? sectionData.items : [];
        if (configured.length === 0) return fallbackColors;

        return configured.map((item, idx) => ({
            id: item?.itemId || item?.id || `gold-colour-${idx + 1}`,
            name: item?.name || item?.label || fallbackColors[idx % fallbackColors.length].name,
            image: resolveLegacyCmsAsset(item?.image, fallbackColors[idx % fallbackColors.length].image),
            path: ensureGoldCategoryPath(item?.path || fallbackColors[idx % fallbackColors.length].path, item?.categoryId || ''),
            gradient: item?.gradient || item?.colorCode || fallbackColors[idx % fallbackColors.length].gradient,
            // Add theme color for the stylish text
            textColor: item?.id === 'rose' || item?.name?.toLowerCase().includes('rose') ? 'text-[#E6A0A0]' : 
                      item?.id === 'white' || item?.name?.toLowerCase().includes('white') ? 'text-[#A0A0A0]' :
                      'text-[#B8860B]' 
        }));
    }, [sectionData]);

    const title = String(sectionData?.settings?.title || sectionData?.label || 'Shop by Colour').trim() || 'Shop by Colour';

    return (
        <section className="w-full py-24 bg-white relative overflow-hidden">
            {/* Abstract Background Elements */}
            <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#B8860B]/2 rounded-full blur-[120px] -translate-y-1/2" />
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#B8860B]/2 rounded-full blur-[100px] translate-y-1/2" />

            <div className="max-w-[1300px] mx-auto px-8 relative z-10">
                <div className="text-center mb-20">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        <h2 className="text-4xl md:text-6xl font-display text-[#111] mb-6 tracking-tight">
                            {title}
                        </h2>
                        <div className="flex items-center justify-center gap-6">
                            <div className="h-[0.5px] w-16 bg-[#B8860B]/30" />
                            <span className="text-[10px] md:text-[12px] uppercase tracking-[0.6em] text-[#B8860B] font-medium">
                                Discovery in Every Shade
                            </span>
                            <div className="h-[0.5px] w-16 bg-[#B8860B]/30" />
                        </div>
                    </motion.div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 lg:gap-16">
                    {colors.map((color, idx) => (
                        <motion.div
                            key={color.id}
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 1, delay: idx * 0.15, ease: [0.19, 1, 0.22, 1] }}
                            onClick={() => navigate(color.path)}
                            className="group cursor-pointer flex flex-col items-center"
                        >
                            {/* Card Container - No borders, sophisticated shadow */}
                            <div className="relative w-full aspect-square rounded-[40px] overflow-hidden bg-white shadow-[0_15px_45px_rgba(0,0,0,0.03)] transition-all duration-1000 group-hover:shadow-[0_40px_80px_rgba(184,134,11,0.15)] group-hover:-translate-y-4">
                                
                                {/* Image with refined zoom and subtle parallax-like effect */}
                                <img 
                                    src={color.image} 
                                    alt={color.name} 
                                    className="w-full h-full object-cover transform scale-105 group-hover:scale-125 transition-transform duration-[2s] ease-out" 
                                />

                                {/* Interactive Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-40 group-hover:opacity-60 transition-opacity duration-1000" />

                                {/* Color Indicator - Luxury Floating Badge */}
                                <div className="absolute bottom-8 right-8 z-20">
                                    <div className="relative">
                                        <div className={`w-11 h-11 md:w-14 md:h-14 rounded-full border-[3px] border-white shadow-[0_10px_25px_rgba(0,0,0,0.2)] ${color.gradient} transition-all duration-700 group-hover:scale-110 group-hover:-rotate-12`} />
                                        <div className="absolute inset-0 rounded-full bg-white/40 animate-ping opacity-0 group-hover:opacity-20 transition-opacity duration-1000" />
                                    </div>
                                </div>

                                {/* Shimmer Sweep effect */}
                                <div className="absolute inset-0 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-1000">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-[1.5s] ease-in-out" />
                                </div>
                            </div>

                            {/* Label Styling - Using font-display for 'Stylish' look */}
                            <div className="mt-10 text-center relative px-2">
                                <h3 className={`font-display text-[16px] md:text-[20px] tracking-[0.1em] transition-all duration-500 ${color.textColor} group-hover:scale-110`}>
                                    {color.name}
                                </h3>
                                
                                {/* Decorative underline like in the screenshot */}
                                <div className="mt-3 flex flex-col items-center">
                                    <motion.div 
                                        className="h-[1.5px] bg-[#B8860B]/60"
                                        initial={{ width: 0 }}
                                        whileInView={{ width: "24px" }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 1 + idx * 0.1, duration: 0.8 }}
                                    />
                                    <div className="h-[1px] w-0 bg-[#B8860B]/20 group-hover:w-32 transition-all duration-1000 ease-in-out mt-1" />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default GoldShopByColour;
