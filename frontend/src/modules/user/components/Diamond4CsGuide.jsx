import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
    Sparkles,
    CheckCircle2,
    Award,
    Info,
    Gem,
    Layers,
    Eye,
    Scale,
    ArrowRight,
    ShieldCheck,
    ZoomIn,
    Compass,
    SlidersHorizontal,
    Sparkle
} from 'lucide-react';

import roundDiamondImg from '@assets/diamonds/round.png';

// ── 4Cs Comprehensive Educational & Visual Model ────────────────────────────
const CS_CONFIG = {
    cut: {
        key: 'cut',
        tabLabel: '1. Cut',
        title: 'The Master Key to Fire, Brilliance & Sparkle',
        badge: 'Most Critical 4C',
        tagline: 'Cut defines how masterfully facets refract and reflect light back to your eyes.',
        icon: Gem,
        proTip: 'A masterfully cut 0.90ct diamond will look visibly larger, brighter, and more radiant than a poorly cut 1.00ct stone.',
        details: [
            { title: 'Brilliance', desc: 'The pure white light reflected from internal facets back through the crown table.' },
            { title: 'Fire', desc: 'The prismatic dispersion of white light into vivid, spectral rainbow flashes.' },
            { title: 'Scintillation', desc: 'The dynamic flashes of sparkle created as the diamond or light source moves.' },
        ],
        benchmarks: [
            { grade: 'Ideal / Excellent', desc: 'Maximum light return with 0% leakage. Unrivaled scintillation.', active: true },
            { grade: 'Very Good', desc: 'Reflects nearly all light; indistinguishable brilliance to the naked eye.', active: false },
            { grade: 'Good', desc: 'Balanced proportions; slightly less fire at value price tiers.', active: false },
        ],
        // Interactive Cut Sub-modes
        modes: [
            {
                id: 'ideal',
                name: 'Ideal Cut (Triple Excellent)',
                verdict: 'Total Internal Reflection',
                leakage: '0% Light Leakage',
                desc: 'Light enters through the table, reflects internally off both pavilion angles, and exits directly back through the top as brilliant fire.',
                color: '#C59B27',
                accent: 'bg-emerald-50 text-emerald-800 border-emerald-200'
            },
            {
                id: 'shallow',
                name: 'Shallow Cut (Fish Eye)',
                verdict: 'Bottom Light Leakage',
                leakage: 'Escapes Through Base',
                desc: 'Cut too flat; light hits the pavilion at an obtuse angle and escapes through the bottom, causing a dull, watery center appearance.',
                color: '#9CA3AF',
                accent: 'bg-amber-50 text-amber-800 border-amber-200'
            },
            {
                id: 'deep',
                name: 'Deep Cut (Nail Head)',
                verdict: 'Side Light Leakage',
                leakage: 'Escapes Through Sides',
                desc: 'Cut too tall; light reflects off one pavilion facet and shoots out the opposite side rather than returning upwards, creating a dark center.',
                color: '#6B7280',
                accent: 'bg-rose-50 text-rose-800 border-rose-200'
            }
        ]
    },
    colour: {
        key: 'colour',
        tabLabel: '2. Colour',
        title: 'Graded by the Rarest Absence of Colour',
        badge: 'GIA D-to-Z Scale',
        tagline: 'The less body tint present, the purer the light transmission and the higher the gem rarity.',
        icon: Layers,
        proTip: 'For 18K Yellow Gold or Rose Gold settings, G or H colour looks identical in beauty to D colour while offering up to 30% savings.',
        details: [
            { title: 'D - F (Colorless)', desc: 'Rarest in nature. Best set in platinum or white gold for pure icy brilliance.' },
            { title: 'G - J (Near Colorless)', desc: 'Warmth is imperceptible face-up to the naked eye; the connoisseur\'s sweet spot.' },
            { title: 'K - M (Faint Warmth)', desc: 'Delicate champagne warmth; harmonizes beautifully with traditional gold settings.' },
        ],
        benchmarks: [
            { grade: 'D - F', desc: 'Pure Ice Colorless — Certified Rare Collector Gems', active: true },
            { grade: 'G - H', desc: 'Near Colorless — The Ultimate Smart-Luxury Sweet Spot', active: false },
            { grade: 'I - J', desc: 'Near Colorless — Exceptional Everyday Solitaire Value', active: false },
        ],
        // Interactive Colour Grades
        grades: [
            {
                id: 'd-f',
                name: 'D - F (Colorless)',
                tone: 'Pure Icy White',
                rarity: 'Top 1% of World Mining',
                bgTint: 'rgba(240, 248, 255, 0.95)',
                diamondFilter: 'brightness(1.08) saturate(0.95)',
                metalRec: 'Platinum & 18K White Gold',
                desc: 'Completely devoid of colour. Extremely rare and icy white.'
            },
            {
                id: 'g-h',
                name: 'G - H (Near Colorless)',
                tone: 'Eye-Clean Colorless',
                rarity: 'Connoisseur Standard',
                bgTint: 'rgba(255, 253, 245, 0.95)',
                diamondFilter: 'brightness(1.03) saturate(1.02)',
                metalRec: 'All Metals (White, Yellow, Rose)',
                desc: 'Face-up appears completely colorless. The smart luxury choice.'
            },
            {
                id: 'i-j',
                name: 'I - J (Near Colorless)',
                tone: 'Subtle Warm Glow',
                rarity: 'High Carat Value Tier',
                bgTint: 'rgba(255, 250, 235, 0.95)',
                diamondFilter: 'brightness(1.0) sepia(0.08)',
                metalRec: '18K Yellow Gold & Rose Gold',
                desc: 'Faint warmth noticeable only when viewed side-by-side with D stones.'
            },
            {
                id: 'k-m',
                name: 'K - M (Faint Warmth)',
                tone: 'Warm Champagne Tint',
                rarity: 'Vintage Aesthetic',
                bgTint: 'rgba(254, 243, 215, 0.95)',
                diamondFilter: 'brightness(0.98) sepia(0.22)',
                metalRec: 'Yellow Gold & Antique Settings',
                desc: 'Delicate warm champagne glow that complements heritage jewellery.'
            }
        ]
    },
    clarity: {
        key: 'clarity',
        tabLabel: '3. Clarity',
        title: 'Evaluating Nature’s Microscopic Fingerprints',
        badge: 'Structural Purity',
        tagline: 'Under 10x gemological magnification, diamonds are graded for internal inclusions and external blemishes.',
        icon: Eye,
        proTip: 'Every single diamond in the Alankar collection is verified 100% eye-clean, ensuring no inclusions ever impede outer sparkle.',
        details: [
            { title: 'FL / IF', desc: 'Flawless / Internally Flawless. 0 inclusions visible under 10x magnification.' },
            { title: 'VVS1 - VVS2', desc: 'Very, Very Slightly Included. Microscopic pinpoints extremely difficult to detect.' },
            { title: 'VS1 - VS2', desc: 'Very Slightly Included. Completely eye-clean; the luxury standard for fine solitaires.' },
        ],
        benchmarks: [
            { grade: 'FL / IF', desc: 'Collector Grade — The Pinnacle of Diamond Purity', active: true },
            { grade: 'VS1 / VS2', desc: 'Eye-Clean Fine Jewellery — Industry Gold Standard', active: false },
            { grade: 'SI1 / SI2', desc: 'Slightly Included — Maximum Carat Spread Value', active: false },
        ],
        // Interactive Clarity Loupe Tiers
        tiers: [
            {
                id: 'fl',
                grade: 'FL / IF',
                title: 'Flawless / Internally Flawless',
                loupeDesc: '100% inclusion-free under 10x binocular microscope.',
                inclusionsCount: 0,
                rarity: 'Top 0.1% Rare',
                inclusions: []
            },
            {
                id: 'vvs',
                grade: 'VVS1 - VVS2',
                title: 'Very, Very Slightly Included',
                loupeDesc: 'Tiny pinpoint inclusions invisible to untrained eyes even under 10x loupe.',
                inclusionsCount: 1,
                rarity: 'High Connoisseur',
                inclusions: [{ x: 42, y: 38, size: 'w-1 h-1', label: 'Micro Pinpoint' }]
            },
            {
                id: 'vs',
                grade: 'VS1 - VS2',
                title: 'Very Slightly Included (100% Eye-Clean)',
                loupeDesc: 'Minor crystals visible under 10x magnification, completely invisible to the naked eye.',
                inclusionsCount: 2,
                rarity: 'Alankar Gold Standard',
                inclusions: [
                    { x: 35, y: 48, size: 'w-1.5 h-1.5', label: 'Small Crystal' },
                    { x: 65, y: 55, size: 'w-1 h-1', label: 'Faint Feather' }
                ]
            },
            {
                id: 'si',
                grade: 'SI1 - SI2',
                title: 'Slightly Included',
                loupeDesc: 'Inclusions readily found under 10x loupe. Hand-selected by our gemologists to ensure face-up eye cleanliness.',
                inclusionsCount: 3,
                rarity: 'Maximum Value',
                inclusions: [
                    { x: 30, y: 40, size: 'w-2 h-2', label: 'Noticeable Crystal' },
                    { x: 62, y: 36, size: 'w-1.5 h-1.5', label: 'Internal Feather' },
                    { x: 50, y: 68, size: 'w-1.5 h-1.5', label: 'Needle' }
                ]
            }
        ]
    },
    carat: {
        key: 'carat',
        tabLabel: '4. Carat',
        title: 'Precision Metric Weight & Millimeter Spread',
        badge: 'Scale & Diameter',
        tagline: '1 metric carat = 200 milligrams. A balanced cut ensures the carat weight translates to maximum face-up diameter.',
        icon: Scale,
        proTip: 'Diamond prices jump at full carat benchmarks. Selecting 0.95ct instead of 1.00ct saves up to 25% with virtually identical visual presence.',
        details: [
            { title: '0.50 ct (5.1 mm)', desc: 'Delicate daily elegance, minimalist pendants, and stackable bands.' },
            { title: '1.00 ct (6.5 mm)', desc: 'The timeless, iconic milestone solitaire for engagement and anniversary.' },
            { title: '2.00 ct+ (8.2 mm)', desc: 'Heirloom statement solitaires celebrated for commanding finger coverage.' },
        ],
        benchmarks: [
            { grade: '0.50 Carat', desc: 'Approx. 5.1 mm diameter in Ideal Round Brilliant', active: false },
            { grade: '1.00 Carat', desc: 'Approx. 6.5 mm diameter in Ideal Round Brilliant', active: true },
            { grade: '2.00 Carat', desc: 'Approx. 8.2 mm diameter in Ideal Round Brilliant', active: false },
        ],
        // Interactive Carat Weights
        weights: [
            { ct: '0.50 ct', mm: '5.1 mm', scale: 0.62, fingerCoverage: 'Delicate & Everyday', popularity: 'Minimalist' },
            { ct: '0.75 ct', mm: '5.9 mm', scale: 0.74, fingerCoverage: 'Balanced Radiance', popularity: 'Popular' },
            { ct: '1.00 ct', mm: '6.5 mm', scale: 0.86, fingerCoverage: 'The Iconic Solitaire', popularity: 'Most Preferred' },
            { ct: '1.50 ct', mm: '7.4 mm', scale: 1.00, fingerCoverage: 'Prestigious Presence', popularity: 'Luxury' },
            { ct: '2.00 ct', mm: '8.2 mm', scale: 1.14, fingerCoverage: 'Heirloom Grandeur', popularity: 'Collector' },
            { ct: '3.00 ct', mm: '9.4 mm', scale: 1.30, fingerCoverage: 'Prestige Statement', popularity: 'Ultra Rare' },
        ]
    }
};

