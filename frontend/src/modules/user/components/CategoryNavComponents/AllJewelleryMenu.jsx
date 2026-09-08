import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useShop } from '../../../../context/ShopContext';

const AllJewelleryMenu = ({ resetMenu }) => {
    const { categories } = useShop();
    const [hoveredCategory, setHoveredCategory] = useState('All');

    const withQuery = (basePath, queryString) => {
        const base = String(basePath || '').trim() || '/shop';
        const qs = String(queryString || '').trim();
        if (!qs) return base;
        return `${base}${base.includes('?') ? '&' : '?'}${qs}`;
    };

    const fallbackMainCategories = [
        { id: 'all',       name: 'All',                   path: '/shop' },
        { id: 'rings',     name: 'Rings',                 path: '/category/rings',     hasSub: true },
        { id: 'necklaces', name: 'Necklaces & Pendants',  path: '/category/necklaces', hasSub: true },
        { id: 'bracelets', name: 'Bracelets',             path: '/category/bracelets', hasSub: true },
        { id: 'earrings',  name: 'Earrings',              path: '/category/earrings',  hasSub: true },
        { id: 'anklets',   name: 'Anklets',               path: '/category/anklets',   hasSub: true },
        { id: 'others',    name: 'Other Categories',      path: '/collections',         hasSub: true },
    ];

    const fallbackAllJewelleryLinks = [
        { id: 'sets',          name: 'Jewellery Sets',   path: '/category/sets' },
        { id: 'personalised',  name: 'Personalised',     path: '/category/personalised' },
        { id: 'watch-charms',  name: 'Watch Charms',     path: '/category/watch-charms' },
        { id: 'mangalsutras',  name: 'Mangalsutras',     path: '/category/mangalsutras' },
        { id: 'chains',        name: 'Chains',           path: '/category/chains' },
        { id: 'toe-rings',     name: 'Toe Rings',        path: '/category/toe-rings' },
        { id: 'nose-pins',     name: 'Nose Pins',        path: '/category/nose-pins' },
        { id: 'kids',          name: 'Kids',             path: '/category/kids' },
    ];

    const mainCategories = useMemo(() => {
        const navbarCategories = (categories || [])
            .filter((cat) => cat?.isActive !== false && cat?.showInNavbar !== false)
            .sort((a, b) => Number(a?.sortOrder ?? 0) - Number(b?.sortOrder ?? 0)
                || String(a?.name || '').localeCompare(String(b?.name || '')))
            .map((cat) => {
                let slug = String(cat?.slug || cat?.path || '').trim();
                slug = slug.replace(/^\/+/, '');
                if (slug.toLowerCase().startsWith('category/')) {
                    slug = slug.slice('category/'.length);
                }
                const id = cat?._id || cat?.id || '';
                const safePath = slug
                    ? `/category/${slug}`
                    : (id ? `/shop?category=${encodeURIComponent(String(id))}` : '/shop');
                return {
                    id: id || slug || cat?.name,
                    name: cat?.name || '',
                    path: safePath,
                    hasSub: true
                };
            })
            .filter((cat) => Boolean(cat.name));

        if (navbarCategories.length === 0) {
            return fallbackMainCategories;
        }

        return [
            { id: 'all', name: 'All', path: '/shop' },
            ...navbarCategories
        ];
    }, [categories]);

    const allJewelleryLinks = useMemo(() => {
        const dynamicLinks = mainCategories
            .filter((cat) => cat.id !== 'all')
            .map((cat) => ({
                id: cat.id,
                name: cat.name,
                path: cat.path
            }));

        return dynamicLinks.length > 0 ? dynamicLinks : fallbackAllJewelleryLinks;
    }, [mainCategories]);

    // ─── FIXED: all URLs now use params that Shop.jsx actually reads ────────────
    const filterGroups = [
        {
            title: 'Shop by Price',
            items: [
                // Shop.jsx reads price_max (upper bound) & price_min (lower bound — newly added)
                { name: 'Under ₹1,500',    path: '/shop?price_max=1500' },
                { name: '₹1,500 – ₹3,000', path: '/shop?price_min=1500&price_max=3000' },
                { name: '₹3,000 – ₹5,000', path: '/shop?price_min=3000&price_max=5000' },
                { name: 'Above ₹5,000',    path: '/shop?price_min=5000' },
            ]
        },
        {
            title: 'Shop by Metal',
            items: [
                // Align with purity behavior: 925 = sterling-only, pure gold = 24K.
                { name: '925 Silver', path: '/shop?metal=silver&silver_type=sterling' },
                { name: 'Pure Gold',  path: '/shop?metal=gold&karat=24' },
            ]
        },
        {
            title: 'Shop by Colour',
            items: [
                // Map colour options to search/metal params Shop.jsx supports
                { name: 'Silver',      path: '/shop?metal=silver' },
                { name: 'Gold Plated', path: '/shop?metal=gold' },
                { name: 'Rose Gold',   path: '/shop?search=rose+gold' },
                { name: 'Oxidised',    path: '/shop?search=oxidised' },
            ]
        },
        {
            title: 'Shop by Style',
            items: [
                // Map style to the sort param Shop.jsx supports
                { name: 'Everyday',  path: '/shop?sort=most-sold' },
                { name: 'Festive',   path: '/shop?search=festive' },
                { name: 'Gifting',   path: '/shop?search=gift' },
                { name: 'Minimalist',path: '/shop?search=minimalist' },
            ]
        }
    ];

    // Per-category filter groups (shown when a category like Rings is hovered)
    const getCategoryFilters = (categoryName) => {
        const matchedCategory = mainCategories.find((cat) => cat.name === categoryName);
        const fallbackSlug = categoryName.toLowerCase().replace(/\s+/g, '-').replace('necklaces-&-pendants', 'necklaces');
        const catPath = matchedCategory?.path || `/category/${fallbackSlug}`;
        return [
            {
                title: 'Shop by Price',
                items: [
                    { name: 'Under ₹1,500',    path: withQuery(catPath, 'price_max=1500') },
                    { name: '₹1,500 – ₹3,000', path: withQuery(catPath, 'price_min=1500&price_max=3000') },
                    { name: '₹3,000 – ₹5,000', path: withQuery(catPath, 'price_min=3000&price_max=5000') },
                    { name: 'Above ₹5,000',    path: withQuery(catPath, 'price_min=5000') },
                ]
            },
            {
                title: 'Shop by Metal',
                items: [
                    // Keep consistent with the ALL TYPE purity behavior.
                    { name: '925 Silver', path: withQuery(catPath, 'metal=silver&silver_type=sterling') },
                    { name: 'Pure Gold',  path: withQuery(catPath, 'metal=gold&karat=24') },
                ]
            },
            {
                title: 'Colours',
                items: [
                    { name: 'Silver',      path: withQuery(catPath, 'metal=silver') },
                    { name: 'Gold Plated', path: withQuery(catPath, 'metal=gold') },
                    { name: 'Rose Gold',   path: withQuery(catPath, 'search=rose+gold') },
                    { name: 'Oxidised',    path: withQuery(catPath, 'search=oxidised') },
                ]
            },
        ];
    };

    const currentFilters = hoveredCategory === 'All'
        ? filterGroups
        : getCategoryFilters(hoveredCategory);

    return (
        <div className="flex bg-white h-[480px] w-[950px] max-w-[calc(100vw-2rem)] shadow-[0_25px_60px_rgba(0,0,0,0.18)] overflow-hidden border border-gray-100 rounded-b-2xl font-sans">

            {/* ── Left Sidebar: Category list (Compact & Scrollable) ─────────────────────────────── */}
            <div className="w-[220px] bg-[#F9FAFB] border-r border-gray-100 py-6 shrink-0 overflow-y-auto custom-scrollbar">
                <ul className="flex flex-col gap-1">
                    {mainCategories.map((cat) => (
                        <li key={cat.id}>
                            <Link
                                to={cat.path}
                                onMouseEnter={() => setHoveredCategory(cat.name)}
                                onClick={resetMenu}
                                className={`flex items-center px-6 py-2.5 text-[14px] transition-all duration-200 border-l-[3px] ${
                                    hoveredCategory === cat.name
                                        ? 'text-[#C59B27] font-semibold bg-[#FAF8F5] border-[#C59B27]'
                                        : 'text-gray-600 font-medium border-transparent hover:text-stone-900 hover:bg-[#FAF8F5]/60'
                                }`}
                            >
                                <span className="tracking-tight whitespace-nowrap">{cat.name}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>

            {/* ── Right Content: Dynamic (Compact & Scrollable) ─────────── */}
            <div className="flex-1 bg-white py-6 px-6 lg:px-10 overflow-y-auto custom-scrollbar min-w-0">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={hoveredCategory}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {/* Compact View All Button - Requested by USER */}
                        <div className="flex justify-end mb-4 border-b border-stone-100 pb-2.5">
                            <Link
                                to={mainCategories.find(c => c.name === hoveredCategory)?.path || '/shop'}
                                onClick={resetMenu}
                                className="inline-flex items-center text-[10px] font-bold text-[#141211] hover:text-[#C59B27] transition-all uppercase tracking-[0.2em] bg-[#FAF8F5] px-4 py-1.5 rounded-full border border-[#E8DFD0] hover:border-[#C59B27]/40 hover:shadow-sm active:scale-95 whitespace-nowrap"
                            >
                                {hoveredCategory === 'All' ? 'Explore All Jewellery' : `View All ${hoveredCategory}`} →
                            </Link>
                        </div>

                        {hoveredCategory === 'All' ? (
                            /* All Jewellery: 3-column breathable grid */
                            <div className="grid grid-cols-3 gap-x-12 gap-y-2">
                                {allJewelleryLinks.map((sub) => (
                                    <Link
                                        key={sub.id}
                                        to={sub.path}
                                        onClick={resetMenu}
                                        className="text-[13px] font-medium text-stone-600 hover:text-[#C59B27] transition-all hover:translate-x-1.5 duration-200 py-0.5 block truncate"
                                        title={sub.name}
                                    >
                                        {sub.name}
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            /* Category-specific: Refined filter columns */
                            <div className="flex flex-wrap gap-x-16 gap-y-12">
                                {currentFilters.map((group) => (
                                    <div key={group.title} className="flex flex-col gap-4" style={{ minWidth: '150px' }}>
                                        <h4 className="text-[11px] font-bold text-stone-400 tracking-[0.2em] uppercase whitespace-nowrap pb-1 border-b border-stone-100">
                                            {group.title}
                                        </h4>
                                        <div className="flex flex-col gap-3">
                                            {group.items.map((item) => (
                                                <Link
                                                    key={item.name}
                                                    to={item.path}
                                                    onClick={resetMenu}
                                                    className="text-[13px] font-medium text-stone-600 hover:text-[#C59B27] transition-all hover:translate-x-1.5 duration-200 w-fit"
                                                >
                                                    {item.name}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default AllJewelleryMenu;
