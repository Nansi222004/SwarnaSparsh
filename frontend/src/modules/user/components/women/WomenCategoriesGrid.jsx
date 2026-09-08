import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { buildWomenShopPath } from '../../utils/womenNavigation';
import { resolveLegacyCmsAsset } from '../../utils/legacyCmsAssets';

import RingsStackingImg from '@assets/trending/RingsStacking.png';
import CuratedCombosImg from '@assets/trending/CuratedCombos.png';
import ChainLayeringImg from '@assets/trending/ChainLayering.png';
import SpiritualPicksImg from '@assets/trending/SpiritualPicks.png';

const fallbackTrendingCollections = [
    {
        id: 'women-trend-1',
        title: 'Rings Stacking',
        image: RingsStackingImg,
        path: buildWomenShopPath({ filter: 'womens', category: 'rings' })
    },
    {
        id: 'women-trend-2',
        title: 'Curated Combos',
        image: CuratedCombosImg,
        path: buildWomenShopPath({ filter: 'womens', category: 'sets' })
    },
    {
        id: 'women-trend-3',
        title: 'Chain Layering',
        image: ChainLayeringImg,
        path: buildWomenShopPath({ filter: 'womens', category: 'chains' })
    },
    {
        id: 'women-trend-4',
        title: 'Spiritual Picks',
        image: SpiritualPicksImg,
        path: buildWomenShopPath({ filter: 'womens', category: 'pendants' })
    }
];

const WomenCategoriesGrid = ({ sectionData }) => {
    const trendingCollections = useMemo(() => {
        const configuredItems = Array.isArray(sectionData?.items) ? sectionData.items : [];
        const normalized = configuredItems
            .map((item, index) => ({
                id: item.itemId || item.id || `women-trend-${index + 1}`,
                title: item.name || item.label || `Collection ${index + 1}`,
                image: resolveLegacyCmsAsset(item.image, fallbackTrendingCollections[index]?.image || ''),
                path: item.path || fallbackTrendingCollections[index]?.path || buildWomenShopPath({ filter: 'womens' }),
                number: String(index + 1)
            }))
            .filter((item) => Boolean(item.title) && Boolean(item.path))
            .slice(0, 4);

        if (normalized.length === 4) return normalized;
        return fallbackTrendingCollections.map((item, index) => ({
            ...item,
            number: String(index + 1)
        }));
    }, [sectionData]);

    return (
        <section className="py-8 md:py-12 px-4 md:px-8 bg-white">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-8">
                    <h2 className="text-3xl md:text-4xl font-serif font-medium text-[#4A3B3F] tracking-tight">
                        {sectionData?.label || 'Trending Near You'}
                    </h2>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 lg:gap-8">
                    {trendingCollections.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: index * 0.1 }}
                            viewport={{ once: true }}
                            className="relative group"
                        >
                            <Link
                                to={item.path}
                                className="relative block aspect-[3.5/5] rounded-[20px] md:rounded-[24px] overflow-hidden bg-white border-[0.5px] border-black/10 transition-all duration-700 group-hover:-translate-y-4 shadow-lg group-hover:shadow-2xl"
                            >
                                <img
                                    src={item.image}
                                    alt={item.title}
                                    className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110"
                                />

                                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                                <div className="absolute inset-x-0 bottom-4 md:bottom-8 text-center px-2 md:px-4">
                                    <h4 className="text-white text-[10px] sm:text-lg md:text-2xl font-bold leading-tight px-1 drop-shadow-md uppercase tracking-wider">
                                        {item.title}
                                    </h4>
                                </div>
                            </Link>

                            <div className="absolute -left-4 md:-left-12 bottom-2 md:bottom-8 pointer-events-none select-none z-10">
                                <span className="text-[70px] sm:text-[120px] md:text-[180px] font-black text-white/90 leading-none drop-shadow-[0_10px_10px_rgba(0,0,0,0.1)] transition-transform duration-700 group-hover:scale-110 group-hover:-translate-x-2">
                                    {item.number}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default WomenCategoriesGrid;
