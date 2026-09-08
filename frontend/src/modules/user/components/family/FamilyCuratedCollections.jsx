import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { resolveLegacyCmsAsset } from '../../utils/legacyCmsAssets';

import classicsImg from '@assets/family_curated_classics.png';
import sistersImg from '@assets/family_curated_sisters.png';
import astraImg from '@assets/family_astra.png';
import bohoImg from '@assets/family_boho.png';
import signatureImg from '@assets/premium_necklace_product.png'; // Reusing premium asset for new card
import bridalImg from '@assets/latest_drop_earrings.png'; // Reusing premium asset for new card

const fallbackCollections = [
    {
        id: 'classics',
        title: '925 SILVER CLASSICS',
        image: classicsImg, 
        path: '/shop?source=family&filter=family'
    },
    {
        id: 'astra',
        title: 'ASTRA EDITION',
        image: astraImg,
        path: '/shop?source=family&filter=family'
    },
    {
        id: 'signature',
        title: 'SIGNATURE SETS',
        image: signatureImg,
        path: '/shop?source=family&filter=family'
    },
    {
        id: 'boho',
        title: 'BOHO ANKLETS',
        image: bohoImg,
        path: '/shop?source=family&filter=family'
    },
    {
        id: 'bridal',
        title: 'BRIDAL EDIT',
        image: bridalImg,
        path: '/shop?source=family&filter=family'
    },
    {
        id: 'gifts',
        title: 'GIFTS FOR HER',
        image: sistersImg,
        path: '/shop?source=family&filter=family'
    }
];

const FamilyCuratedCollections = ({ sectionData }) => {
    const collections = useMemo(() => {
        const configuredItems = Array.isArray(sectionData?.items) ? sectionData.items : [];
        const normalizedConfigured = configuredItems
            .map((item, index) => {
                const fallback = fallbackCollections[index % fallbackCollections.length];
                const categoryPath = item.categoryId
                    ? `/shop?source=family&filter=family&category=${encodeURIComponent(item.categoryId)}`
                    : '';
                return {
                    id: item.itemId || item.id || `family-curated-${index + 1}`,
                    title: String(item.name || item.label || fallback.title).trim() || fallback.title,
                    image: resolveLegacyCmsAsset(item.image, fallback.image),
                    path: item.path || categoryPath || fallback.path
                };
            })
            .filter((item) => Boolean(item.title) && Boolean(item.image) && Boolean(item.path));

        return normalizedConfigured.length > 0 ? normalizedConfigured : fallbackCollections;
    }, [sectionData]);

    return (
        <section className="py-4 md:py-8 bg-white overflow-hidden">
            <div className="container mx-auto px-4 md:px-12">
                
                {/* Section Header */}
                <div className="text-center mb-5 md:mb-8 flex flex-col items-center">
                    <span className="text-[9px] md:text-xs font-bold uppercase tracking-[0.4em] md:tracking-[0.5em] text-[#C59B27] mb-1 md:mb-2 font-sans">Handpicked Selections</span>
                    <h2 className="text-xl md:text-4xl font-serif text-[#141211] tracking-tight">
                        Curated <span className="italic font-light">Collections</span>
                    </h2>
                    <div className="w-8 h-[1px] bg-[#C59B27]/40 mt-2 md:mt-4" />
                </div>

                {/* Collections Grid - EXACTLY matching Product Card Layout */}
                <div className="flex overflow-x-auto pb-4 md:pb-0 scrollbar-hide gap-3 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 md:gap-4 lg:gap-6 snap-x snap-mandatory pr-4 md:pr-0">
                    {collections.map((item, idx) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: idx * 0.1 }}
                            className="min-w-[150px] max-w-[150px] md:min-w-0 md:max-w-full flex flex-col group cursor-pointer snap-start"
                        >
                            <Link to={item.path} className="flex flex-col h-full">
                                {/* Image Container - Aspect Square */}
                                <div className="relative aspect-square overflow-hidden bg-[#FAF8F5] mb-3">
                                    <img 
                                        src={item.image} 
                                        alt={item.title} 
                                        className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-105"
                                    />
                                    
                                    {/* Bestseller Badge */}
                                    <div className="absolute top-0 left-0 bg-[#141211] text-[#E8D198] border-b border-r border-[#C59B27]/30 text-[9px] font-bold px-2 py-1 z-10 uppercase tracking-widest">
                                        Collection
                                    </div>
                                </div>

                                {/* Content Below */}
                                <div className="flex flex-col flex-1 px-0">
                                    <div className="h-[30px] md:h-[40px] mb-1 md:mb-2">
                                        <h3 className="text-[10px] md:text-[12px] text-stone-800 line-clamp-2 h-auto md:h-[34px] group-hover:text-[#C59B27] transition-colors uppercase tracking-tight font-medium overflow-hidden">
                                            {item.title}
                                        </h3>
                                    </div>

                                    <div className="h-[12px] md:h-[15px] mb-1 md:mb-2">
                                        <p className="text-[7px] md:text-[9px] font-bold text-blue-600 uppercase tracking-wider">
                                            NEW ARRIVAL
                                        </p>
                                    </div>
                                    
                                    {/* Call to Action */}
                                    <div className="mt-auto">
                                        <div className="w-full bg-[#141211] text-[#E8D198] border border-[#C59B27]/30 font-bold text-[8px] md:text-[11px] py-1.5 md:py-2.5 rounded-none hover:bg-[#C59B27] hover:text-[#141211] transition-all duration-300 uppercase tracking-widest text-center shadow-sm">
                                            Browse Collection
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FamilyCuratedCollections;

