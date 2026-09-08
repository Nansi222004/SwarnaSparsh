import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

import catChoker from '@assets/cat_wedding_choker.png';
import catHaram from '@assets/cat_wedding_haram.png';
import catBangles from '@assets/cat_wedding_bangles.png';
import catDiamond from '@assets/cat_wedding_diamond.png';
import catMangalsutra from '@assets/cat_wedding_mangalsutra.png';
import catPremiumAll from '@assets/cat_all_premium.png';

const finalItems = [
    {
        id: 'wedding-choker',
        name: 'Wedding Choker',
        image: catChoker,
        path: '/shop?category=necklaces&style=choker',
    },
    {
        id: 'wedding-haram',
        name: 'Wedding Haram',
        image: catHaram,
        path: '/shop?category=necklaces&style=haram',
    },
    {
        id: 'wedding-bangles',
        name: 'Wedding Bangles',
        image: catBangles,
        path: '/shop?category=bracelets',
    },
    {
        id: 'wedding-diamond',
        name: 'Wedding Diamond',
        image: catDiamond,
        path: '/shop?filter=diamond',
    },
    {
        id: 'wedding-mangalsutra',
        name: 'Wedding Mangalsutra',
        image: catMangalsutra,
        path: '/shop?category=mangalsutra',
    },
    {
        id: 'accessories',
        name: 'Accessories',
        image: catPremiumAll,
        path: '/shop?category=accessories',
    }
];

const CategoryShowcase = () => {
    return (
        <section className="py-16 md:py-24 bg-white overflow-hidden">
            <div className="container mx-auto px-4 md:px-8 max-w-[1400px]">

                {/* Refined Header */}
                <div className="text-center mb-12 md:mb-16">
                    <h2 className="font-serif text-3xl md:text-5xl text-[#141211] mb-4 tracking-tight">Shop by Category</h2>
                    <p className="text-stone-500 text-sm md:text-base max-w-2xl mx-auto font-light leading-relaxed">
                        Discover our handcrafted jewellery masterpieces, each piece telling a unique story of timeless elegance.
                    </p>
                    <div className="w-12 h-[1px] bg-[#C59B27] mx-auto mt-6 opacity-60"></div>
                </div>

                {/* Redesigned Card Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 md:gap-8 overflow-x-auto pb-8 md:pb-0 scrollbar-hide">
                    {finalItems.map((cat, idx) => (
                        <motion.div
                            key={cat.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: idx * 0.1 }}
                        >
                            <Link to={cat.path} className="group block text-center">
                                {/* Card Body */}
                                <div className="relative aspect-square mb-4 transition-all duration-700">
                                    {/* Image with Custom Shape */}
                                    <div className="w-full h-full rounded-[2rem] overflow-hidden border border-stone-200/60 shadow-sm relative group-hover:shadow-[0_20px_40px_rgba(197,155,39,0.15)] group-hover:-translate-y-2 transition-all duration-500">
                                        <img
                                            src={cat.image}
                                            alt={cat.name}
                                            className="w-full h-full object-cover transition-transform duration-[1200ms] group-hover:scale-110"
                                        />
                                        
                                        {/* Subtle Hover Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#141211]/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                        
                                        {/* Premium Inside Border */}
                                        <div className="absolute inset-0 border-0 group-hover:border-[8px] border-white/10 transition-all duration-500 rounded-[2rem] pointer-events-none" />
                                    </div>

                                    {/* Quick Explore Button Hidden/Revealed */}
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500 z-20">
                                        <span className="bg-[#141211] text-[#E8D198] border border-[#C59B27]/40 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-xl whitespace-nowrap">
                                            Explore
                                        </span>
                                    </div>
                                </div>

                                {/* Professional Text */}
                                <h3 className="font-serif text-base md:text-lg text-stone-900 group-hover:text-[#C59B27] transition-colors duration-300 tracking-wide font-medium">
                                    {cat.name}
                                </h3>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default CategoryShowcase;

