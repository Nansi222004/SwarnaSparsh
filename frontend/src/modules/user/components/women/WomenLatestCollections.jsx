import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Import assets
import valentineBanner from '@assets/latest_collections/valentine_banner.png';
import glowBanner from '@assets/latest_collections/glow_banner.png';
import thumb1 from '@assets/latest_collections/thumb_1.png';
import thumb2 from '@assets/latest_collections/thumb_2.png';
import thumb3 from '@assets/latest_collections/thumb_3.png';
import thumb4 from '@assets/latest_collections/thumb_4.png';
import thumb5 from '@assets/latest_collections/thumb_5.png';
import thumb6 from '@assets/latest_collections/thumb_6.png';

const collections = [
    {
        id: 1,
        title: "All yours Collection",
        subtitle: "Emotion, made real",
        description: "Our Valentine's Day silver jewellery, crafted with ice-cut stones",
        image: valentineBanner,
        thumbs: [thumb1, thumb2, thumb3],
        theme: 'romantic'
    },
    {
        id: 2,
        title: "Glow In New",
        subtitle: "Motion COLLECTION",
        description: "Experience the brilliance of our latest arrivals",
        image: glowBanner,
        thumbs: [thumb4, thumb5, thumb6],
        theme: 'luxury'
    }
];

const WomenLatestCollections = () => {
    const scrollRef = useRef(null);

    const scroll = (direction) => {
        if (scrollRef.current) {
            const { clientWidth } = scrollRef.current;
            const scrollAmount = direction === 'left' ? -clientWidth / 1.5 : clientWidth / 1.5;
            scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    return (
        <section className="py-6 md:py-8 bg-white overflow-hidden">
            <div className="max-w-[1500px] mx-auto px-4 md:pl-12 md:pr-0">
                
                {/* Header */}
                <div className="flex items-center justify-between mb-6 md:mb-8 pr-4 md:pr-12">
                    <h2 className="text-2xl md:text-3xl font-serif text-zinc-900 tracking-tight">
                        Latest Collections
                    </h2>
                    <div className="flex gap-2">
                        <button onClick={() => scroll('left')} className="p-2 rounded-full border border-zinc-200 hover:bg-zinc-50 transition-colors">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button onClick={() => scroll('next')} className="p-2 rounded-full border border-zinc-200 hover:bg-zinc-50 transition-colors">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div 
                    ref={scrollRef}
                    className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide pb-8 snap-x snap-mandatory"
                >
                    {collections.map((item, idx) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: idx * 0.1 }}
                            className="flex-shrink-0 w-[85vw] md:w-[600px] h-[300px] md:h-[380px] relative rounded-[2rem] md:rounded-[2.5rem] overflow-hidden group snap-start shadow-xl"
                        >
                            {/* Background Image */}
                            <img 
                                src={item.image} 
                                alt={item.title}
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-[5s] group-hover:scale-110"
                            />
                            
                            {/* Dynamic Gradient Overlay */}
                            <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent`} />

                            {/* Text Content */}
                            <div className="absolute inset-x-0 bottom-0 p-6 md:p-10 flex flex-col justify-end">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.3 }}
                                >
                                    <h3 className="text-3xl md:text-5xl font-display text-white leading-tight mb-1" style={{ fontFamily: "'Cinzel', serif", fontWeight: 700 }}>
                                        {item.title.split(' ')[0]} <span className="text-white/80 italic font-serif text-2xl md:text-4xl">{item.title.split(' ').slice(1).join(' ')}</span>
                                    </h3>
                                    <p className="text-[#E8D198] text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mb-4">
                                        {item.subtitle}
                                    </p>
                                    
                                    {/* Thumbs - Small and tight at the bottom corner */}
                                    <div className="flex gap-2">
                                        {item.thumbs.map((thumb, tIdx) => (
                                            <div key={tIdx} className="w-12 h-12 md:w-16 md:h-16 bg-white/95 rounded-xl md:rounded-2xl p-1.5 shadow-lg border border-white/20">
                                                <img src={thumb} alt="thumb" className="w-full h-full object-contain" />
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>
                    ))}
                    
                    {/* Placeholder for "shimmer" or extra card */}
                    <div className="flex-shrink-0 w-20 h-10 invisible" />
                </div>
            </div>
        </section>
    );
};

export default WomenLatestCollections;

