import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { useShop } from '../../../context/ShopContext';
import AllJewelleryMegaMenu from './AllJewelleryMegaMenu';
import AllJewelleryMenu from './CategoryNavComponents/AllJewelleryMenu';
import BullionsMenu from './CategoryNavComponents/BullionsMenu';
import FamilyMegaMenu from './FamilyMegaMenu';
import { motion, AnimatePresence } from 'framer-motion';

const CategoryNav = ({ showMetalToggle = true }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { activeMetal, updateActiveMetal } = useShop();
    const [hoveredItem, setHoveredItem] = useState(null);
    const itemRefs = useRef({});
    const [menuPlacement, setMenuPlacement] = useState({
        availableHeight: 480,
        shiftX: 0,
        maxWidth: 920
    });

    const navItems = [
        { id: 'cat', name: 'Shop by Category', path: '/collections', hasChevron: true },
        { id: 'all', name: 'All Jewellery', path: '/shop', hasChevron: true },
        { id: 'bullions', name: 'Bullions', path: '/shop?metal=gold&karat=24', hasChevron: true },
        { id: 'him', name: 'Gifts for Him', path: '/category/men', hasChevron: false },
        { id: 'her', name: 'Gifts for Her', path: '/category/women', hasChevron: false },
        { id: 'family', name: 'Gifts for Family', path: '/category/family', hasChevron: false },
        { id: 'exclusive', name: 'Exclusive', fullSuffix: ' Collections', path: '/shop?search=exclusive', hasChevron: false },
        { id: 'more', name: 'More', fullSuffix: ' at Alankar Jewellers', path: '/about', hasChevron: false },
    ];

    const resetMenu = () => {
        setHoveredItem(null);
    };

    const updateMenuPlacement = useCallback(() => {
        if (!hoveredItem || !itemRefs.current[hoveredItem]) return;
        const trigger = itemRefs.current[hoveredItem];
        const rect = trigger.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const margin = 16;

        // Space from bottom of trigger to bottom of viewport minus safety margin
        const spaceBelow = Math.max(260, Math.floor(viewportHeight - rect.bottom - margin));

        // Desired target width for each menu type
        const targetWidth = hoveredItem === 'cat' ? 920 : (hoveredItem === 'all' ? 820 : (hoveredItem === 'bullions' ? 620 : 500));
        const maxWidth = Math.min(targetWidth, viewportWidth - margin * 2);

        // Calculate horizontal offset so menu never extends beyond right or left viewport edges
        let shiftX = 0;
        if (rect.left + maxWidth > viewportWidth - margin) {
            shiftX = (viewportWidth - margin) - (rect.left + maxWidth);
        }
        if (rect.left + shiftX < margin) {
            shiftX = margin - rect.left;
        }

        setMenuPlacement({
            availableHeight: spaceBelow,
            shiftX,
            maxWidth
        });
    }, [hoveredItem]);

    useEffect(() => {
        updateMenuPlacement();
        window.addEventListener('resize', updateMenuPlacement);
        window.addEventListener('scroll', updateMenuPlacement, { passive: true });
        return () => {
            window.removeEventListener('resize', updateMenuPlacement);
            window.removeEventListener('scroll', updateMenuPlacement);
        };
    }, [updateMenuPlacement]);

    // Keep the metal toggle consistent with the current route/query.
    // Silver remains the default landing selection.
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const metalParam = String(params.get('metal') || '').trim().toLowerCase();
        const karatParam = String(params.get('karat') || params.get('purity') || '').trim();
        const isDiamondRoute = location.pathname.startsWith('/diamond') || metalParam === 'diamond';
        const isGoldRoute = location.pathname.startsWith('/gold') || metalParam === 'gold' || (!metalParam && Boolean(karatParam));

        const desiredMetal = isDiamondRoute ? 'diamond' : (isGoldRoute ? 'gold' : 'silver');

        if (desiredMetal && desiredMetal !== activeMetal) {
            updateActiveMetal(desiredMetal);
        }
    }, [activeMetal, location.pathname, location.search, updateActiveMetal]);

    return (
        <div className="border-b block w-full bg-white relative z-40" style={{ borderColor: '#EBEBEB', fontFamily: "'Inter', 'Lato', sans-serif" }}>
            <style>{`
                .category-nav-scroll::-webkit-scrollbar { display: none; }
                .category-nav-scroll { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
            <div className="w-full max-w-[1600px] mx-auto px-2 sm:px-4 md:px-6 lg:px-8 relative" onMouseLeave={resetMenu}>
                {/* Navigation Links - Responsive without left-clipping on any screen */}
                <div className={`w-full ${hoveredItem ? 'overflow-visible' : 'overflow-x-auto lg:overflow-visible'} category-nav-scroll scroll-smooth py-1 flex items-center`}>
                    <ul
                        className="flex items-center w-max min-w-full justify-start lg:justify-center gap-3 sm:gap-4 md:gap-5 lg:gap-7 xl:gap-9 2xl:gap-12 flex-nowrap py-1 px-1 sm:px-2"
                        style={{ justifyContent: 'safe center' }}
                    >
                        {navItems.map((item) => (
                            <li
                                key={item.id}
                                ref={(el) => { itemRefs.current[item.id] = el; }}
                                onMouseEnter={() => {
                                    // 'Shop by Category', 'All Jewellery', and 'Bullions' show dropdowns on hover
                                    if (item.id === 'cat' || item.id === 'all' || item.id === 'bullions') {
                                        setHoveredItem(item.id);
                                    } else {
                                        setHoveredItem(null);
                                    }
                                }}
                                onMouseLeave={() => setHoveredItem(null)}
                                className="relative py-1 shrink-0"
                            >
                                <Link
                                    to={item.path}
                                    onClick={(e) => {
                                        if (item.hasChevron && window.innerWidth < 1024) {
                                            e.preventDefault();
                                            setHoveredItem(hoveredItem === item.id ? null : item.id);
                                        }
                                    }}
                                    className="text-[10.5px] sm:text-[11px] md:text-[11.5px] lg:text-[12px] xl:text-[12.5px] 2xl:text-[13px] font-bold uppercase tracking-tight sm:tracking-normal xl:tracking-[0.04em] font-sans text-[#242424] hover:text-[#C6A04A] flex items-center gap-0.5 sm:gap-1 transition-all duration-200 whitespace-nowrap"
                                >
                                    <span>{item.name}</span>
                                    {item.fullSuffix && <span className="hidden 2xl:inline">{item.fullSuffix}</span>}
                                    {item.hasChevron && (
                                        <ChevronDown
                                            className={`w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#77716A] shrink-0 transition-transform duration-300 ${
                                                hoveredItem === item.id ? 'rotate-180 text-[#C6A04A]' : ''
                                            }`}
                                        />
                                    )}
                                </Link>

                                {/* Dropdowns Mapping */}
                                <AnimatePresence>
                                    {hoveredItem === item.id && (
                                        <div 
                                            className="absolute top-full pt-2 z-[110]"
                                            style={{
                                                left: `${menuPlacement.shiftX || 0}px`
                                            }}
                                            data-lenis-prevent
                                        >
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 5 }}
                                                className="bg-white shadow-[0_20px_45px_rgba(23,23,23,0.12)] border border-[#E8E0D2] overflow-hidden rounded-b-2xl max-w-[calc(100vw-2rem)]"
                                                style={{
                                                    maxHeight: `${menuPlacement.availableHeight}px`
                                                }}
                                                data-lenis-prevent
                                            >
                                                {item.id === 'cat' && (
                                                    <AllJewelleryMenu 
                                                        resetMenu={resetMenu} 
                                                        availableHeight={menuPlacement.availableHeight}
                                                        maxWidth={menuPlacement.maxWidth}
                                                    />
                                                )}
                                                {item.id === 'all' && (
                                                    <AllJewelleryMegaMenu 
                                                        resetMenu={resetMenu} 
                                                        availableHeight={menuPlacement.availableHeight}
                                                        maxWidth={menuPlacement.maxWidth}
                                                    />
                                                )}
                                                {item.id === 'bullions' && (
                                                    <BullionsMenu 
                                                        resetMenu={resetMenu} 
                                                        availableHeight={menuPlacement.availableHeight}
                                                        maxWidth={menuPlacement.maxWidth}
                                                    />
                                                )}
                                                {item.id === 'family' && <FamilyMegaMenu resetMenu={resetMenu} />}
                                            </motion.div>
                                        </div>
                                    )}
                                </AnimatePresence>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Gold / Silver / Diamond 3-Option Selector — Balanced, Aligned & Responsive */}
                {showMetalToggle && (
                    <div className="flex justify-center pb-1.5 pt-0.5 px-2 relative">
                        <div className="p-0.5 md:p-1 w-[600px] max-w-full rounded-full border border-[#E8E0D2] flex items-center bg-white shadow-[0_2px_12px_rgba(23,23,23,0.06)] relative">
                            {/* Animated Background Pill */}
                            <div className="absolute inset-0.5 md:inset-1 flex" style={{ zIndex: 0 }}>
                                <motion.div
                                    layout
                                    initial={false}
                                    animate={{
                                        x: activeMetal === 'gold' ? '0%' : (activeMetal === 'silver' ? '100%' : '200%'),
                                        background: activeMetal === 'gold'
                                            ? 'linear-gradient(135deg, #C6A04A, #E5CC85)'
                                            : (activeMetal === 'silver' ? '#171717' : 'linear-gradient(135deg, #171717, #2A3644, #C6A04A)'),
                                        boxShadow: activeMetal === 'gold'
                                            ? '0 4px 14px rgba(198,160,74,0.3)'
                                            : '0 4px 14px rgba(23,23,23,0.25)'
                                    }}
                                    transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                                    className="w-1/3 h-full rounded-full"
                                />
                            </div>

                            {/* Option 1: Gold */}
                            <button
                                onClick={() => {
                                    updateActiveMetal('gold');
                                    navigate('/gold-collection');
                                }}
                                className={`relative flex-1 py-1.5 md:py-2 px-2 sm:px-4 md:px-6 rounded-full text-[10.5px] sm:text-[11px] md:text-[12.5px] font-bold uppercase tracking-wider md:tracking-widest transition-colors duration-300 z-10 text-center ${activeMetal === 'gold' ? 'text-[#171717]' : 'text-[#77716A] hover:text-[#171717]'}`}
                            >
                                Gold
                            </button>

                            {/* Option 2: Silver */}
                            <button
                                onClick={() => {
                                    updateActiveMetal('silver');
                                    navigate('/');
                                }}
                                className={`relative flex-1 py-1.5 md:py-2 px-2 sm:px-4 md:px-6 rounded-full text-[10.5px] sm:text-[11px] md:text-[12.5px] font-bold uppercase tracking-wider md:tracking-widest transition-colors duration-300 z-10 text-center ${activeMetal === 'silver' ? 'text-white' : 'text-[#77716A] hover:text-[#171717]'}`}
                            >
                                Silver
                            </button>

                            {/* Option 3: Diamond */}
                            <button
                                onClick={() => {
                                    updateActiveMetal('diamond');
                                    navigate('/diamond-collection');
                                }}
                                className={`relative flex-1 py-1.5 md:py-2 px-2 sm:px-4 md:px-6 rounded-full text-[10.5px] sm:text-[11px] md:text-[12.5px] font-bold uppercase tracking-wider md:tracking-widest transition-colors duration-300 z-10 text-center ${activeMetal === 'diamond' ? 'text-white' : 'text-[#77716A] hover:text-[#171717]'}`}
                            >
                                Diamond
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CategoryNav;
