import React, { useMemo, useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { resolveLegacyCmsAsset } from '../utils/legacyCmsAssets';

import customer1 from '@assets/testimonial_customer_1.png';
import customer2 from '@assets/testimonial_customer_2.png';
import customer3 from '@assets/testimonial_customer_3.png';

const GOLD_TESTIMONIALS = [
    {
        id: 1,
        name: 'Shashi',
        subtitle: 'Verified Buyer',
        location: 'Mumbai',
        rating: 5,
        image: customer1,
        text: 'This time for our 5th year anniversary I wanted to gift her something different. Glad I got to custom make a modern solitaire ring for her...simple yet different, and exactly what I had pictured.'
    },
    {
        id: 2,
        name: 'Renuka',
        subtitle: 'Verified Buyer',
        location: 'Mumbai',
        rating: 5,
        image: customer2,
        text: 'Most gold rings for men look dated. I wanted to gift him something that matches the wedding ring he got me too. Finally got to know Swarna Sparsh\'s gold made-to-order option.'
    },
    {
        id: 3,
        name: 'Priya',
        subtitle: 'Verified Buyer',
        location: 'Mumbai',
        rating: 5,
        image: customer3,
        text: 'Wanted something special and matchy for my sister. So I got these rings custom-made with our coloured diamonds. And well, diamonds are a girl\'s best friend for a reason!'
    }
];

const GoldTestimonials = ({ sectionData = null }) => {
    const scrollRef = useRef(null);
    const [showArrows, setShowArrows] = useState(false);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const testimonials = useMemo(() => {
        const configured = Array.isArray(sectionData?.items) ? sectionData.items : [];
        if (configured.length === 0) return GOLD_TESTIMONIALS;

        return configured.map((item, idx) => ({
            id: item?.itemId || item?.id || `gold-testimonial-${idx + 1}`,
            name: item?.name || GOLD_TESTIMONIALS[idx % GOLD_TESTIMONIALS.length].name,
            subtitle: item?.subtitle || GOLD_TESTIMONIALS[idx % GOLD_TESTIMONIALS.length].subtitle || '',
            location: item?.location || GOLD_TESTIMONIALS[idx % GOLD_TESTIMONIALS.length].location || '',
            rating: Number(item?.rating) || 5,
            image: resolveLegacyCmsAsset(item?.image, GOLD_TESTIMONIALS[idx % GOLD_TESTIMONIALS.length].image),
            text: item?.description || item?.text || GOLD_TESTIMONIALS[idx % GOLD_TESTIMONIALS.length].text
        }));
    }, [sectionData]);

    const checkScroll = () => {
        if (!scrollRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setCanScrollLeft(scrollLeft > 10);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
        setShowArrows(scrollWidth > clientWidth);
    };

    useEffect(() => {
        checkScroll();
        window.addEventListener('resize', checkScroll);
        return () => window.removeEventListener('resize', checkScroll);
    }, [testimonials]);

    const scroll = (direction) => {
        if (!scrollRef.current) return;
        const scrollAmount = 320;
        scrollRef.current.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth'
        });
    };

    const heading = String(sectionData?.settings?.title || sectionData?.label || 'Moments, Made by Heer').trim();

    return (
        <section
            className="w-full pt-10 pb-12 overflow-hidden select-none relative"
            style={{ background: 'linear-gradient(135deg, #D6EDE9 0%, #E8F5F2 100%)' }}
        >
            <div className="container mx-auto px-4 mb-8 text-center">
                <h2 className="text-[28px] md:text-[42px] font-serif text-[#1e1e1e] font-light leading-tight">
                    {heading}
                </h2>
            </div>

            <div className="relative group max-w-[1450px] mx-auto">
                <AnimatePresence>
                    {showArrows && canScrollLeft && (
                        <motion.button
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            onClick={() => scroll('left')}
                            className="absolute left-4 top-[100px] md:top-[120px] z-20 w-11 h-11 rounded-full bg-white/90 backdrop-blur-sm border border-[#D6EDE9] text-[#2A4D35] flex items-center justify-center shadow-md hover:bg-white transition-all hidden md:flex"
                        >
                            <ChevronLeft size={22} />
                        </motion.button>
                    )}

                    {showArrows && canScrollRight && (
                        <motion.button
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            onClick={() => scroll('right')}
                            className="absolute right-4 top-[100px] md:top-[120px] z-20 w-11 h-11 rounded-full bg-white/90 backdrop-blur-sm border border-[#D6EDE9] text-[#2A4D35] flex items-center justify-center shadow-md hover:bg-white transition-all hidden md:flex"
                        >
                            <ChevronRight size={22} />
                        </motion.button>
                    )}
                </AnimatePresence>

                <div
                    ref={scrollRef}
                    onScroll={checkScroll}
                    className={`flex overflow-x-auto gap-8 px-6 md:px-12 pb-10 scrollbar-hide snap-x snap-mandatory ${
                        !showArrows ? 'md:justify-center' : 'justify-start'
                    }`}
                >
                    {testimonials.map((item, idx) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: idx * 0.1 }}
                            className="flex-shrink-0 w-[260px] md:w-[300px] snap-center flex flex-col"
                        >
                            <div className="bg-white rounded-[28px] p-6 md:p-9 flex flex-col items-center justify-center text-center shadow-sm min-h-[220px] md:min-h-[260px] relative border border-white/60">
                                {/* Rating Stars */}
                                <div className="flex gap-0.5 mb-4">
                                    {[...Array(5)].map((_, i) => (
                                        <Star 
                                            key={i} 
                                            size={14} 
                                            className={`${i < item.rating ? 'text-[#D4AF37] fill-[#D4AF37]' : 'text-gray-200'}`} 
                                        />
                                    ))}
                                </div>

                                <p className="text-[#444] font-serif italic text-sm md:text-base leading-relaxed mb-4">
                                    "{item.text}"
                                </p>

                                <div className="absolute bottom-0 translate-y-1/2 left-1/2 -translate-x-1/2 w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-4 border-[#E8F5F2] shadow-md z-10 bg-white">
                                    <img
                                        src={item.image}
                                        alt={item.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>

                            <div className="mt-14 md:mt-16 text-center">
                                <h4 className="text-[#1e1e1e] font-serif font-bold text-base md:text-lg">
                                    {item.name}
                                </h4>
                                {(item.subtitle || item.location) && (
                                    <p className="text-gray-500 text-[10px] md:text-xs uppercase tracking-widest mt-1 font-semibold">
                                        {[item.subtitle, item.location].filter(Boolean).join(' • ')}
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}} />
        </section>
    );
};

export default GoldTestimonials;
