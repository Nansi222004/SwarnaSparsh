import React, { useMemo, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { resolveLegacyCmsAsset } from '../../utils/legacyCmsAssets';

// Import images
import motherImg from '@assets/family_3d_mother.png';
import fatherImg from '@assets/family_3d_father.png';
import sisterImg from '@assets/family_3d_sister.png';
import brotherImg from '@assets/family_3d_brother.png';
import spouseImg from '@assets/family_3d_spouse.png';
import daughterImg from '@assets/family_3d_daughter.png';
import babyImg from '@assets/family_3d_baby.png';
import gmImg from '@assets/family_3d_grandmother.png';
import gfImg from '@assets/family_3d_grandfather.png';
import coupleImg from '@assets/family_3d_couple.png';

const familyPicksFallback = [
    { id: 'family-memory-1', name: "For Mother", image: motherImg, path: '/shop?source=family&filter=family' },
    { id: 'family-memory-2', name: "For Father", image: fatherImg, path: '/shop?source=family&filter=family' },
    { id: 'family-memory-3', name: "For Sister", image: sisterImg, path: '/shop?source=family&filter=family' },
    { id: 'family-memory-4', name: "For Brother", image: brotherImg, path: '/shop?source=family&filter=family' },
    { id: 'family-memory-5', name: "For Spouse", image: spouseImg, path: '/shop?source=family&filter=family' },
    { id: 'family-memory-6', name: "For Daughter", image: daughterImg, path: '/shop?source=family&filter=family' },
    { id: 'family-memory-7', name: "For Baby", image: babyImg, path: '/shop?source=family&filter=family' },
    { id: 'family-memory-8', name: "Grandmother", image: gmImg, path: '/shop?source=family&filter=family' },
    { id: 'family-memory-9', name: "Grandfather", image: gfImg, path: '/shop?source=family&filter=family' },
    { id: 'family-memory-10', name: "For Couple", image: coupleImg, path: '/shop?source=family&filter=family' }
];

const Family3DCarousel = ({ sectionData }) => {
    const baseItems = useMemo(() => {
        const configured = Array.isArray(sectionData?.items) ? sectionData.items : [];
        const normalized = configured
            .map((item, index) => ({
                id: item.itemId || item.id || `family-memory-${index + 1}`,
                name: String(item.name || item.label || '').trim() || `Gift ${index + 1}`,
                image: resolveLegacyCmsAsset(item.image, familyPicksFallback[index % familyPicksFallback.length]?.image || ''),
                path: item.path || '/shop?source=family&filter=family'
            }))
            .filter((item) => Boolean(item.name) && Boolean(item.image) && Boolean(item.path));
        return normalized.length > 0 ? normalized : familyPicksFallback;
    }, [sectionData]);

    // 20 items to perfectly close the gap on the massive C-curve radius
    const cylinderItems = useMemo(() => {
        const items = [];
        while(items.length < 20) {
            items.push(...baseItems);
        }
        return items.slice(0, 20);
    }, [baseItems]);

    // Responsive measurements for the shallow C-curve (large radius, compact cards)
    const [radius, setRadius] = useState(850);
    const [cardWidth, setCardWidth] = useState(240);
    const [cardHeight, setCardHeight] = useState(340);

    useEffect(() => {
        const updateDims = () => {
             if (window.innerWidth < 480) {
                 setRadius(400);
                 setCardWidth(140);
                 setCardHeight(200);
             } else if (window.innerWidth < 768) {
                 setRadius(600);
                 setCardWidth(180);
                 setCardHeight(260);
             } else if (window.innerWidth < 1024) {
                 setRadius(650);
                 setCardWidth(170);
                 setCardHeight(240);
             } else {
                 setRadius(720);
                 setCardWidth(220);
                 setCardHeight(340);
             }
        };
        updateDims();
        window.addEventListener('resize', updateDims);
        return () => window.removeEventListener('resize', updateDims);
    }, []);

    return (
        <section 
            className="pt-2 pb-4 md:py-12 bg-[#FAF8F5] relative overflow-hidden"
            style={{
                '--radius': `${radius}px`,
                '--cardW': `${cardWidth}px`,
                '--cardH': `${cardHeight}px`,
                '--gap': window.innerWidth < 1024 ? '10px' : '8px'
            }}
        >
            {/* Inline styles for the 3D Cylinder Animation */}
            <style>
                {`
                @keyframes spinFamilyCurve {
                    0% { transform: translateZ(calc(var(--radius) * -1)) rotateY(0deg); }
                    100% { transform: translateZ(calc(var(--radius) * -1)) rotateY(-360deg); }
                }
                .scene-family {
                    perspective: 4000px;
                    width: 100%;
                    height: var(--cardH);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-top: 0;
                }
                .rotator-family {
                    width: var(--cardW);
                    height: var(--cardH);
                    position: relative;
                    transform-style: preserve-3d;
                    animation: spinFamilyCurve 60s infinite linear;
                }
                .rotator-family:hover {
                    animation-play-state: paused;
                }
                .cylinder-card-family {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    backface-visibility: hidden;
                    padding: 0 var(--gap);
                }
                `}
            </style>

            <div className="container mx-auto px-4 md:px-6 relative z-10 overflow-visible">

                {/* Header Area */}
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="relative hidden md:flex flex-col items-center justify-center mb-2 md:mb-8 text-center"
                >
                    <div className="inline-block bg-[#C59B27] text-[#141211] px-4 py-1 font-sans font-bold tracking-[0.2em] text-[9px] uppercase rounded-none shadow-sm mb-3">
                        {String(sectionData?.settings?.eyebrow || 'Curated Picks').trim() || 'Curated Picks'}
                    </div>
                    <h3 className="font-serif text-[#141211] text-2xl md:text-4xl font-medium tracking-tight uppercase">
                        {String(sectionData?.settings?.title || sectionData?.label || 'Gifts to Remember').trim() || 'Gifts to Remember'}
                    </h3>
                </motion.div>

                {/* 3D Curved Carousel Area */}
                <div className="scene-family mt-2 md:mt-8">
                    <div className="rotator-family">
                        {cylinderItems.map((item, index) => {
                            const angle = index * 18;

                            return (
                                <div
                                    key={`fam-curv-${index}`}
                                    className="cylinder-card-family group"
                                    style={{
                                        transform: `rotateY(${angle}deg) translateZ(var(--radius))`,
                                    }}
                                >
                                    <Link to={item.path} className="block w-full h-full relative isolate rounded-[1.2rem] overflow-hidden cursor-pointer bg-white shadow-xl border border-[#C59B27]/20">
                                        {/* Image */}
                                        <div className="absolute inset-0 bg-[#141211]">
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                        </div>

                                        {/* Classic Gradient Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#141211]/95 via-[#141211]/30 to-transparent"></div>

                                        {/* Text Section overlay at bottom */}
                                        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 flex flex-col items-center justify-end text-center z-10">
                                            <h4 className="font-serif font-medium text-lg lg:text-xl text-white tracking-wide mb-1 transform transition-transform duration-300 group-hover:-translate-y-1 drop-shadow-md">
                                                {item.name}
                                            </h4>
                                            
                                            {/* Discover/Animated Arrow */}
                                            <div className="flex items-center gap-2 text-[#E8D198] opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 delay-75">
                                                <div className="h-[1px] w-3 bg-[#C59B27]/60"></div>
                                                <span className="text-[8px] font-bold uppercase tracking-[0.2em]">
                                                    Explore
                                                </span>
                                                <div className="h-[1px] w-3 bg-[#C59B27]/60"></div>
                                            </div>
                                        </div>

                                        {/* Border Glow on Hover */}
                                        <div className="absolute inset-0 border-[2px] border-transparent group-hover:border-[#C59B27]/40 rounded-[1.2rem] transition-colors duration-500 pointer-events-none"></div>
                                    </Link>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
        </section>
    );
};

export default Family3DCarousel;

