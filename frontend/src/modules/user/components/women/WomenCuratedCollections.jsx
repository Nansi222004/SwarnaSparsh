import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { buildWomenShopPath } from '../../utils/womenNavigation';
import { resolveLegacyCmsAsset } from '../../utils/legacyCmsAssets';

import SilverImg from '@assets/collections/SilverClassics.png';
import RingsImg from '@assets/collections/DazzlingRings.png';
import GiftsImg from '@assets/images/collections/GiftsForHer.png';
import BridalImg from '@assets/images/collections/BridalBliss.png';
import OfficeImg from '@assets/images/collections/OfficeChic.png';
import BohoImg from '@assets/images/collections/BohoAnklets.png';

const fallbackCollections = [
    { id: 'women-curated-1', title: '925 Silver Classics', image: SilverImg, link: buildWomenShopPath({ filter: 'womens', category: 'rings' }) },
    { id: 'women-curated-2', title: 'Astra Collection', image: RingsImg, link: buildWomenShopPath({ filter: 'womens', category: 'rings' }) },
    { id: 'women-curated-3', title: 'Boho Anklets', image: BohoImg, link: buildWomenShopPath({ filter: 'womens', category: 'anklets' }) },
    { id: 'women-curated-4', title: 'Gifts for Her', image: GiftsImg, link: buildWomenShopPath({ filter: 'womens', category: 'pendants' }) },
    { id: 'women-curated-5', title: 'Bridal Bliss', image: BridalImg, link: buildWomenShopPath({ filter: 'womens', category: 'sets' }) },
    { id: 'women-curated-6', title: 'Office Chic', image: OfficeImg, link: buildWomenShopPath({ filter: 'womens', category: 'earrings' }) }
];

const WomenCuratedCollections = ({ sectionData }) => {
    const scrollRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);
    const [isHovered, setIsHovered] = useState(false);

    const collections = useMemo(() => {
        const configuredItems = Array.isArray(sectionData?.items) ? sectionData.items : [];
        const normalized = configuredItems
            .map((item, index) => ({
                id: item.itemId || item.id || `women-curated-${index + 1}`,
                title: item.name || item.label || `Collection ${index + 1}`,
                image: resolveLegacyCmsAsset(item.image, fallbackCollections[index]?.image || ''),
                link: item.path || fallbackCollections[index]?.link || buildWomenShopPath({ filter: 'womens' })
            }))
            .filter((item) => Boolean(item.title) && Boolean(item.link));

        return normalized.length > 0 ? normalized : fallbackCollections;
    }, [sectionData]);

    const checkScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
        }
    };

    const scroll = (direction) => {
        if (scrollRef.current) {
            const { clientWidth } = scrollRef.current;
            const scrollAmount = direction === 'left' ? -clientWidth / 2 : clientWidth / 2;
            scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    useEffect(() => {
        if (isHovered) return;

        const interval = setInterval(() => {
            if (scrollRef.current) {
                const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
                if (scrollLeft >= scrollWidth - clientWidth - 10) {
                    scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
                } else {
                    scroll('right');
                }
            }
        }, 3500);

        return () => clearInterval(interval);
    }, [isHovered]);

    return (
        <section className="py-6 md:py-10 bg-white">
            <div className="max-w-[1400px] mx-auto px-3 sm:px-6">
                <div className="text-center mb-8">
                    <motion.h2
                        initial={{ opacity: 0, y: -20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-2xl sm:text-3xl md:text-4xl font-normal text-zinc-900 tracking-tight"
                    >
                        {sectionData?.label || 'Curated Collections'}
                    </motion.h2>
                </div>

                <div
                    className="relative group/slider"
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    <AnimatePresence>
                        {canScrollLeft && (
                            <motion.button
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                onClick={() => scroll('left')}
                                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 z-20 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-zinc-800 hover:bg-zinc-50 transition-colors"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </motion.button>
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {canScrollRight && (
                            <motion.button
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                onClick={() => scroll('right')}
                                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-5 z-20 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-zinc-800 hover:bg-zinc-50 transition-colors"
                            >
                                <ChevronRight className="w-6 h-6" />
                            </motion.button>
                        )}
                    </AnimatePresence>

                    <div
                        ref={scrollRef}
                        onScroll={checkScroll}
                        className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4"
                    >
                        {collections.map((item, index) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, x: 100 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, delay: index * 0.1, ease: 'easeOut' }}
                                whileHover={{ y: -5 }}
                                className="flex-shrink-0 w-[160px] sm:w-[220px] md:w-[320px] aspect-[3/4] relative overflow-hidden cursor-pointer group snap-start"
                            >
                                <Link
                                    to={item.link}
                                    aria-label={`Shop ${item.title}`}
                                    className="absolute inset-0 z-20"
                                />

                                <div className="absolute inset-0 w-full h-full">
                                    <img
                                        src={item.image}
                                        alt={item.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                </div>

                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                                <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between text-white border-b border-white/20 pb-2 z-10 pointer-events-none">
                                    <span className="text-xs md:text-sm font-bold tracking-widest uppercase">
                                        {item.title.includes('Collection') ? item.title : `Shop ${item.title}`}
                                    </span>
                                    <ChevronRight className="w-4 h-4" />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default WomenCuratedCollections;
