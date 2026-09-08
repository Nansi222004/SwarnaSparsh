import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { buildWomenShopPath } from '../../utils/womenNavigation';

import womenGift1 from '@assets/images/celebrate/women_gift_1.jpg';
import womenGift2 from '@assets/images/celebrate/women_gift_2.jpg';
import womenGift3 from '@assets/images/celebrate/women_gift_3.jpg';
import womenGift4 from '@assets/images/celebrate/women_gift_4.jpg';

const guides = [
    { id: 1, title: 'Sisters', image: womenGift1, link: buildWomenShopPath({ gifts: 'sisters' }) },
    { id: 2, title: 'Mothers', image: womenGift2, link: buildWomenShopPath({ gifts: 'mothers' }) },
    { id: 3, title: 'Wives', image: womenGift3, link: buildWomenShopPath({ gifts: 'wives' }) },
    { id: 4, title: 'Besties', image: womenGift4, link: buildWomenShopPath({ gifts: 'friends' }) }
];

const CelebrateWomen = () => {
    const navigate = useNavigate();

    return (
        <section className="py-20 md:py-24 bg-[#FAF7F2]">
            <div className="container mx-auto px-4 max-w-[1200px]">
                
                {/* Header Section */}
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-serif text-zinc-900 mb-3 italic">
                        Celebrate Women
                    </h2>
                    <p className="text-zinc-500 text-sm md:text-base font-medium tracking-[0.2em] uppercase">
                        A Gifting Guide For Her
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
                    {guides.map((guide, idx) => (
                        <motion.div
                            key={guide.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7, delay: idx * 0.15 }}
                            onClick={() => navigate(guide.link)}
                            className="group relative cursor-pointer"
                        >
                            {/* Card with Premium Frame */}
                            <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden border-[8px] border-white shadow-2xl bg-white transition-all duration-700 ease-in-out group-hover:shadow-3xl group-hover:-translate-y-3">
                                <img 
                                    src={guide.image} 
                                    alt={guide.title} 
                                    className="w-full h-full object-cover transition-transform duration-[3s] ease-out group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-700" />
                            </div>

                            {/* Refined Rose Gold/Champagne Gradient Pill Label */}
                            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-[85%] z-20 transform transition-all duration-500 group-hover:scale-105 group-hover:-bottom-6">
                                <div className="bg-gradient-to-r from-[#eecda3] to-[#ef629f] py-3.5 rounded-2xl shadow-xl border border-white/30 text-center backdrop-blur-sm">
                                    <span className="text-white font-bold tracking-[0.15em] uppercase text-xs">
                                        {guide.title}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default CelebrateWomen;