const Diamond4CsGuide = ({ sectionData }) => {
    const settings = sectionData?.settings || {};
    const title = settings.title || 'Understanding The 4Cs of Diamonds';
    const subtitle = settings.subtitle || 'The universal benchmark of diamond quality and value explained by our master gemologists.';
    const badge = settings.badge || "Buyer's Masterclass";

    const [activeTab, setActiveTab] = useState('cut');

    // Tab-specific interactive sub-states
    const [selectedCutMode, setSelectedCutMode] = useState('ideal');
    const [selectedColourGrade, setSelectedColourGrade] = useState('d-f');
    const [selectedClarityTier, setSelectedClarityTier] = useState('fl');
    const [selectedCarat, setSelectedCarat] = useState('1.00 ct');

    const activeConfig = useMemo(() => CS_CONFIG[activeTab] || CS_CONFIG.cut, [activeTab]);

    return (
        <section className="py-14 sm:py-18 md:py-24 bg-[#F3F5F7] border-b border-[#E2E6EB] overflow-hidden">
            <div className="max-w-[1460px] mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* ── Section Header ────────────────────────────────────── */}
                <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
                    {/* Top Diamond Emblem */}
                    <div className="flex items-center justify-center gap-3 mb-2.5">
                        <span className="h-[1px] w-10 sm:w-14 bg-gradient-to-r from-transparent to-[#C59B27]/70" />
                        <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#C59B27]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="6 3 18 3 22 9 12 22 2 9" />
                        </svg>
                        <span className="h-[1px] w-10 sm:w-14 bg-gradient-to-l from-transparent to-[#C59B27]/70" />
                    </div>

                    {/* Badge */}
                    <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.26em] text-[#64748B] block mb-2 font-sans">
                        {badge}
                    </span>

                    {/* Main Title */}
                    <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-[42px] text-[#141211] font-normal tracking-tight leading-tight mb-2.5">
                        {title}
                    </h2>

                    {/* Subtitle */}
                    <p className="text-xs sm:text-sm md:text-[15px] text-[#4B5563] font-light leading-relaxed max-w-2xl mx-auto">
                        {subtitle}
                    </p>
                </div>

                {/* ── 4Cs Interactive Navigation Tabs ───────────────────── */}
                <div className="flex items-center justify-start sm:justify-center gap-2 sm:gap-3.5 mb-8 sm:mb-12 overflow-x-auto no-scrollbar py-2 px-1 scroll-smooth">
                    {Object.values(CS_CONFIG).map((c) => {
                        const Icon = c.icon;
                        const isCurrent = activeTab === c.key;
                        return (
                            <button
                                key={c.key}
                                type="button"
                                onClick={() => setActiveTab(c.key)}
                                className={`group relative inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 rounded-2xl text-xs sm:text-sm font-semibold tracking-wider transition-all duration-300 cursor-pointer select-none shrink-0 border ${
                                    isCurrent
                                        ? 'bg-[#141211] text-white border-[#141211] shadow-[0_8px_24px_rgba(20,18,17,0.18)] scale-[1.02]'
                                        : 'bg-white text-[#475569] border-[#DFE4EA] hover:border-[#C59B27]/70 hover:text-[#141211] hover:bg-white shadow-2xs'
                                }`}
                            >
                                <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-xl flex items-center justify-center transition-colors ${
                                    isCurrent ? 'bg-[#C59B27]/25 text-[#E6C665]' : 'bg-[#EDF2F7] text-[#64748B] group-hover:text-[#C59B27]'
                                }`}>
                                    <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                </div>
                                <span className="font-sans uppercase text-[11px] sm:text-xs tracking-wider">{c.tabLabel}</span>
                                {isCurrent && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#C59B27] animate-pulse" />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* ── Dynamic Educational Content Panel ─────────────────── */}
                <div className="bg-white rounded-3xl border border-[#DFE4EA] p-5 sm:p-8 md:p-10 lg:p-12 shadow-[0_12px_40px_rgba(15,23,42,0.06)] transition-all duration-400">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
                        
                        {/* ── LEFT COLUMN: Interactive Visual Experience ─────── */}
                        <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
                            
                            {/* Tab 1: Cut Ray-Tracing & Light Performance */}
                            {activeTab === 'cut' && (
                                <div className="space-y-5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold uppercase tracking-widest text-[#8C7A68] font-sans">
                                            Light Reflection & Refraction Simulator
                                        </span>
                                        <span className="text-[11px] text-[#C59B27] font-semibold flex items-center gap-1 font-sans">
                                            <Sparkles className="w-3.5 h-3.5" /> Interactive
                                        </span>
                                    </div>

                                    {/* Main Visual Display */}
                                    <div className="relative aspect-[16/11] rounded-2xl overflow-hidden bg-gradient-to-b from-[#141211] via-[#1E1B18] to-[#141211] border border-[#2D2824] p-5 sm:p-6 flex flex-col items-center justify-between text-white shadow-inner">
                                        {/* Background Sparkle Particles */}
                                        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#C59B27_1px,transparent_1px)] [background-size:16px_16px]" />

                                        {/* Status Tag */}
                                        <div className="w-full flex items-center justify-between z-10">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-sans tracking-wide">
                                                <span className={`w-2 h-2 rounded-full ${selectedCutMode === 'ideal' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                                                <span className="font-semibold text-white/90">
                                                    {CS_CONFIG.cut.modes.find(m => m.id === selectedCutMode)?.verdict}
                                                </span>
                                            </div>
                                            <span className="text-[11px] text-[#E6C665] font-sans font-medium tracking-wide">
                                                {CS_CONFIG.cut.modes.find(m => m.id === selectedCutMode)?.leakage}
                                            </span>
                                        </div>

                                        {/* Diamond Light Ray SVG Visualization */}
                                        <div className="relative w-full max-w-[280px] sm:max-w-[320px] aspect-[16/10] my-auto flex items-center justify-center">
                                            <svg viewBox="0 0 320 200" className="w-full h-full drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
                                                <defs>
                                                    <linearGradient id="rayGold" x1="0%" y1="0%" x2="0%" y2="100%">
                                                        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
                                                        <stop offset="50%" stopColor="#F5D77F" stopOpacity="0.9" />
                                                        <stop offset="100%" stopColor="#C59B27" stopOpacity="0.8" />
                                                    </linearGradient>
                                                    <linearGradient id="leakRed" x1="0%" y1="0%" x2="0%" y2="100%">
                                                        <stop offset="0%" stopColor="#F87171" stopOpacity="0.85" />
                                                        <stop offset="100%" stopColor="#EF4444" stopOpacity="0.3" />
                                                    </linearGradient>
                                                </defs>

                                                {/* Diamond Facet Profile */}
                                                {selectedCutMode === 'ideal' && (
                                                    <g>
                                                        {/* Diamond Outline */}
                                                        <polygon points="60,60 260,60 300,90 160,185 20,90" fill="rgba(255,255,255,0.06)" stroke="#C59B27" strokeWidth="1.8" />
                                                        <line x1="60" y1="60" x2="160" y2="185" stroke="rgba(197,155,39,0.3)" strokeWidth="1" />
                                                        <line x1="260" y1="60" x2="160" y2="185" stroke="rgba(197,155,39,0.3)" strokeWidth="1" />
                                                        <line x1="20" y1="90" x2="300" y2="90" stroke="rgba(197,155,39,0.4)" strokeWidth="1" />
                                                        
                                                        {/* Incoming Light Rays (Top -> Pavilion -> Internal Reflection -> Out Top) */}
                                                        <path d="M 100,10 L 110,60 L 225,140 L 95,140 L 205,60 L 215,10" fill="none" stroke="url(#rayGold)" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="300" strokeDashoffset="0" className="animate-pulse" />
                                                        <path d="M 220,10 L 210,60 L 95,140 L 225,140 L 115,60 L 105,10" fill="none" stroke="url(#rayGold)" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="300" strokeDashoffset="0" className="animate-pulse" />
                                                        
                                                        {/* Sparkle Stars at Light Exit */}
                                                        <circle cx="215" cy="10" r="3" fill="#FFFFFF" />
                                                        <circle cx="105" cy="10" r="3" fill="#FFFFFF" />
                                                    </g>
                                                )}

                                                {selectedCutMode === 'shallow' && (
                                                    <g>
                                                        {/* Shallow Outline */}
                                                        <polygon points="40,75 280,75 310,95 160,140 10,95" fill="rgba(255,255,255,0.05)" stroke="#9CA3AF" strokeWidth="1.8" />
                                                        <line x1="10" y1="95" x2="310" y2="95" stroke="rgba(156,163,175,0.3)" strokeWidth="1" />
                                                        
                                                        {/* Light Rays leaking through bottom */}
                                                        <path d="M 120,20 L 130,75 L 180,140 L 200,195" fill="none" stroke="url(#leakRed)" strokeWidth="2.2" strokeLinecap="round" />
                                                        <path d="M 200,20 L 190,75 L 140,140 L 120,195" fill="none" stroke="url(#leakRed)" strokeWidth="2.2" strokeLinecap="round" />
                                                    </g>
                                                )}

                                                {selectedCutMode === 'deep' && (
                                                    <g>
                                                        {/* Deep Cut Outline */}
                                                        <polygon points="80,50 240,50 270,75 160,195 50,75" fill="rgba(255,255,255,0.05)" stroke="#6B7280" strokeWidth="1.8" />
                                                        <line x1="50" y1="75" x2="270" y2="75" stroke="rgba(107,114,128,0.3)" strokeWidth="1" />
                                                        
                                                        {/* Light Rays leaking through opposite side */}
                                                        <path d="M 120,10 L 130,50 L 210,135 L 290,145" fill="none" stroke="url(#leakRed)" strokeWidth="2.2" strokeLinecap="round" />
                                                        <path d="M 200,10 L 190,50 L 110,135 L 30,145" fill="none" stroke="url(#leakRed)" strokeWidth="2.2" strokeLinecap="round" />
                                                    </g>
                                                )}
                                            </svg>
                                        </div>

                                        {/* Mode Description */}
                                        <p className="text-[11px] sm:text-xs text-white/80 font-light text-center max-w-sm z-10">
                                            {CS_CONFIG.cut.modes.find(m => m.id === selectedCutMode)?.desc}
                                        </p>
                                    </div>

                                    {/* Mode Selector Buttons */}
                                    <div className="grid grid-cols-3 gap-2">
                                        {CS_CONFIG.cut.modes.map((mode) => (
                                            <button
                                                key={mode.id}
                                                type="button"
                                                onClick={() => setSelectedCutMode(mode.id)}
                                                className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                                                    selectedCutMode === mode.id
                                                        ? 'bg-[#FAF6EF] border-[#C59B27] shadow-sm ring-1 ring-[#C59B27]/30'
                                                        : 'bg-white border-[#EBE3D5] hover:bg-[#FAF8F5]'
                                                }`}
                                            >
                                                <div className="text-[11px] sm:text-xs font-serif font-bold text-[#141211] truncate">
                                                    {mode.name.split(' ')[0]} Cut
                                                </div>
                                                <div className="text-[10px] text-[#7A7065] mt-0.5 font-sans truncate">
                                                    {mode.leakage}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Tab 2: Colour Comparison & Tint Spectrum */}
                            {activeTab === 'colour' && (
                                <div className="space-y-5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold uppercase tracking-widest text-[#8C7A68] font-sans">
                                            Diamond Body Tint Comparison
                                        </span>
                                        <span className="text-[11px] text-[#C59B27] font-semibold flex items-center gap-1 font-sans">
                                            <Sparkles className="w-3.5 h-3.5" /> GIA Standard
                                        </span>
                                    </div>

                                    {/* Main Diamond Preview Box with Dynamic Tint */}
                                    {(() => {
                                        const currentGrade = CS_CONFIG.colour.grades.find(g => g.id === selectedColourGrade) || CS_CONFIG.colour.grades[0];
                                        return (
                                            <div className="relative aspect-[16/11] rounded-2xl overflow-hidden border border-[#E8DFD0] p-6 flex flex-col items-center justify-between shadow-inner transition-colors duration-500"
                                                style={{ backgroundColor: currentGrade.bgTint }}
                                            >
                                                {/* Badge */}
                                                <div className="w-full flex items-center justify-between z-10">
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 backdrop-blur-xs border border-[#EBE3D5] text-[11px] font-serif font-bold text-[#141211] shadow-2xs">
                                                        Grade: {currentGrade.name}
                                                    </span>
                                                    <span className="text-[11px] text-[#8C7A68] font-sans font-medium">
                                                        {currentGrade.rarity}
                                                    </span>
                                                </div>

                                                {/* Real Diamond with Dynamic Body Tint Filter */}
                                                <div className="relative w-36 sm:w-44 aspect-square flex items-center justify-center my-auto transition-transform duration-300 hover:scale-105">
                                                    <img
                                                        src={roundDiamondImg}
                                                        alt={currentGrade.name}
                                                        className="w-full h-full object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.18)] transition-all duration-400"
                                                        style={{ filter: currentGrade.diamondFilter }}
                                                    />
                                                </div>

                                                {/* Recommended Setting Strip */}
                                                <div className="w-full bg-white/90 backdrop-blur-xs rounded-xl p-2.5 border border-[#EBE3D5] flex items-center justify-between text-xs z-10 shadow-2xs">
                                                    <span className="text-[11px] text-[#7A7065] font-sans">Best Paired Metal:</span>
                                                    <span className="font-serif font-bold text-[#C59B27] text-[11px] sm:text-xs">
                                                        {currentGrade.metalRec}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Colour Grade Picker Buttons */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {CS_CONFIG.colour.grades.map((grade) => (
                                            <button
                                                key={grade.id}
                                                type="button"
                                                onClick={() => setSelectedColourGrade(grade.id)}
                                                className={`p-2 sm:p-2.5 rounded-xl border text-center transition-all duration-200 cursor-pointer ${
                                                    selectedColourGrade === grade.id
                                                        ? 'bg-[#FAF6EF] border-[#C59B27] shadow-sm ring-1 ring-[#C59B27]/30'
                                                        : 'bg-white border-[#EBE3D5] hover:bg-[#FAF8F5]'
                                                }`}
                                            >
                                                <div className="text-xs font-serif font-bold text-[#141211]">
                                                    {grade.name.split(' ')[0]}
                                                </div>
                                                <div className="text-[10px] text-[#8C7A68] truncate font-sans">
                                                    {grade.tone.split(' ')[0]}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Tab 3: Clarity 10x Gemological Loupe Simulator */}
                            {activeTab === 'clarity' && (
                                <div className="space-y-5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold uppercase tracking-widest text-[#8C7A68] font-sans">
                                            10x Magnification Loupe Simulator
                                        </span>
                                        <span className="text-[11px] text-[#C59B27] font-semibold flex items-center gap-1 font-sans">
                                            <Eye className="w-3.5 h-3.5" /> 10x Gemologist View
                                        </span>
                                    </div>

                                    {/* Loupe Simulation Display */}
                                    {(() => {
                                        const currentTier = CS_CONFIG.clarity.tiers.find(t => t.id === selectedClarityTier) || CS_CONFIG.clarity.tiers[0];
                                        return (
                                            <div className="relative aspect-[16/11] rounded-2xl overflow-hidden bg-gradient-to-b from-[#1E1C1A] to-[#121110] border border-[#332E29] p-5 sm:p-6 flex flex-col items-center justify-between text-white shadow-inner">
                                                {/* Header Status */}
                                                <div className="w-full flex items-center justify-between z-10">
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-sans text-white/90">
                                                        Magnification: 10x Loupe
                                                    </span>
                                                    <span className="text-[11px] text-[#E6C665] font-sans font-medium">
                                                        {currentTier.rarity}
                                                    </span>
                                                </div>

                                                {/* Circular Loupe Ring with Diamond & Inclusions */}
                                                <div className="relative w-40 sm:w-48 aspect-square rounded-full border-4 border-[#C59B27] shadow-[0_0_30px_rgba(197,155,39,0.3)] bg-[#1F1D1B] overflow-hidden flex items-center justify-center my-auto group">
                                                    {/* Crosshair Grid */}
                                                    <div className="absolute inset-0 pointer-events-none opacity-20">
                                                        <div className="w-full h-[1px] bg-white absolute top-1/2 -translate-y-1/2" />
                                                        <div className="h-full w-[1px] bg-white absolute left-1/2 -translate-x-1/2" />
                                                    </div>

                                                    {/* Loupe Diamond Image */}
                                                    <img
                                                        src={roundDiamondImg}
                                                        alt="Clarity Facet View"
                                                        className="w-[110%] h-[110%] object-contain opacity-90 transition-transform duration-300 group-hover:scale-110"
                                                    />

                                                    {/* Microscopic Inclusions Marker Callouts */}
                                                    {currentTier.inclusions.map((inc, iIdx) => (
                                                        <div
                                                            key={iIdx}
                                                            style={{ top: `${inc.y}%`, left: `${inc.x}%` }}
                                                            className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
                                                        >
                                                            <span className="w-3.5 h-3.5 rounded-full bg-rose-500/40 animate-ping absolute" />
                                                            <span className="w-2 h-2 rounded-full bg-rose-500 border border-white relative z-10" />
                                                        </div>
                                                    ))}

                                                    {currentTier.inclusionsCount === 0 && (
                                                        <div className="absolute inset-0 flex items-center justify-center bg-black/25 backdrop-blur-[0.5px]">
                                                            <span className="px-3 py-1 rounded-full bg-emerald-500/80 text-white text-[10px] font-bold tracking-wider font-sans border border-white/20">
                                                                100% FLAWLESS
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Loupe Description */}
                                                <p className="text-[11px] sm:text-xs text-white/80 font-light text-center max-w-sm z-10">
                                                    {currentTier.loupeDesc}
                                                </p>
                                            </div>
                                        );
                                    })()}

                                    {/* Clarity Tier Selector */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {CS_CONFIG.clarity.tiers.map((tier) => (
                                            <button
                                                key={tier.id}
                                                type="button"
                                                onClick={() => setSelectedClarityTier(tier.id)}
                                                className={`p-2 sm:p-2.5 rounded-xl border text-center transition-all duration-200 cursor-pointer ${
                                                    selectedClarityTier === tier.id
                                                        ? 'bg-[#FAF6EF] border-[#C59B27] shadow-sm ring-1 ring-[#C59B27]/30'
                                                        : 'bg-white border-[#EBE3D5] hover:bg-[#FAF8F5]'
                                                }`}
                                            >
                                                <div className="text-xs font-serif font-bold text-[#141211]">
                                                    {tier.grade}
                                                </div>
                                                <div className="text-[10px] text-[#8C7A68] truncate font-sans">
                                                    {tier.inclusionsCount === 0 ? 'No Inclusions' : `${tier.inclusionsCount} Inclusions`}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Tab 4: Carat Metric Weight & Finger Coverage Scale */}
                            {activeTab === 'carat' && (
                                <div className="space-y-5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold uppercase tracking-widest text-[#8C7A68] font-sans">
                                            True-to-Scale Diamond Diameter Comparison
                                        </span>
                                        <span className="text-[11px] text-[#C59B27] font-semibold flex items-center gap-1 font-sans">
                                            <Scale className="w-3.5 h-3.5" /> 1ct = 200mg
                                        </span>
                                    </div>

                                    {/* Interactive Scale Display */}
                                    {(() => {
                                        const currentWeight = CS_CONFIG.carat.weights.find(w => w.ct === selectedCarat) || CS_CONFIG.carat.weights[2];
                                        return (
                                            <div className="relative aspect-[16/11] rounded-2xl overflow-hidden bg-gradient-to-b from-[#FAF8F5] via-[#FFFDF9] to-[#F5EFEB] border border-[#E8DFD0] p-6 flex flex-col items-center justify-between shadow-inner">
                                                {/* Header Status */}
                                                <div className="w-full flex items-center justify-between z-10">
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#EBE3D5] text-[11px] font-serif font-bold text-[#141211] shadow-2xs">
                                                        Selected: {currentWeight.ct} (~{currentWeight.mm})
                                                    </span>
                                                    <span className="text-[11px] text-[#C59B27] font-sans font-semibold">
                                                        {currentWeight.popularity}
                                                    </span>
                                                </div>

                                                {/* Proportional Diamond Scale Representation */}
                                                <div className="relative my-auto flex flex-col items-center justify-center">
                                                    {/* Diamond Ring Band Silhouette Background */}
                                                    <div className="w-48 sm:w-56 h-2 rounded-full bg-gradient-to-r from-transparent via-[#C59B27]/40 to-transparent mb-1" />
                                                    
                                                    {/* Scaled Diamond Image */}
                                                    <div
                                                        className="transition-all duration-400 ease-out flex items-center justify-center"
                                                        style={{
                                                            width: `${120 * currentWeight.scale}px`,
                                                            height: `${120 * currentWeight.scale}px`
                                                        }}
                                                    >
                                                        <img
                                                            src={roundDiamondImg}
                                                            alt={`${currentWeight.ct} Round Diamond`}
                                                            className="w-full h-full object-contain drop-shadow-[0_12px_28px_rgba(197,155,39,0.25)] hover:scale-105 transition-transform"
                                                        />
                                                    </div>

                                                    {/* Millimeter Gauge */}
                                                    <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-sans text-[#7A7065]">
                                                        <span className="font-semibold text-[#141211]">{currentWeight.mm}</span>
                                                        <span>Face-Up Diameter</span>
                                                    </div>
                                                </div>

                                                {/* Solitaire Finger Coverage Info */}
                                                <div className="w-full bg-white/90 backdrop-blur-xs rounded-xl p-2.5 border border-[#EBE3D5] flex items-center justify-between text-xs z-10 shadow-2xs">
                                                    <span className="text-[11px] text-[#7A7065] font-sans">Finger Presence:</span>
                                                    <span className="font-serif font-bold text-[#141211] text-[11px] sm:text-xs">
                                                        {currentWeight.fingerCoverage}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Carat Weight Quick Buttons */}
                                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 sm:gap-2">
                                        {CS_CONFIG.carat.weights.map((weight) => (
                                            <button
                                                key={weight.ct}
                                                type="button"
                                                onClick={() => setSelectedCarat(weight.ct)}
                                                className={`p-2 rounded-xl border text-center transition-all duration-200 cursor-pointer ${
                                                    selectedCarat === weight.ct
                                                        ? 'bg-[#FAF6EF] border-[#C59B27] shadow-sm ring-1 ring-[#C59B27]/30 scale-102'
                                                        : 'bg-white border-[#EBE3D5] hover:bg-[#FAF8F5]'
                                                }`}
                                            >
                                                <div className="text-xs font-serif font-bold text-[#141211]">
                                                    {weight.ct}
                                                </div>
                                                <div className="text-[9px] text-[#8C7A68] font-sans mt-0.5">
                                                    {weight.mm}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* ── RIGHT COLUMN: Educational Insights & Benchmarks ── */}
                        <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
                            
                            {/* Headline & Overview */}
                            <div className="space-y-3">
                                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FAF6EF] border border-[#C59B27]/40 text-[#9E7820] font-sans">
                                    <Award className="w-3.5 h-3.5 text-[#C59B27]" />
                                    <span>{activeConfig.badge}</span>
                                </div>

                                <h3 className="font-serif text-2xl sm:text-3xl text-[#141211] font-normal leading-snug tracking-tight">
                                    {activeConfig.title}
                                </h3>

                                <p className="text-xs sm:text-sm text-[#6B6156] font-light leading-relaxed">
                                    {activeConfig.tagline}
                                </p>
                            </div>

                            {/* Key Factors Triplet */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {activeConfig.details.map((detail, idx) => (
                                    <div
                                        key={idx}
                                        className="p-3.5 sm:p-4 rounded-2xl bg-[#FAF8F5] border border-[#EBE3D5] hover:border-[#C59B27]/50 hover:bg-white transition-all duration-200 shadow-2xs"
                                    >
                                        <h4 className="text-xs font-serif font-bold text-[#141211] mb-1">
                                            {detail.title}
                                        </h4>
                                        <p className="text-[11px] text-[#7A7065] font-light leading-relaxed">
                                            {detail.desc}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* GIA / IGI Quality Tier Benchmarks */}
                            <div className="bg-[#FAF8F5] rounded-2xl p-5 border border-[#EBE3D5]">
                                <div className="flex items-center justify-between mb-3.5">
                                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#8C7A68] font-sans">
                                        Quality Tiers & Alankar Standard
                                    </h4>
                                    <span className="text-[10px] text-[#9E7820] font-semibold flex items-center gap-1 font-sans">
                                        <ShieldCheck className="w-3.5 h-3.5 text-[#C59B27]" /> Certified Selection
                                    </span>
                                </div>

                                <div className="space-y-2.5">
                                    {activeConfig.benchmarks.map((bench, bIdx) => (
                                        <div
                                            key={bIdx}
                                            className={`flex items-start gap-3 p-3 rounded-xl border transition-all duration-200 ${
                                                bench.active
                                                    ? 'bg-white border-[#C59B27]/70 shadow-2xs ring-1 ring-[#C59B27]/20'
                                                    : 'bg-white/60 border-[#EBE3D5]/80 hover:bg-white'
                                            }`}
                                        >
                                            <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${
                                                bench.active ? 'text-[#C59B27]' : 'text-[#8C7A68]'
                                            }`} />
                                            <div>
                                                <span className="text-xs font-bold text-[#141211] block">
                                                    {bench.grade}
                                                </span>
                                                <span className="text-[11px] text-[#7A7065] font-light leading-snug mt-0.5 block">
                                                    {bench.desc}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Master Gemologist Recommendation Callout */}
                            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#FAF6EF] to-white border-l-4 border-l-[#C59B27] border border-[#EBE3D5] shadow-2xs flex items-start gap-3.5">
                                <div className="w-7 h-7 rounded-xl bg-[#C59B27]/15 text-[#9E7820] flex items-center justify-center shrink-0 mt-0.5">
                                    <Info className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                    <span className="text-[10px] uppercase font-sans font-bold tracking-wider text-[#9E7820] block mb-0.5">
                                        Gemologist Buyer's Advice
                                    </span>
                                    <p className="text-xs text-[#5C534A] font-light leading-relaxed">
                                        {activeConfig.proTip}
                                    </p>
                                </div>
                            </div>

                            {/* Section Footer CTA */}
                            <div className="pt-2 flex items-center justify-between">
                                <Link
                                    to={`/shop?metal=diamond`}
                                    className="inline-flex items-center gap-2 text-xs font-semibold text-[#141211] hover:text-[#C59B27] transition-colors group/cta"
                                >
                                    <span>Explore Certified Diamond Jewellery</span>
                                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/cta:translate-x-1" />
                                </Link>

                                <span className="text-[11px] text-[#8C7A68] font-sans">
                                    100% IGI / GIA Certified
                                </span>
                            </div>

                        </div>

                    </div>
                </div>

            </div>
        </section>
    );
};

export default Diamond4CsGuide;
