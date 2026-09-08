import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { buildMenShopPath } from '../../utils/menNavigation';
import menInteractiveImg from '@assets/men-interactive.png';

const hotspots = [
    {
        id: 'earrings',
        label: 'EARRINGS',
        desc: "925 Sterling Silver Studs",
        price: "1,299",
        x1: 63, y1: 31,
        x2: 78, y2: 35, // Moved in from 83
        category: 'earrings',
        direction: 'left'
    },
    {
        id: 'chains',
        label: 'CHAINS',
        desc: "Classic Silver Link Chain",
        price: "3,499",
        x1: 42, y1: 57,
        x2: 22, y2: 45, // Moved in from 17
        category: 'chains',
        direction: 'right'
    },
    {
        id: 'pendants',
        label: 'PENDANTS',
        desc: "Silver Minimalist Pendant",
        price: "1,799",
        x1: 52, y1: 63,
        x2: 22, y2: 62, // Moved in from 17
        category: 'pendants',
        direction: 'right'
    },
    {
        id: 'bracelets',
        label: 'BRACELETS',
        desc: "Silver Solid Kada",
        price: "2,199",
        x1: 30, y1: 82,
        x2: 22, y2: 78, // Moved in from 17
        category: 'bracelets',
        direction: 'right'
    },
    {
        id: 'rings',
        label: 'RINGS',
        desc: "Oxidized Statement Ring",
        price: "1,499",
        x1: 49, y1: 72,
        x2: 78, y2: 82, // Moved in from 83, 85
        category: 'rings',
        direction: 'left'
    }
];

