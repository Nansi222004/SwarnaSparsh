import React, { useMemo, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { resolveLegacyCmsAsset } from '../../utils/legacyCmsAssets';

// Import all 10 curated images
import img1 from '@assets/family_trend_1.png';
import img2 from '@assets/family_trend_2.png';
import img3 from '@assets/family_trend_3.png';
import img4 from '@assets/family_trend_4.png';
import img5 from '@assets/family_trend_5.png';
import img6 from '@assets/family_trend_6.png';
import img7 from '@assets/family_trend_7.png';
import img8 from '@assets/family_trend_8.png';
import img9 from '@assets/family_trend_9.png';
import img10 from '@assets/family_trend_10.png';

const trendingFallback = [
    { id: 'family-trend-1', title: "Matching Sets", image: img1, path: '/shop?source=family&filter=family' },
    { id: 'family-trend-2', title: "Heirloom Pieces", image: img2, path: '/shop?source=family&filter=family' },
    { id: 'family-trend-3', title: "Mom & Me", image: img3, path: '/shop?source=family&filter=family' },
    { id: 'family-trend-4', title: "Generations", image: img4, path: '/shop?source=family&filter=family' },
    { id: 'family-trend-5', title: "Everyday Wear", image: img5, path: '/shop?source=family&filter=family' },
    { id: 'family-trend-6', title: "Festive Joy", image: img6, path: '/shop?source=family&filter=family' },
    { id: 'family-trend-7', title: "Minimalist Luxe", image: img7, path: '/shop?source=family&filter=family' },
    { id: 'family-trend-8', title: "Statement Picks", image: img8, path: '/shop?source=family&filter=family' },
    { id: 'family-trend-9', title: "Traditional", image: img9, path: '/shop?source=family&filter=family' },
    { id: 'family-trend-10', title: "Modern Staples", image: img10, path: '/shop?source=family&filter=family' }
];

const FamilyTrendingNearYou = ({ sectionData }) => {
    const baseItems = useMemo(() => {
        const configured = Array.isArray(sectionData?.items) ? sectionData.items : [];
        const normalized = configured
            .map((item, index) => ({
                id: item.itemId || item.id || `family-trend-${index + 1}`,
                title: String(item.name || item.label || '').trim() || `Collection ${index + 1}`,
                image: resolveLegacyCmsAsset(item.image, trendingFallback[index % trendingFallback.length]?.image || ''),
                path: item.path || '/shop?source=family&filter=family'
            }))
            .filter((item) => Boolean(item.title) && Boolean(item.path) && Boolean(item.image));

        return normalized.length > 0 ? normalized : trendingFallback;
    }, [sectionData]);

    // 20 items to perfectly close the gap on the massive C-curve radius
    const cylinderItems = useMemo(() => {
        const items = [];
        while (items.length < 20) {
            items.push(...baseItems);
        }
        return items.slice(0, 20);
    }, [baseItems]);

    // Responsive measurements for the shallow C-curve
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
            className="pt-4 pb-2 md:py-16 bg-white relative overflow-hidden"
            style={{
                '--radius': `${radius}px`,
                '--cardW': `${cardWidth}px`,
                '--cardH': `${cardHeight}px`,
                '--gap': window.innerWidth < 1024 ? '10px' : '8px'
            }}
        >
            {/* Inline styles for the 3D Cylinder Animation (Left to Right) */}
            <style>
                {`
                @keyframes spinTrendingCurveLr {
                    0% { transform: translateZ(calc(var(--radius) * -1)) rotateY(0deg); }
                    100% { transform: translateZ(calc(var(--radius) * -1)) rotateY(360deg); }
                }
                .scene-trending {
                    perspective: 4000px;
                    width: 100%;
                    height: var(--cardH);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-top: 0;
                }
                .rotator-trending {
                    width: var(--cardW);
                    height: var(--cardH);
                    position: relative;
                    transform-style: preserve-3d;
                    animation: spinTrendingCurveLr 60s infinite linear;
                }
                .rotator-trending:hover {
                    animation-play-state: paused;
                }
                .cylinder-card-trending {
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

            <div className="container mx-auto px-4 relative z-10 overflow-visible">

                {/* Header Area */}
                <div className="text-center mb-2 md:mb-8">
                    <h2 className="text-3xl md:text-5xl font-serif font-medium text-[#141211] tracking-tight">
                        {String(sectionData?.settings?.title || sectionData?.label || 'Trending Near You').trim() || 'Trending Near You'}
                    </h2>
                </div>

                {/* 3D Curved Carousel Area */}
                <div className="scene-trending mt-2 md:mt-8">
                    <div className="rotator-trending">
                        {cylinderItems.map((item, index) => {
                            const angle = index * 18;

                            return (
                                <div
                                    key={`trend-curv-${index}`}
                                    className="cylinder-card-trending group"
                                    style={{
                                        transform: `rotateY(${angle}deg) translateZ(var(--radius))`,
                                    }}
                                >
                                    <Link to={item.path} className="block w-full h-full relative isolate rounded-[1.2rem] overflow-hidden cursor-pointer bg-white shadow-xl border border-[#C59B27]/20">
                                        {/* Image */}
                                        <div className="absolute inset-0 bg-transparent">
                                            <img
                                                src={item.image}
                                                alt={item.title}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                        </div>

                                        {/* Classic Gradient Overlay */}
                                        <div className="absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none"></div>

                                        {/* Text Overlay */}
                                        <div className="absolute bottom-4 left-0 right-0 px-3 flex flex-col items-center justify-end text-center z-10">
                                            <h4 className="font-serif font-medium text-sm md:text-lg lg:text-xl text-white tracking-wide drop-shadow-lg leading-tight">
                                                {item.title}
                                            </h4>
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

export default FamilyTrendingNearYou;

