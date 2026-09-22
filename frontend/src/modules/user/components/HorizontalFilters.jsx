import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const useDragScroll = () => {
    const ref = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [startY, setStartY] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);
    const [scrollTop, setScrollTop] = useState(0);

    const onMouseDown = (e) => {
        if (!ref.current) return;
        if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
        setIsDragging(true);
        setStartX(e.pageX - ref.current.offsetLeft);
        setStartY(e.pageY - ref.current.offsetTop);
        setScrollLeft(ref.current.scrollLeft);
        setScrollTop(ref.current.scrollTop);
    };

    const onMouseLeave = () => {
        setIsDragging(false);
    };

    const onMouseUp = () => {
        setIsDragging(false);
    };

    const onMouseMove = (e) => {
        if (!isDragging || !ref.current) return;
        e.preventDefault();
        const x = e.pageX - ref.current.offsetLeft;
        const y = e.pageY - ref.current.offsetTop;
        const walkX = (x - startX) * 1.5;
        const walkY = (y - startY) * 1.5;
        ref.current.scrollLeft = scrollLeft - walkX;
        ref.current.scrollTop = scrollTop - walkY;
    };

    return {
        ref,
        events: {
            onMouseDown,
            onMouseLeave,
            onMouseUp,
            onMouseMove,
        },
        isDragging
    };
};

