import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { resolveLegacyCmsAsset } from '../utils/legacyCmsAssets';

import solitaireImg from '@assets/categories/gold_rings_green.png';
import statementImg from '@assets/categories/gold_sets_green.png';

const fallbackCards = [
    {
        id: 'gold-exclusive-1',
        title: 'SOULitaire',
        subtitle: 'Solitaire Collection',
        image: solitaireImg,
        path: '/shop?search=solitaire&metal=gold'
    },
    {
        id: 'gold-exclusive-2',
        title: 'Beyond Bold',
        subtitle: 'Statement Collection',
        image: statementImg,
        path: '/shop?search=statement&metal=gold'
    }
];

const ensureGoldPath = (rawPath = '', categoryId = '') => {
    const normalizedCategoryId = String(categoryId || '').trim();
    if (normalizedCategoryId) return `/shop?metal=gold&category=${encodeURIComponent(normalizedCategoryId)}`;

    const source = String(rawPath || '').trim();
    if (!source) return '/shop?metal=gold';
    if (!source.startsWith('/shop')) return source;
    if (/([?&])metal=gold(&|$)/i.test(source)) return source;
    return `${source}${source.includes('?') ? '&' : '?'}metal=gold`;
};

const GoldExclusiveLaunch = ({ sectionData = null }) => {
    const navigate = useNavigate();

    const cards = useMemo(() => {
        const configured = Array.isArray(sectionData?.items) ? sectionData.items : [];
        if (configured.length === 0) return fallbackCards;

        return configured.slice(0, 2).map((item, idx) => ({
            id: item?.itemId || item?.id || `gold-exclusive-${idx + 1}`,
            title: item?.name || item?.label || fallbackCards[idx % fallbackCards.length].title,
            subtitle: item?.subtitle || item?.description || fallbackColors[idx % fallbackColors.length].subtitle,
            image: resolveLegacyCmsAsset(item?.image, fallbackCards[idx % fallbackCards.length].image),
            path: ensureGoldPath(item?.path || fallbackCards[idx % fallbackCards.length].path, item?.categoryId)
        }));
    }, [sectionData]);

    const heading = String(sectionData?.settings?.title || sectionData?.label || 'Exclusive Collection Launch').trim() || 'Exclusive Collection Launch';
    const ctaPath = ensureGoldPath(String(sectionData?.settings?.ctaPath || '/shop?new_arrival=true&metal=gold').trim() || '/shop?new_arrival=true&metal=gold');

    return (
        <section className="w-full py-10 bg-white relative overflow-hidden">
            {/* Background luxury elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#B8860B]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            
            <div className="max-w-[1450px] mx-auto px-6">
                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                    {/* Left Side Heading */}
                    <motion.div 
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="lg:w-[240px] flex flex-col items-start shrink-0"
                    >
                        <span className="text-[11px] uppercase tracking-[0.4em] text-[#B8860B] font-bold mb-4">
                            New Arrivals
                        </span>
                        <h2 className="text-3xl md:text-4xl font-display leading-[1.2] text-[#111] mb-8">
                            {heading}
                        </h2>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="group flex items-center gap-4 cursor-pointer p-1"
                            onClick={() => navigate(ctaPath)}
                        >
                            <div className="w-14 h-14 flex items-center justify-center border-2 border-gray-100 rounded-full group-hover:border-[#B8860B] group-hover:bg-[#B8860B] transition-all duration-500 shadow-sm">
                                <ArrowRight className="w-6 h-6 text-gray-900 group-hover:text-white transition-colors duration-500" />
                            </div>
                            <span className="text-[12px] uppercase tracking-widest font-bold text-[#111] opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                View All
                            </span>
                        </motion.button>
                    </motion.div>

                    {/* Right Side Cards */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                        {cards.map((card, idx) => (
                            <motion.div
                                key={card.id}
                                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 1, delay: idx * 0.2, ease: [0.16, 1, 0.3, 1] }}
                                onClick={() => navigate(card.path)}
                                className="relative h-[150px] md:h-[210px] rounded-[32px] overflow-hidden group cursor-pointer shadow-[0_20px_50px_rgba(0,0,0,0.1)] bg-[#0A1A12]"
                            >
                                {/* Image Layer with Parallax-like Zoom */}
                                <div className="absolute inset-0 z-0">
                                    <img
                                        src={card.image}
                                        alt={card.title}
                                        className="w-full h-full object-cover scale-[1.05] group-hover:scale-125 transition-transform duration-[2.5s] ease-out opacity-80 group-hover:opacity-100"
                                    />
                                    {/* Multi-layered overlays for depth */}
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-700" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                                </div>

                                {/* Luxury Glow Effect on Hover */}
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 bg-[radial-gradient(circle_at_center,rgba(184,134,11,0.15)_0%,transparent_70%)]" />

                                {/* Center Content with reveal animation */}
                                <div className="relative h-full w-full flex flex-col items-center justify-center z-10 text-center p-6">
                                    <motion.div
                                        initial={{ opacity: 0, y: 15 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.4 + idx * 0.1, duration: 0.8 }}
                                        className="overflow-hidden"
                                    >
                                        <h3 className="text-white text-xl md:text-3xl font-display tracking-[0.15em] uppercase mb-2 [text-shadow:0_4px_12px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform duration-1000">
                                            {card.title}
                                        </h3>
                                    </motion.div>
                                    
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        whileInView={{ opacity: 1 }}
                                        transition={{ delay: 0.6 + idx * 0.1, duration: 0.8 }}
                                    >
                                        <p className="text-white/80 text-[9px] md:text-[11px] uppercase tracking-[0.5em] font-medium mb-4 [text-shadow:0_2px_4px_rgba(0,0,0,0.3)]">
                                            {card.subtitle}
                                        </p>
                                    </motion.div>

                                    {/* Hover Action Button (Floating Look) */}
                                    <motion.div 
                                        className="opacity-0 group-hover:opacity-100 translate-y-3 group-hover:translate-y-0 transition-all duration-700 delay-200"
                                    >
                                        <div className="px-5 py-1.5 border border-white/40 rounded-full text-white text-[8px] uppercase tracking-[0.25em] backdrop-blur-md bg-white/5 hover:bg-white hover:text-black transition-all duration-500 shadow-xl">
                                            Explore
                                        </div>
                                    </motion.div>
                                </div>

                                {/* Corner Decorative Elements */}
                                <div className="absolute top-5 left-5 w-10 h-10 border-t-[1.5px] border-l-[1.5px] border-white/20 rounded-tl-2xl transition-all duration-1000 group-hover:w-full group-hover:h-full group-hover:border-white/5" />
                                <div className="absolute bottom-5 right-5 w-10 h-10 border-b-[1.5px] border-r-[1.5px] border-white/20 rounded-br-2xl transition-all duration-1000 group-hover:w-full group-hover:h-full group-hover:border-white/5" />

                                {/* Glassmorphism Shimmer */}
                                <div className="absolute inset-0 z-20 pointer-events-none">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-[1.8s] ease-in-out" />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default GoldExclusiveLaunch;
