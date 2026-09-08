import React from 'react';
import { motion } from 'framer-motion';
import { Gem, RotateCcw, Truck, FileText, Shield, Gift, Sparkles, Lock, CreditCard } from 'lucide-react';
import { useHomepageCms } from '../hooks/useHomepageCms';

const iconMap = {
    gem: Gem,
    'rotate-ccw': RotateCcw,
    truck: Truck,
    'file-text': FileText,
    shield: Shield,
    gift: Gift,
    sparkles: Sparkles,
    lock: Lock,
    'credit-card': CreditCard
};

const FALLBACK_PROMISES = [
    {
        id: 1,
        iconKey: 'gem',
        title: 'Pure 925',
        subtitle: 'SILVER',
        desc: 'Authentic Craftsmanship'
    },
    {
        id: 2,
        iconKey: 'rotate-ccw',
        title: 'Easy Returns',
        subtitle: 'POLICY',
        desc: 'Hassle-free Support'
    },
    {
        id: 3,
        iconKey: 'truck',
        title: 'Insured Delivery',
        subtitle: 'SHIPPING',
        desc: 'Safe Doorstep Delivery'
    },
    {
        id: 4,
        iconKey: 'file-text',
        title: 'Secure Shopping',
        subtitle: 'EXPERIENCE',
        desc: 'Protected Transactions'
    }
];

const BrandPromises = () => {
    const { data: homepageSections = {} } = useHomepageCms();
    const sectionData = homepageSections?.['brand-promises'];

    const promises = Array.isArray(sectionData?.items) && sectionData.items.length > 0
        ? sectionData.items.map((item, index) => ({
            id: item.itemId || item.id || item._id || `promise-${index + 1}`,
            iconKey: item.iconKey || FALLBACK_PROMISES[index]?.iconKey || 'gem',
            title: item.name || item.label || FALLBACK_PROMISES[index]?.title || 'Promise',
            subtitle: item.subtitle || FALLBACK_PROMISES[index]?.subtitle || '',
            desc: item.description || FALLBACK_PROMISES[index]?.desc || ''
        }))
        : FALLBACK_PROMISES;

    return (
        <section className="py-12 md:py-20 bg-[#FAF8F5] relative overflow-hidden border-t border-[#E8DFD0]/70">
            <div className="container mx-auto px-4 md:px-8 max-w-[1400px]">
                {/* Header */}
                <div className="text-center mb-10 md:mb-16">
                    <div className="inline-flex items-center gap-2 mb-2 text-[#C59B27] text-[10px] uppercase font-bold tracking-[0.3em]">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>The Swarna Sparsh Touch</span>
                    </div>
                    <h2 className="font-serif text-2xl md:text-4xl text-[#141211] font-normal tracking-tight">
                        {sectionData?.label || 'Our Commitments'}
                    </h2>
                    <div className="w-12 h-[1px] bg-[#C59B27] mx-auto mt-4" />
                </div>

                {/* ── EDITORIAL COLUMN PILLARS WITH VERTICAL DIVIDERS ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#E8DFD0] border-y border-[#E8DFD0] py-6 md:py-10 bg-white/60 rounded-3xl shadow-xs">
                    {promises.map((item, index) => {
                        const Icon = iconMap[item.iconKey] || Gem;

                        return (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 15 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.08 }}
                                className="flex flex-col items-center text-center p-6 md:p-8 group cursor-default"
                            >
                                {/* Delicate Gold Ring Icon Emblem */}
                                <div className="w-14 h-14 rounded-full bg-white border border-[#C59B27]/40 shadow-xs flex items-center justify-center text-[#C59B27] mb-5 group-hover:scale-110 group-hover:border-[#C59B27] group-hover:bg-[#141211] group-hover:text-[#E8D198] transition-all duration-500">
                                    <Icon strokeWidth={1.5} className="w-6 h-6 transition-transform duration-500" />
                                </div>

                                {/* Typography */}
                                <div className="space-y-1.5">
                                    {item.subtitle && (
                                        <span className="text-[9px] font-sans font-bold uppercase tracking-[0.25em] text-[#8C6A12] block">
                                            {item.subtitle}
                                        </span>
                                    )}
                                    <h3 className="font-serif text-base md:text-lg font-medium text-[#141211] tracking-tight">
                                        {item.title}
                                    </h3>
                                    {item.desc && (
                                        <p className="text-stone-500 font-sans text-xs leading-relaxed max-w-[200px] mx-auto pt-1 font-light">
                                            {item.desc}
                                        </p>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default BrandPromises;
