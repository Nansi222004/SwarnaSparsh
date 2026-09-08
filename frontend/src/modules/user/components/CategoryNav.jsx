import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { useShop } from '../../../context/ShopContext';
import AllJewelleryMegaMenu from './AllJewelleryMegaMenu';
import AllJewelleryMenu from './CategoryNavComponents/AllJewelleryMenu';
import FamilyMegaMenu from './FamilyMegaMenu';
import { motion, AnimatePresence } from 'framer-motion';

const CategoryNav = ({ showMetalToggle = true }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { activeMetal, updateActiveMetal } = useShop();
    const [hoveredItem, setHoveredItem] = useState(null);

    const navItems = [
        { id: 'cat', name: 'Shop by Category', path: '/collections', hasChevron: true },
        { id: 'all', name: 'ALL TYPE', path: '/collections', hasChevron: true },
        { id: 'him', name: 'Gifts for Him', path: '/category/men', hasChevron: false },
        { id: 'her', name: 'Gifts for Her', path: '/category/women', hasChevron: false },
        { id: 'family', name: 'Gifts for Family', path: '/category/family', hasChevron: false },
        { id: 'card', name: 'Gift Cards', path: '/gift-cards', hasChevron: false },
        { id: 'exclusive', name: 'Exclusive', fullSuffix: ' Collections', path: '/shop?search=exclusive', hasChevron: false },
        { id: 'more', name: 'More', fullSuffix: ' at Swarna Sparsh', path: '/about', hasChevron: false },
    ];

    const resetMenu = () => {
        setHoveredItem(null);
    };

    // Keep the metal toggle consistent with the current route/query.
    // This prevents confusing UI states when a user lands directly on a gold page or a gold-filtered shop URL.
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const metalParam = String(params.get('metal') || '').trim().toLowerCase();
        const karatParam = String(params.get('karat') || params.get('purity') || '').trim();
        const silverTypeParam = String(params.get('silver_type') || '').trim();
        const isGoldRoute = location.pathname.startsWith('/gold');
        const desiredMetal = (
            metalParam === 'gold'
            || isGoldRoute
            || (!metalParam && Boolean(karatParam))
        ) ? 'gold' : (
            metalParam === 'silver'
            || (!metalParam && Boolean(silverTypeParam))
        ) ? 'silver' : 'silver';

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
                <div className="w-full overflow-x-auto lg:overflow-visible category-nav-scroll scroll-smooth py-1 flex items-center">
                    <ul 
                        className="flex items-center w-max min-w-full justify-start lg:justify-center gap-2 sm:gap-2.5 md:gap-3 lg:gap-4 xl:gap-5 2xl:gap-7 flex-nowrap py-1 px-1 sm:px-2"
                        style={{ justifyContent: 'safe center' }}
                    >
                        {navItems.map((item) => (
                            <li
                                key={item.id}
                                onMouseEnter={() => {
                                    // Only 'Shop by Category' and 'ALL TYPE' show dropdowns on hover
                                    if (item.id === 'cat' || item.id === 'all') {
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
                                    className="text-[10px] sm:text-[10.5px] md:text-[11px] lg:text-[11.5px] xl:text-[12px] 2xl:text-[12.5px] font-bold uppercase tracking-tight sm:tracking-normal xl:tracking-[0.05em] font-sans text-gray-800 hover:text-[#C59B27] flex items-center gap-0.5 sm:gap-1 transition-all duration-200 whitespace-nowrap"
                                >
                                    <span>{item.name}</span>
                                    {item.fullSuffix && <span className="hidden 2xl:inline">{item.fullSuffix}</span>}
                                    {item.hasChevron && <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-500 shrink-0" />}
                                </Link>

                                {/* Dropdowns Mapping */}
                                <AnimatePresence>
                                    {hoveredItem === item.id && (
                                        <div className="absolute top-full left-0 pt-2 z-[110]">
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 5 }}
                                                className="bg-white shadow-[0_30px_60px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden rounded-b-2xl max-w-[calc(100vw-1.5rem)]"
                                            >
                                                {item.id === 'cat' && <AllJewelleryMenu resetMenu={resetMenu} />}
                                                {item.id === 'all' && <AllJewelleryMegaMenu resetMenu={resetMenu} />}
                                                {item.id === 'family' && <FamilyMegaMenu resetMenu={resetMenu} />}
                                            </motion.div>
                                        </div>
                                    )}
                                </AnimatePresence>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Silver / Gold Toggle - Precise Swarna Sparsh Polish with Navigation logic */}
                {showMetalToggle && (
                    <div className="flex justify-center pb-1 pt-0.5 px-2 relative">
                        <div className="p-0.5 md:p-1 w-[560px] max-w-full rounded-full border border-[#D4B390]/40 flex items-center bg-white shadow-[0_4px_25px_rgba(212,179,144,0.15)] relative">
                            {/* Animated Background Pill */}
                            <div className="absolute inset-0.5 md:inset-1 flex" style={{ zIndex: 0 }}>
                                <motion.div
                                    layout
                                    initial={false}
                                    animate={{
                                        x: activeMetal === 'gold' ? '100%' : '0%',
                                        background: activeMetal === 'gold' 
                                            ? 'linear-gradient(to right, #BF953F, #FCF6BA, #B38728)' 
                                            : 'linear-gradient(to right, #4B5563, #374151, #1F2937)',
                                        boxShadow: activeMetal === 'gold'
                                            ? '0 8px 20px rgba(191,149,63,0.35)'
                                            : '0 8px 20px rgba(0,0,0,0.25)'
                                    }}
                                    transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                                    className="w-1/2 h-full rounded-full"
                                />
                            </div>

                            <button
                                onClick={() => {
                                    updateActiveMetal('silver');
                                    navigate('/');
                                }}
                                className={`relative flex-1 py-1 px-4 md:px-8 rounded-full text-[11px] md:text-[13px] font-bold uppercase tracking-wider md:tracking-widest transition-colors duration-300 z-10 ${activeMetal === 'silver' ? 'text-white' : 'text-[#4A4A4A] hover:text-black'}`}
                            >
                                Silver
                            </button>
                            <button
                                onClick={() => {
                                    updateActiveMetal('gold');
                                    navigate('/gold-collection');
                                }}
                                className={`relative flex-1 py-1 px-4 md:px-8 rounded-full text-[11px] md:text-[13px] font-bold uppercase tracking-wider md:tracking-widest transition-colors duration-300 z-10 ${activeMetal === 'gold' ? 'text-[#3D2B1F]' : 'text-[#4A4A4A] hover:text-black'}`}
                            >
                                Gold
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CategoryNav;
