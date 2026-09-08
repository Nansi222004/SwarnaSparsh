import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { buildWomenShopPath } from '../../utils/womenNavigation';
import { resolveLegacyCmsAsset } from '../../utils/legacyCmsAssets';

import SilverImg from '@assets/hues/silver_woman.png';
import GoldImg from '@assets/hues/gold_woman.png';
import RoseGoldImg from '@assets/hues/rosegold_woman.png';
import OxidisedImg from '@assets/hues/oxidised_woman.png';

const fallbackHues = [
    {
        id: 1,
        title: "Pure 925 Silver",
        image: SilverImg,
        path: buildWomenShopPath({ metal: 'silver' })
    },
    {
        id: 2,
        title: "Gold Plated",
        image: GoldImg,
        path: buildWomenShopPath({ metal: 'gold' })
    },
    {
        id: 3,
        title: "Rose Gold Plated",
        image: RoseGoldImg,
        path: buildWomenShopPath({ metal: 'rose-gold' })
    },
    {
        id: 4,
        title: "Oxidised Silver",
        image: OxidisedImg,
        path: buildWomenShopPath({ metal: 'oxidised-silver' })
    }
];

const parseHueFromPath = (path = '') => {
    const raw = String(path || '').trim();
    if (!raw) return '';
    try {
        const query = raw.includes('?') ? raw.split('?')[1] : '';
        const params = new URLSearchParams(query);
        return String(params.get('metal') || '').trim();
    } catch {
        return '';
    }
};

const WomenDiscoverHue = ({ sectionData }) => {
    const navigate = useNavigate();
    const hues = useMemo(() => {
        const configuredItems = Array.isArray(sectionData?.items) ? sectionData.items : [];
        const normalized = configuredItems
            .map((item, index) => {
                const hueKey = item.tag || parseHueFromPath(item.path) || '';
                return {
                    id: item.itemId || item.id || `women-hue-${index + 1}`,
                    title: item.name || item.label || `Hue ${index + 1}`,
                    image: resolveLegacyCmsAsset(item.image, fallbackHues[index]?.image || ''),
                    path: item.path || (hueKey ? buildWomenShopPath({ metal: hueKey }) : fallbackHues[index]?.path || buildWomenShopPath())
                };
            })
            .filter((item) => Boolean(item.title) && Boolean(item.image) && Boolean(item.path))
            .slice(0, 4);

        return normalized.length === 4 ? normalized : fallbackHues;
    }, [sectionData]);

    return (
        <section className="pt-8 pb-4 md:pt-12 md:pb-6 bg-[#FFF9FA] overflow-hidden">
            <div className="max-w-[1200px] mx-auto px-6">
                <div className="text-center mb-6 md:mb-8 space-y-3 md:space-y-4">
                    <motion.h2 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-2xl sm:text-3xl md:text-5xl font-serif text-zinc-900 tracking-tight"
                    >
                        {sectionData?.label || 'Discover Your Hue'}
                    </motion.h2>
                    <div className="w-20 h-1 bg-rose-200 mx-auto rounded-full" />
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 pb-10">
                    {hues.map((hue, index) => (
                        <motion.div
                            key={hue.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: index * 0.1 }}
                            viewport={{ once: true }}
                            onClick={() => navigate(hue.path)}
                            className="flex flex-col items-center group cursor-pointer relative"
                        >
                            {/* Card with White Border */}
                            <div className="relative w-full aspect-square rounded-[1.5rem] md:rounded-[2rem] overflow-hidden border-[4px] md:border-[6px] border-white shadow-[0_10px_30px_rgba(255,182,193,0.3)] bg-white transition-all duration-500 group-hover:shadow-[0_20px_40px_rgba(255,182,193,0.5)] group-hover:-translate-y-1.5">
                                <img
                                    src={hue.image}
                                    alt={hue.title}
                                    className="w-full h-full object-cover transition-transform duration-[2s] ease-out group-hover:scale-105"
                                />
                            </div>

                            {/* Pink Gradient Pill Label */}
                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-[80%] z-20 transform transition-transform duration-300 group-hover:scale-105">
                                <div className="bg-gradient-to-b from-[#FFE5EC] via-[#FFD1DD] to-[#FFB6C1] py-2.5 md:py-3 rounded-lg md:rounded-xl shadow-md border border-white/40 text-center">
                                    <span className="text-zinc-800 font-black tracking-widest uppercase text-[10px] md:text-xs">
                                        {hue.title}
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

export default WomenDiscoverHue;