const MenInteractiveLook = () => {
    const navigate = useNavigate();
    const [hoveredNode, setHoveredNode] = useState(null);

    // Detect if tooltip should appear above based on vertical position to avoid overlaps
    const shouldAppearAbove = (spotIndex) => {
        // CHAINS (index 1) appears above PENDANTS
        // BRACELETS (index 3) appears above to avoid overlap with PENDANTS
        if (spotIndex === 1) return true; // CHAINS above
        if (spotIndex === 3) return true; // BRACELETS above
        return false;
    };

    return (
        <section className="pt-1 md:pt-2 pb-2 md:pb-8 bg-[#FCFBF8]">
            <div className="container mx-auto px-4 md:px-8">

                {/* Compact Header Section */}
                <div className="text-center mb-4 md:mb-6">
                    <h2 className="text-xl md:text-2xl font-black text-[#111] uppercase tracking-wide mb-1">
                        Shop The Look
                    </h2>
                    <div className="w-10 h-1 bg-[#3B82F6] mx-auto rounded-full mb-2"></div>
                    <p className="text-gray-500 text-[9px] md:text-[11px] tracking-[0.18em] uppercase opacity-80">
                        Complete Your Signature Style
                    </p>
                </div>

                {/* Ultra-Compact Sharp Square Interactive Container */}
                <div className="max-w-[620px] mx-auto relative shadow-[0_24px_60px_-28px_rgba(0,0,0,0.55)] overflow-visible bg-[#0A0B0D] h-[320px] md:h-[580px]">
                    {/* Overlay to close tooltip on click */}
                    {hoveredNode && (
                        <div
                            className="absolute inset-0 z-20 cursor-default"
                            onClick={() => setHoveredNode(null)}
                        />
                    )}

                    {/* Model Image */}
                    <img
                        src={menInteractiveImg}
                        alt="Men Jewelry Model"
                        className="absolute inset-0 w-full h-full object-cover object-center brightness-90 contrast-110"
                    />
                    {/* Dark Portrait Vignette */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/20 pointer-events-none" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20 pointer-events-none" />

                    {/* SVG Connector Lines & Arrows */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <defs>
                            <marker
                                id="arrowhead-blue"
                                markerWidth="3"
                                markerHeight="3"
                                refX="3"
                                refY="1.5"
                                orient="auto"
                            >
                                <path d="M0,0 L3,1.5 L0,3 Z" fill="#3B82F6" />
                            </marker>
                            <marker
                                id="arrowhead-white"
                                markerWidth="2.5"
                                markerHeight="2.5"
                                refX="2.5"
                                refY="1.25"
                                orient="auto"
                            >
                                <path d="M0,0 L2.5,1.25 L0,2.5 Z" fill="rgba(255,255,255,0.4)" />
                            </marker>
                        </defs>
                        {hotspots.map(spot => {
                            const isHovered = hoveredNode === spot.id;
                            const strokeColor = isHovered ? "#3B82F6" : "rgba(255,255,255,0.6)";
                            const sw = isHovered ? "0.3" : "0.2";
                            const markerId = isHovered ? "url(#arrowhead-blue)" : "url(#arrowhead-white)";

                            return (
                                <g key={`group-${spot.id}`}>
                                    <motion.path
                                        d={`M ${spot.x1} ${spot.y1} L ${spot.x2} ${spot.y1} L ${spot.x2} ${spot.y2}`}
                                        fill="none"
                                        stroke={strokeColor}
                                        strokeWidth={sw}
                                        markerEnd={markerId}
                                        initial={{ pathLength: 0, opacity: 0 }}
                                        animate={{
                                            pathLength: 1,
                                            opacity: 1,
                                            strokeDasharray: isHovered ? "none" : "1,1",
                                            strokeDashoffset: isHovered ? 0 : [0, -5]
                                        }}
                                        transition={{
                                            opacity: { duration: 0.5 },
                                            pathLength: { duration: 1.5, ease: "easeInOut" },
                                            strokeDashoffset: { duration: 15, repeat: Infinity, ease: "linear" }
                                        }}
                                    />
                                    <circle
                                        cx={spot.x2} cy={spot.y1} r="0.4"
                                        fill={strokeColor}
                                        className="transition-colors duration-300"
                                    />
                                </g>
                            );
                        })}
                    </svg>

                    {/* Hotspots & Labels */}
                    {hotspots.map((spot, spotIndex) => (
                        <div key={spot.id}>
                            <div
                                className="absolute"
                                style={{ top: `${spot.y1}%`, left: `${spot.x1}%`, transform: 'translate(-50%, -50%)' }}
                                onMouseEnter={() => setHoveredNode(spot.id)}
                                onMouseLeave={() => setHoveredNode(null)}
                            >
                                <div className="relative flex items-center justify-center w-9 h-9 md:w-10 md:h-10 cursor-pointer group z-20">
                                    <motion.div
                                        className="absolute w-full h-full rounded-full border border-white/20"
                                        animate={{ scale: [1, 1.5], opacity: [0.3, 0] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    />
                                    <div className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(255,255,255,0.5)] ${hoveredNode === spot.id ? 'bg-[#3B82F6] scale-150 shadow-blue-500/50' : 'bg-white/40 group-hover:bg-white/80'}`} />
                                </div>
                            </div>

                            <div
                                className="absolute z-30"
                                style={{ top: `${spot.y2}%`, left: `${spot.x2}%`, transform: 'translate(-50%, -50%)' }}
                                onMouseEnter={() => setHoveredNode(spot.id)}
                                onMouseLeave={() => setHoveredNode(null)}
                            >
                                <motion.div
                                    className="relative flex items-center cursor-pointer"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.5, delay: 0.2 }}
                                >
                                    <div className={`px-3 py-1.5 md:px-4 md:py-2 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-xl transition-all duration-300 border border-transparent ${hoveredNode === spot.id ? 'scale-110 shadow-blue-500/20 border-blue-400' : 'hover:-translate-y-1'}`}>
                                        <span className="text-[#111] font-bold text-[9px] md:text-xs uppercase tracking-wide">
                                            {spot.label}
                                        </span>
                                        <ChevronRight className={`w-3 h-3 md:w-3.5 md:h-3.5 ml-1 transition-colors ${hoveredNode === spot.id ? 'text-[#3B82F6]' : 'text-gray-400'}`} />

                                        <AnimatePresence>
                                            {hoveredNode === spot.id && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: shouldAppearAbove(spotIndex) ? -10 : 10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: shouldAppearAbove(spotIndex) ? -10 : 10, scale: 0.95 }}
                                                    className={`absolute min-w-max bg-white p-4 rounded-2xl shadow-2xl border border-gray-100 pointer-events-auto ${
                                                        shouldAppearAbove(spotIndex)
                                                            ? spot.direction === 'left'
                                                                ? 'right-0 bottom-full mb-3'
                                                                : 'left-0 bottom-full mb-3'
                                                            : spot.direction === 'left'
                                                            ? 'right-0 top-full mt-3'
                                                            : 'left-0 top-full mt-3'
                                                    }`}
                                                    style={{ zIndex: 9999 }}
                                                >
                                                    <p className="text-gray-900 text-[12px] font-bold mb-1 line-clamp-2 max-w-xs">{spot.desc}</p>
                                                    <p className="text-[#3B82F6] text-lg font-black mb-3">₹{spot.price}</p>
                                                    <button
                                                        onClick={() => navigate(buildMenShopPath({ category: spot.category }))}
                                                        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#0B1528] text-white text-[11px] font-bold uppercase rounded-xl cursor-pointer hover:bg-[#3B82F6] transition-all duration-300 shadow-lg shadow-blue-900/10 whitespace-nowrap"
                                                    >
                                                        <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
                                                        View Product
                                                    </button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default MenInteractiveLook;