const HorizontalFilters = ({
    categories = [],
    selectedCategory = 'All',
    onCategoryChange,
    metal = 'All',
    onMetalChange,
    purity = 'All',
    onPurityChange,
    stone = 'All',
    onStonesChange,
    priceRange = 50000,
    onPriceChange,
    audience = 'All',
    onAudienceChange,
    tags = [],
    onTagsChange,
    availability = 'All',
    onAvailabilityChange,
    sortBy = 'New Arrival',
    onSortChange,
    clearAll,
    isCollectionLocked = false
}) => {
    const [activeDropdown, setActiveDropdown] = useState(null);
    const filterScroll = useDragScroll();
    const dropdownScroll = useDragScroll();

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (filterScroll.ref.current && !filterScroll.ref.current.contains(event.target)) {
                setActiveDropdown(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [filterScroll.ref]);

    // Dynamic Purity options based on active metal context
    const normalizedMetal = String(metal || '').trim().toLowerCase();
    const purityOptions = (() => {
        if (normalizedMetal === 'silver') {
            return [
                { label: 'All', value: 'All' },
                { label: '925 Sterling Silver', value: '925' },
                { label: 'Fine Silver', value: 'fine' },
                { label: '800 Silver', value: '800' }
            ];
        }
        if (normalizedMetal === 'gold') {
            return [
                { label: 'All', value: 'All' },
                { label: '24K Gold', value: '24' },
                { label: '22K Gold', value: '22' },
                { label: '18K Gold', value: '18' },
                { label: '14K Gold', value: '14' }
            ];
        }
        if (normalizedMetal === 'diamond') {
            return [
                { label: 'All', value: 'All' },
                { label: '18K Setting', value: '18' },
                { label: '14K Setting', value: '14' },
                { label: 'Platinum 950', value: 'platinum' }
            ];
        }
        return [
            { label: 'All', value: 'All' },
            { label: '925 Sterling Silver', value: '925' },
            { label: '24K Gold', value: '24' },
            { label: '22K Gold', value: '22' },
            { label: '18K Gold', value: '18' },
            { label: '14K Gold', value: '14' }
        ];
    })();

    const stoneOptions = [
        { label: 'All', value: 'All' },
        { label: 'Plain / No Stone', value: 'none' },
        { label: 'American Diamond (AD)', value: 'ad' },
        { label: 'Natural Diamond', value: 'natural' },
        { label: 'Lab-Grown Diamond', value: 'lab_grown' },
        { label: 'Pearls & Kundan', value: 'pearl_kundan' }
    ];

    const availabilityOptions = [
        { label: 'All', value: 'All' },
        { label: 'In Stock', value: 'in_stock' },
        { label: 'Out of Stock', value: 'out_of_stock' }
    ];

    const purityDisplayLabel = purityOptions.find(o => o.value === purity)?.label || (purity === 'All' ? 'All' : purity);
    const stoneDisplayLabel = stoneOptions.find(o => o.value === stone)?.label || (stone === 'All' ? 'All' : stone);
    const availabilityDisplayLabel = availabilityOptions.find(o => o.value === availability)?.label || (availability === 'All' ? 'All' : availability);

    // EXACT 8 FILTERS IN REQUIRED ORDER:
    // 1. Product Type | 2. Metal | 3. Purity | 4. Stones | 5. Price | 6. Shop For | 7. Style | 8. Availability
    const filterGroups = [
        {
            id: 'product-type',
            label: 'Product Type',
            value: selectedCategory || 'All',
            displayValue: selectedCategory !== 'All' ? selectedCategory : '',
            options: ['All', ...categories.map(c => c.name)],
            onChange: onCategoryChange
        },
        {
            id: 'metal',
            label: 'Metal / Material',
            value: metal || 'All',
            displayValue: metal !== 'All' ? (metal.charAt(0).toUpperCase() + metal.slice(1)) : '',
            options: ['All', 'Gold', 'Silver', 'Diamond'],
            onChange: onMetalChange
        },
        {
            id: 'purity',
            label: 'Purity',
            value: purity || 'All',
            displayValue: purity !== 'All' ? purityDisplayLabel : '',
            options: purityOptions,
            onChange: onPurityChange
        },
        {
            id: 'stones',
            label: 'Stones',
            value: stone || 'All',
            displayValue: stone !== 'All' ? stoneDisplayLabel : '',
            options: stoneOptions,
            onChange: onStonesChange
        },
        {
            id: 'price',
            label: 'Price',
            value: priceRange >= 50000 ? 'All' : `Under ₹${priceRange.toLocaleString()}`,
            displayValue: priceRange < 50000 ? `Under ₹${priceRange.toLocaleString()}` : '',
            isSlider: true,
            min: 1000,
            max: 50000,
            step: 500,
            current: priceRange,
            onChange: onPriceChange
        },
        {
            id: 'shop-for',
            label: 'Shop For',
            value: audience === 'All' || !audience ? 'All' : audience.charAt(0).toUpperCase() + audience.slice(1),
            displayValue: (audience && audience !== 'All' && audience !== 'all') ? (audience.charAt(0).toUpperCase() + audience.slice(1)) : '',
            options: ['All', 'Women', 'Men', 'Family'],
            onChange: (val) => onAudienceChange(val.toLowerCase())
        },
        {
            id: 'style',
            label: 'Style',
            value: tags.length > 0 ? `${tags.length} Selected` : 'All',
            displayValue: tags.length > 0 ? `${tags.length} Selected` : '',
            options: [
                { label: 'Trending', value: 'isTrending' },
                { label: 'New Arrival', value: 'isNewArrival' },
                { label: 'Best Selling', value: 'isMostGifted' },
                { label: 'Premium', value: 'isPremium' }
            ],
            isMulti: true,
            onChange: onTagsChange
        },
        {
            id: 'availability',
            label: 'Availability',
            value: availability || 'All',
            displayValue: availability !== 'All' ? availabilityDisplayLabel : '',
            options: availabilityOptions,
            onChange: onAvailabilityChange
        }
    ];

    const toggleDropdown = (id) => {
        setActiveDropdown(activeDropdown === id ? null : id);
    };

    const hasActiveFilters = 
        (selectedCategory && selectedCategory !== 'All') ||
        (metal && metal !== 'All' && !isCollectionLocked) ||
        (purity && purity !== 'All') ||
        (stone && stone !== 'All') ||
        (priceRange && priceRange < 50000) ||
        (audience && audience !== 'All' && audience !== 'all') ||
        (tags && tags.length > 0) ||
        (availability && availability !== 'All');

    return (
        <div className="hidden md:block w-full border-b border-stone-200 bg-white">
            <div className="py-2.5 flex items-center justify-between gap-4">
                <div 
                    {...filterScroll.events}
                    ref={filterScroll.ref}
                    className={`flex items-center gap-2 flex-wrap ${filterScroll.isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'}`}
                >
                    {filterGroups.map((group) => {
                        const isGroupActive = Boolean(group.displayValue) || (group.id === 'price' && priceRange < 50000);

                        return (
                            <div key={group.id} className="relative">
                                <button
                                    onClick={() => toggleDropdown(group.id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all text-[13px] font-medium whitespace-nowrap ${
                                        activeDropdown === group.id || isGroupActive
                                            ? 'border-[#C59B27] bg-[#FAF8F5] text-[#141211] font-semibold shadow-sm'
                                            : 'border-stone-200 hover:border-[#C59B27] text-stone-700'
                                    }`}
                                >
                                    <span>
                                        {isGroupActive && group.displayValue ? `${group.label}: ${group.displayValue}` : group.label}
                                    </span>
                                    <ChevronDown className={`w-3.5 h-3.5 text-stone-500 transition-transform duration-300 ${activeDropdown === group.id ? 'rotate-180 text-[#C59B27]' : ''}`} />
                                </button>

                                <AnimatePresence>
                                    {activeDropdown === group.id && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            transition={{ duration: 0.2 }}
                                            {...dropdownScroll.events}
                                            ref={dropdownScroll.ref}
                                            className={`absolute left-0 mt-2 ${group.isSlider ? 'w-64' : 'w-56 py-2 max-h-[350px] overflow-y-auto'} bg-white border border-[#C59B27]/30 rounded-xl shadow-2xl z-[110] custom-scrollbar overscroll-contain ${dropdownScroll.isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'}`}
                                        >
                                            {group.isSlider ? (
                                                <div className="px-5 py-4 w-full">
                                                    <div className="flex justify-between text-xs text-stone-700 font-bold mb-4 tracking-wide">
                                                        <span>₹0</span>
                                                        <span className="text-[#C59B27]">₹{group.current >= group.max ? `${group.max.toLocaleString()}+` : group.current.toLocaleString()}</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min={group.min}
                                                        max={group.max}
                                                        step={group.step}
                                                        value={group.current}
                                                        onChange={(e) => group.onChange(Number(e.target.value))}
                                                        className="w-full h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-[#C59B27]"
                                                    />
                                                    <div className="flex justify-between items-center mt-5">
                                                        <button 
                                                            onClick={() => group.onChange(group.max)}
                                                            className="text-[11px] font-bold text-stone-500 hover:text-stone-800 uppercase tracking-widest transition-colors"
                                                        >
                                                            Reset
                                                        </button>
                                                        <button 
                                                            onClick={() => setActiveDropdown(null)}
                                                            className="px-4 py-1.5 bg-[#141211] hover:bg-[#1C1917] text-[#E8D198] border border-[#C59B27]/40 text-[11px] font-bold uppercase tracking-widest rounded-full transition-colors shadow-sm"
                                                        >
                                                            Apply
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                group.options.map((option) => {
                                                    const label = typeof option === 'string' ? option : option.label;
                                                    const val = typeof option === 'string' ? option : option.value;
                                                    const isSelected = group.isMulti 
                                                        ? tags.includes(val)
                                                        : (group.value === val || group.value === label || (group.id === 'shop-for' && audience === String(val).toLowerCase()));

                                                    return (
                                                        <button
                                                            key={label}
                                                            onClick={() => {
                                                                group.onChange(val);
                                                                if (!group.isMulti) setActiveDropdown(null);
                                                            }}
                                                            className={`w-full text-left px-4 py-2.5 text-[13px] hover:bg-[#FAF8F5] transition-colors flex items-center justify-between group ${
                                                                isSelected ? 'text-[#141211] font-bold bg-[#FAF8F5]' : 'text-stone-600'
                                                            }`}
                                                        >
                                                            <span>{label}</span>
                                                            {isSelected && <Check className="w-4 h-4 text-[#C59B27]" />}
                                                        </button>
                                                    );
                                                })
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                    
                    {/* Clear All Button */}
                    {hasActiveFilters && (
                        <button
                            onClick={clearAll}
                            className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-bold text-[#C59B27] hover:bg-amber-500/10 rounded-full transition-colors ml-2 shrink-0"
                        >
                            <X className="w-3.5 h-3.5" />
                            Clear All
                        </button>
                    )}
                </div>

                {/* Sort By Separate on Right */}
                <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[12px] text-stone-400 font-medium uppercase tracking-widest mr-2">Sort By:</span>
                    <select 
                        value={sortBy}
                        onChange={(e) => onSortChange(e.target.value)}
                        className="bg-transparent text-[13px] font-bold text-stone-800 outline-none cursor-pointer border-b border-transparent hover:border-[#C59B27] transition-all"
                    >
                        <option value="New Arrival">New Arrival</option>
                        <option value="Discount">Discount</option>
                        <option value="Best Selling">Best Selling</option>
                    </select>
                </div>
            </div>
        </div>
    );
};

export default HorizontalFilters;
