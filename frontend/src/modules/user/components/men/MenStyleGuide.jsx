import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { buildMenShopPath } from '../../utils/menNavigation';
import { resolveLegacyCmsAsset } from '../../utils/legacyCmsAssets';

// Import images from assets
import styleChains from '@assets/men/style_chains.png';
import styleRings from '@assets/men/style_rings.png';
import styleBracelets from '@assets/men/style_bracelets.png';

const styles = [
    {
        id: 1,
        step: "1. Chain Layering",
        title: "Chain Layering",
        image: styleChains,
        path: buildMenShopPath({ category: 'chains' }),
        buttonText: "Explore Chains"
    },
    {
        id: 2,
        step: "2. One Piece, Big Impact",
        title: "One Piece, Big Impact",
        image: styleRings,
        path: buildMenShopPath({ category: 'rings' }),
        buttonText: "Explore Rings"
    },
    {
        id: 3,
        step: "3. Wrist Stacking",
        title: "Wrist Stacking",
        image: styleBracelets,
        path: buildMenShopPath({ category: 'bracelets' }),
        buttonText: "Explore Bracelets"
    }
];

const MenStyleGuide = ({ sectionData }) => {

    const resolvedSettings = useMemo(() => ({
        title: sectionData?.settings?.title || 'STYLE GUIDE',
        subtitle: sectionData?.settings?.subtitle || 'Master the hottest trends'
    }), [sectionData]);

    const resolvedStyles = useMemo(() => {
        const configuredItems = Array.isArray(sectionData?.items) ? sectionData.items.slice(0, 3) : [];
        const normalized = configuredItems
            .filter((item) => item?.image)
            .map((item, index) => {
                const fallback = styles[index];
                return {
                    id: item.itemId || item.id || `men-style-guide-${index}`,
                    step: item.step || fallback?.step || `${index + 1}. Step`,
                    title: item.name || item.label || fallback?.title || '',
                    image: resolveLegacyCmsAsset(item.image, fallback?.image || ''),
                    path: item.categoryId
                        ? buildMenShopPath({ category: item.categoryId })
                        : (item.path || fallback?.path || buildMenShopPath()),
                    buttonText: item.buttonText || item.ctaLabel || fallback?.buttonText || 'Explore'
                };
            })
            .filter((item) => item.step && item.title && item.image && item.path);

        return normalized.length === 3 ? normalized : styles;
    }, [sectionData]);

    return (
        <section className="py-2 md:py-10 px-3 md:px-12 bg-[#F3EBE3]">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-3 md:mb-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="flex flex-col items-center"
                    >
                        <h2 className="text-lg md:text-3xl font-display font-bold text-[#3B2516] tracking-tight mb-1">
                            {resolvedSettings.title}
                        </h2>
                        <p className="text-[11px] md:text-base text-[#6B4E3D] font-medium tracking-wide">
                            {resolvedSettings.subtitle}
                        </p>
                    </motion.div>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 lg:gap-6 justify-items-center md:justify-items-stretch">
                    {resolvedStyles.map((style, index) => (
                        <motion.div
                            key={style.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                            viewport={{ once: true }}
                            className="relative flex flex-col group h-full w-full max-w-[320px] md:max-w-none overflow-hidden rounded-xl md:rounded-none shadow-md md:shadow-none"
                        >
                            {/* Step Header */}
                            <div className="bg-[#754E2D] py-2 px-3 md:py-2.5 md:px-4 text-center rounded-t-xl z-20">
                                <span className="text-white font-bold text-[10px] md:text-lg tracking-wide md:tracking-wider leading-tight">
                                    {style.step}
                                </span>
                            </div>

                            {/* Image Part */}
                            <div className="relative flex-grow overflow-hidden bg-black rounded-b-xl shadow-lg aspect-[0.88/1] md:aspect-[0.85/1] min-h-[220px] md:min-h-0">
                                {/* Grayscale Base Image */}
                                <img
                                    src={style.image}
                                    alt={style.title}
                                    className="w-full h-full object-cover grayscale brightness-[0.8] transition-all duration-1000 group-hover:scale-110 group-hover:grayscale-0 group-hover:brightness-100"
                                />

                                {/* Overlay for UI components */}
                                <div className="absolute inset-0 z-10 p-3 md:p-4 pointer-events-none">
                                    {/* Focus Frame - REMOVED per user request */}
                                    
                                    {/* Small Zoom-in Zoom Circle/Box - COMPACTED and BORDER REMOVED */}
                                    <div className="absolute top-[12%] right-[6%] w-20 h-20 md:w-24 md:h-24 bg-white/5 backdrop-blur-sm rounded-lg overflow-hidden opacity-0 md:group-hover:opacity-100 transition-all duration-500 translate-x-2 md:group-hover:translate-x-0">
                                        <img src={style.image} alt="zoom" className="w-full h-full object-cover scale-[200%]" />
                                    </div>
                                    
                                    {/* Small Corner Tag - BORDER REMOVED */}
                                    <div className="absolute bottom-[18%] left-[8%] px-2 py-0.5 bg-black/40 backdrop-blur-md rounded text-[7px] text-white font-bold uppercase tracking-widest opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
                                        Swarna Sparsh Collection
                                    </div>
                                </div>

                                {/* Explore Button - COMPACTED */}
                                <div className="absolute bottom-2 right-2 md:bottom-3 md:right-3 z-20">
                                    <Link
                                        to={style.path}
                                        className="flex items-center gap-1 bg-[#D9C4B1]/90 backdrop-blur-md hover:bg-[#C9A24D] text-[#3B2516] px-3 py-1.5 rounded-full font-bold text-[8px] md:text-[9px] uppercase tracking-[0.12em] shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-105 active:scale-95"
                                    >
                                        {style.buttonText}
                                        <ChevronRight className="w-3 h-3" />
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default MenStyleGuide;

