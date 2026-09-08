import React from 'react';
import { ShoppingBag, Plus } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { formatCurrency } from '../../../utils/price';

const RelatedProducts = ({ 
    activeTab, 
    setActiveTab, 
    products, 
    product, 
    relatedProducts, 
    navigate 
}) => {
    return (
        <>
            {/* TABBED EXPLORE SECTION (Related & Recent) */}
            <div className="flex gap-4 md:gap-10 border-b border-stone-200 mb-8 overflow-x-auto no-scrollbar">
                <button
                    className={`pb-4 text-xs md:text-base font-bold uppercase tracking-[0.2em] transition-all relative whitespace-nowrap px-1 ${activeTab === 'related' ? 'text-[#141211]' : 'text-stone-400 hover:text-stone-600'}`}
                    onClick={() => setActiveTab('related')}
                >
                    Related pieces
                    {activeTab === 'related' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#C59B27] animate-in fade-in slide-in-from-left-2 duration-300"></span>}
                </button>
                <button
                    className={`pb-4 text-xs md:text-base font-bold uppercase tracking-[0.2em] transition-all relative whitespace-nowrap px-1 ${activeTab === 'recent' ? 'text-[#141211]' : 'text-stone-400 hover:text-stone-600'}`}
                    onClick={() => setActiveTab('recent')}
                >
                    More to explore
                    {activeTab === 'recent' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#C59B27] animate-in fade-in slide-in-from-left-2 duration-300"></span>}
                </button>
            </div>

            {(() => {
                const relatedList = products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 8);
                const recentList = products.filter(p => p.id !== product.id).reverse().slice(0, 8);
                const displayList = activeTab === 'related' ? relatedList : recentList;

                if (displayList.length === 0) {
                    return (
                        <div className="flex flex-col items-center justify-center py-16 px-6 text-stone-400 bg-stone-50/50 rounded-2xl border-2 border-dashed border-stone-200">
                            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm">
                                <ShoppingBag className="w-8 h-8 opacity-30 text-[#C59B27]" />
                            </div>
                            <p className="text-sm font-bold text-stone-600 uppercase tracking-widest">No {activeTab} pieces found</p>
                            <p className="text-[11px] text-stone-400 mt-1 max-w-xs text-center">We're updating our collection daily. Check back soon for more exquisite designs.</p>
                        </div>
                    );
                }

                return (
                    <div className="flex overflow-x-auto gap-3 md:gap-6 pb-6 snap-x no-scrollbar">
                        {displayList.map((item) => (
                            <div key={item.id} className="min-w-[160px] w-[160px] md:min-w-[280px] md:w-[280px] snap-center">
                                <ProductCard product={item} />
                            </div>
                        ))}
                    </div>
                );
            })()}

            {/* Complete the Look / Pairs Well With (Cross-selling) */}
            {relatedProducts && relatedProducts.length > 0 && (
                <div className="bg-[#141211] py-20 mt-10 relative overflow-hidden border-t border-[#C59B27]/20">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-[#C59B27]/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#C59B27]/5 rounded-full blur-3xl" />
                    
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-[#E8D198] uppercase tracking-[0.4em] mb-3">Elevate Your Set</span>
                                <h2 className="text-3xl font-serif text-[#FAF8F5] uppercase tracking-tight">Pairs Well With</h2>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="h-[1px] w-12 md:w-24 bg-[#C59B27]/30" />
                                <span className="text-[10px] font-bold text-[#FAF8F5]/60 uppercase tracking-widest whitespace-nowrap">Handpicked for you</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                            {relatedProducts.slice(0, 4).map((relProduct) => (
                                <div key={relProduct._id || relProduct.id} className="group">
                                    <div 
                                        onClick={() => {
                                            navigate(`/product/${relProduct._id || relProduct.id}`);
                                            window.scrollTo(0, 0);
                                        }}
                                        className="aspect-[4/5] rounded-[2rem] overflow-hidden bg-white/5 border border-white/10 relative group-hover:border-[#C59B27]/40 transition-all cursor-pointer"
                                    >
                                        <img 
                                            src={relProduct.images?.[0] || relProduct.primaryImage} 
                                            alt={relProduct.name}
                                            className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                                        
                                        {/* Quick Tag */}
                                        <div className="absolute top-4 left-4 bg-[#141211]/90 backdrop-blur-md px-3 py-1 rounded-full border border-[#C59B27]/30">
                                            <span className="text-[8px] font-bold text-[#E8D198] uppercase tracking-widest">Matching Set</span>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex justify-between items-start">
                                        <div>
                                            <h3 className="text-[10px] font-bold text-white uppercase tracking-widest line-clamp-1">{relProduct.name}</h3>
                                            <p className="text-[10px] font-bold text-[#E8D198] mt-1">{formatCurrency(relProduct.price)}</p>
                                        </div>
                                        <button className="w-8 h-8 rounded-full border border-[#C59B27]/30 flex items-center justify-center text-[#E8D198] hover:bg-[#C59B27] hover:text-[#141211] transition-all">
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default RelatedProducts;
