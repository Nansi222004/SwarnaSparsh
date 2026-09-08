import React from 'react';
import { motion } from 'framer-motion';

const GoldTrustStrip = () => {
    const badges = [
        { 
            id: 1, 
            title: "100% Certified Lab", 
            subtitle: "Grown Diamonds",
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 md:w-12 md:h-12 text-[#26A69A]">
                    <path d="M12 3L4 9L12 15L20 9L12 3Z" />
                    <path d="M4 9L12 21L20 9" />
                    <path d="M12 15V21" />
                    <circle cx="18" cy="18" r="4" fill="white" />
                    <path d="M16 18L17.5 19.5L20 16.5" stroke="#26A69A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            )
        },
        { 
            id: 2, 
            title: "Easy 15", 
            subtitle: "Days Return",
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 md:w-12 md:h-12 text-[#26A69A]">
                    <rect x="4" y="8" width="16" height="12" rx="2" />
                    <path d="M4 12H20M8 8V6C8 4.89543 8.89543 4 10 4H14C15.1046 4 16 4.89543 16 6V8" />
                    <path d="M7 16L5 18L3 16" />
                    <path d="M5 18V14C5 12.8954 5.89543 12 7 12H10" />
                </svg>
            )
        },
        { 
            id: 3, 
            title: "Lifetime Exchange", 
            subtitle: "& Buyback",
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 md:w-12 md:h-12 text-[#26A69A]">
                    <path d="M17 1L21 5L17 9" />
                    <path d="M3 11V9C3 6.79086 4.79086 5 7 5H21" />
                    <path d="M7 23L3 19L7 15" />
                    <path d="M21 13V15C21 17.2091 19.2091 19 17 19H3" />
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 10.5V13.5M10.5 12H13.5" />
                </svg>
            )
        },
        { 
            id: 4, 
            title: "BIS", 
            subtitle: "Hallmark",
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 md:w-12 md:h-12 text-[#26A69A]">
                    <path d="M12 4L20 18H4L12 4Z" />
                    <circle cx="12" cy="13" r="2.5" />
                    <path d="M12 15.5V18" />
                </svg>
            )
        }
    ];

    return (
        <section className="w-full bg-gradient-to-r from-[#F0FFFD] via-white to-[#F0FFFD] py-8 md:py-12 border-y border-[#E0F2F1]">
            <div className="container mx-auto px-4 max-w-[1500px]">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
                    {badges.map((badge) => (
                        <motion.div 
                            key={badge.id}
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="flex items-center justify-center gap-4 group"
                        >
                            <div className="shrink-0 transition-transform duration-500 group-hover:scale-110">
                                {badge.icon}
                            </div>
                            <div className="flex flex-col">
                                <h4 className="text-[#37474F] text-sm md:text-base font-bold leading-tight">
                                    {badge.title}
                                </h4>
                                <p className="text-[#546E7A] text-[13px] md:text-[15px] font-medium leading-tight">
                                    {badge.subtitle}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default GoldTrustStrip;
