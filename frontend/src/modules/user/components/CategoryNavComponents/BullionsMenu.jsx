import React from 'react';
import { Link } from 'react-router-dom';
import { Coins, ShieldCheck, Scale, Award, ArrowRight, ChevronRight } from 'lucide-react';

const BullionsMenu = ({ resetMenu, availableHeight, maxWidth }) => {
    const menuMaxHeight = availableHeight ? Math.min(420, availableHeight) : 420;

    const goldWeights = ['1g', '2g', '5g', '8g', '10g', '20g', '50g'];
    const silverWeights = ['10g', '20g', '50g', '100g', '250g', '500g', '1kg'];

    const goldItems = [
        {
            title: '24K Pure Gold Coins',
            subtitle: 'Minted 99.9% investment coins',
            path: '/shop?metal=gold&karat=24',
        },
        {
            title: 'Gold Bars & Ingots',
            subtitle: 'CertiCard assay packaging',
            path: '/shop?metal=gold&karat=24',
        },
        {
            title: '22K Standard Gold Coins',
            subtitle: 'Traditional celebratory & gifting',
            path: '/shop?metal=gold&karat=22',
        },
    ];

    const silverItems = [
        {
            title: '999 Fine Silver Coins',
            subtitle: '99.9% pure investment coins',
            path: '/shop?metal=silver&silver_type=fine',
        },
        {
            title: '999 Pure Silver Bars',
            subtitle: 'Assayed bullion with purity seal',
            path: '/shop?metal=silver&silver_type=fine',
        },
        {
            title: '925 Sterling Silver Coins',
            subtitle: 'Commemorative puja & gifting coins',
            path: '/shop?metal=silver&silver_type=sterling',
        },
    ];

    return (
        <div 
            className="flex flex-col bg-white w-[600px] sm:w-[620px] max-w-[calc(100vw-2rem)] shadow-[0_20px_45px_rgba(20,18,17,0.12)] overflow-hidden border border-[#E8DFD0] rounded-b-2xl font-sans"
            style={{
                maxHeight: menuMaxHeight ? `${menuMaxHeight}px` : 'min(420px, calc(100vh - 140px))',
                width: maxWidth ? `${maxWidth}px` : undefined,
            }}
            data-lenis-prevent
            onWheel={(e) => e.stopPropagation()}
        >
            {/* ── Compact Header Row ── */}
            <div className="bg-[#FAF8F5] px-4 sm:px-5 py-2.5 border-b border-[#E8DFD0]/70 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <Coins className="w-3.5 h-3.5 text-[#C59B27] shrink-0" />
                    <span className="text-xs font-semibold text-[#141211] font-serif tracking-wide">
                        Bullions & Investment Coins
                    </span>
                    <span className="text-[10px] text-stone-400 font-sans hidden sm:inline">
                        • 100% BIS Hallmarked
                    </span>
                </div>

                <Link
                    to="/shop?metal=gold&karat=24"
                    onClick={resetMenu}
                    className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-[#C59B27] hover:text-[#141211] transition-colors uppercase tracking-wider"
                >
                    <span>View All Bullions</span>
                    <ArrowRight className="w-3 h-3" />
                </Link>
            </div>

            {/* ── Compact Two-Column Body with Internal Scroll if needed ── */}
            <div 
                className="flex-1 overflow-y-auto custom-scrollbar p-3.5 sm:p-4 overscroll-contain"
                data-lenis-prevent
                onWheel={(e) => e.stopPropagation()}
                style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#C59B27 transparent',
                }}
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[#E8DFD0]/60 gap-3 sm:gap-4">
                    {/* ── Column 1: Gold Bullions ── */}
                    <div className="sm:pr-2">
                        <div className="flex items-center justify-between pb-2 mb-1.5 border-b border-[#E8DFD0]/50">
                            <h4 className="text-xs font-semibold text-[#141211] font-serif tracking-wide flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-[#C59B27]" />
                                Gold Bullions
                            </h4>
                            <span className="text-[9px] font-semibold bg-[#C59B27]/10 text-[#C59B27] px-2 py-0.5 rounded-full uppercase tracking-wider border border-[#C59B27]/20">
                                24K & 22K
                            </span>
                        </div>

                        {/* Product Rows */}
                        <div className="space-y-0.5 mb-2.5">
                            {goldItems.map((item) => (
                                <Link
                                    key={item.title}
                                    to={item.path}
                                    onClick={resetMenu}
                                    className="group flex items-center justify-between p-1.5 rounded-lg hover:bg-[#FAF8F5] transition-all border border-transparent hover:border-[#E8DFD0]/60"
                                >
                                    <div className="min-w-0 pr-2">
                                        <div className="text-[11.5px] font-medium text-[#141211] group-hover:text-[#C59B27] transition-colors leading-tight">
                                            {item.title}
                                        </div>
                                        <p className="text-[10px] text-stone-400 leading-tight truncate">
                                            {item.subtitle}
                                        </p>
                                    </div>
                                    <ChevronRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-[#C59B27] group-hover:translate-x-0.5 transition-all shrink-0" />
                                </Link>
                            ))}
                        </div>

                        {/* Gold Weight Pills */}
                        <div className="pt-2 border-t border-[#E8DFD0]/40">
                            <span className="text-[9.5px] font-semibold text-stone-400 uppercase tracking-widest block mb-1.5">
                                Weights
                            </span>
                            <div className="flex flex-wrap gap-1">
                                {goldWeights.map((weight) => (
                                    <Link
                                        key={weight}
                                        to="/shop?metal=gold&karat=24"
                                        onClick={resetMenu}
                                        className="text-[10px] font-medium text-stone-600 hover:text-[#C59B27] hover:border-[#C59B27] hover:bg-white bg-[#FAF8F5] px-2 py-0.5 rounded-full border border-[#E8DFD0]/80 transition-colors shadow-2xs"
                                    >
                                        {weight}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Bottom Link */}
                        <div className="mt-2.5 pt-1.5 flex justify-end">
                            <Link
                                to="/gold-collection"
                                onClick={resetMenu}
                                className="text-[10px] font-semibold text-[#C59B27] hover:text-[#141211] transition-colors tracking-wide inline-flex items-center gap-0.5"
                            >
                                <span>Explore Gold Collection</span>
                                <ArrowRight className="w-2.5 h-2.5" />
                            </Link>
                        </div>
                    </div>

                    {/* ── Column 2: Silver Bullions ── */}
                    <div className="pt-3 sm:pt-0 sm:pl-4">
                        <div className="flex items-center justify-between pb-2 mb-1.5 border-b border-[#E8DFD0]/50">
                            <h4 className="text-xs font-semibold text-[#141211] font-serif tracking-wide flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-slate-400" />
                                Silver Bullions
                            </h4>
                            <span className="text-[9px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full uppercase tracking-wider border border-slate-200">
                                999 Fine & 925
                            </span>
                        </div>

                        {/* Product Rows */}
                        <div className="space-y-0.5 mb-2.5">
                            {silverItems.map((item) => (
                                <Link
                                    key={item.title}
                                    to={item.path}
                                    onClick={resetMenu}
                                    className="group flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50/70 transition-all border border-transparent hover:border-slate-200/80"
                                >
                                    <div className="min-w-0 pr-2">
                                        <div className="text-[11.5px] font-medium text-[#141211] group-hover:text-slate-800 transition-colors leading-tight">
                                            {item.title}
                                        </div>
                                        <p className="text-[10px] text-stone-400 leading-tight truncate">
                                            {item.subtitle}
                                        </p>
                                    </div>
                                    <ChevronRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all shrink-0" />
                                </Link>
                            ))}
                        </div>

                        {/* Silver Weight Pills */}
                        <div className="pt-2 border-t border-[#E8DFD0]/40">
                            <span className="text-[9.5px] font-semibold text-stone-400 uppercase tracking-widest block mb-1.5">
                                Weights
                            </span>
                            <div className="flex flex-wrap gap-1">
                                {silverWeights.map((weight) => (
                                    <Link
                                        key={weight}
                                        to="/shop?metal=silver&silver_type=fine"
                                        onClick={resetMenu}
                                        className="text-[10px] font-medium text-stone-600 hover:text-slate-900 hover:border-slate-400 hover:bg-white bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200 transition-colors shadow-2xs"
                                    >
                                        {weight}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Bottom Link */}
                        <div className="mt-2.5 pt-1.5 flex justify-end">
                            <Link
                                to="/shop?metal=silver"
                                onClick={resetMenu}
                                className="text-[10px] font-semibold text-slate-600 hover:text-[#141211] transition-colors tracking-wide inline-flex items-center gap-0.5"
                            >
                                <span>Explore Silver Collection</span>
                                <ArrowRight className="w-2.5 h-2.5" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Slim Trust Footer Strip ── */}
            <div className="bg-[#FAF8F5] px-4 py-2 border-t border-[#E8DFD0]/70 flex items-center justify-between text-[10px] text-stone-500 shrink-0">
                <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3 h-3 text-[#C59B27] shrink-0" />
                    <span>100% BIS Hallmarked</span>
                </div>
                <div className="hidden sm:flex items-center gap-1.5">
                    <Scale className="w-3 h-3 text-[#C59B27] shrink-0" />
                    <span>Direct Asset Pricing</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Award className="w-3 h-3 text-[#C59B27] shrink-0" />
                    <span>Certified Buyback</span>
                </div>
            </div>
        </div>
    );
};

export default BullionsMenu;
