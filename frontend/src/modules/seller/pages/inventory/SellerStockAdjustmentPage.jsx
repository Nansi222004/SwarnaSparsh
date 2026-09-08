import React, { useState, useEffect, useMemo } from 'react';
import { Search, Save, RotateCcw, Plus, Minus, CheckCircle2, Package } from 'lucide-react';
import { sellerInventoryService } from '../../services/sellerInventoryService';
import toast from 'react-hot-toast';


const SellerStockAdjustmentPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [products, setProducts] = useState([]);
    const [adjustments, setAdjustments] = useState({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const loadInventory = async () => {
        setLoading(true);
        try {
            const inventory = await sellerInventoryService.getInventory();
            const flattened = (inventory || []).flatMap(p => (p.variants || []).map(v => ({
                productId: p._id || p.id,
                variantId: v._id,
                name: p.name,
                category: p.categories?.[0]?.name || 'Uncategorized',
                stock: v.stock,
                variantName: v.name,
                image: v.variantImages?.[0] || p.images?.[0] || ''
            })));
            setProducts(flattened);
        } catch (err) {
            toast.error("Failed to load inventory");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadInventory();
    }, []);

    const handleAdjustmentChange = (id, value) => {
        const val = parseInt(value) || 0;
        if (val === 0) {
            const newAdjustments = { ...adjustments };
            delete newAdjustments[id];
            setAdjustments(newAdjustments);
        } else {
            setAdjustments({ ...adjustments, [id]: val });
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const entries = Object.entries(adjustments);
            const payload = [];
            for (const [variantId, delta] of entries) {
                const item = products.find(p => p.variantId === variantId);
                if (!item) continue;
                const newStock = (Number(item.stock) || 0) + (Number(delta) || 0);
                if (newStock < 0) {
                    throw new Error(`Stock cannot go below zero for ${item.name}`);
                }
                payload.push({
                    productId: item.productId,
                    variantId,
                    newStock,
                    reason: "Manual adjustment by Seller"
                });
            }

            if (payload.length === 0) {
                toast.error("No valid changes to save");
                return;
            }

            const response = await sellerInventoryService.adjustStock({ adjustments: payload });
            if (!response?.success) {
                throw new Error(response?.message || "Failed to update inventory");
            }

            const failures = response?.data?.failures || [];
            if (failures.length > 0) {
                toast.error(`Saved with ${failures.length} issue(s). Some variants were not updated.`);
            }
            toast.success("Inventory updated");
            setAdjustments({});
            await loadInventory();
        } catch (err) {
            toast.error(err?.message || "Failed to update inventory");
        } finally {
            setSaving(false);
        }
    };

    const resetAdjustments = () => {
        setAdjustments({});
    };

    const filteredProducts = useMemo(() => products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
    ), [products, searchTerm]);

    const pendingCount = Object.keys(adjustments).length;

    return (
        <div className="space-y-8 font-sans pb-24 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Stock Adjustment</h1>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Manually update product inventory</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={resetAdjustments}
                        disabled={pendingCount === 0 || saving}
                        className="px-4 py-2 border border-gray-200 bg-white text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                    >
                        <RotateCcw size={14} /> Reset
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={pendingCount === 0 || saving}
                        className="px-6 py-2 bg-[#0f172a] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black shadow-lg shadow-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                    >
                        {saving ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Save size={14} />
                        )}
                        Sync Changes
                    </button>
                </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-6 flex items-center gap-4 sticky top-4 z-20">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                    <input
                        type="text"
                        placeholder="Search product by Name or Category..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-xl border-none text-xs font-bold text-gray-900 focus:ring-0 placeholder:text-gray-400"
                    />
                </div>
                {pendingCount > 0 && (
                    <div className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg border border-blue-100 flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                        <span className="text-[10px] font-black uppercase tracking-widest">{pendingCount} Pending Modifications</span>
                    </div>
                )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#F8FAFC] border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest w-[50%]">Product Details</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Current Stock</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Add / Remove</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Final Stock</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">Loading Inventory...</td>
                                </tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">No products found</td>
                                </tr>
                            ) : (
                                filteredProducts.map((product) => {
                                    const adjustment = adjustments[product.variantId] || 0;
                                    const finalStock = product.stock + adjustment;
                                    const isModified = adjustment !== 0;

                                    return (
                                        <tr key={product.variantId} className={`hover:bg-gray-50/50 transition-colors group ${isModified ? 'bg-blue-50/30' : ''}`}>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-gray-50 rounded-lg border border-gray-100 p-1 flex-shrink-0">
                                                        {product.image ? (
                                                            <img src={product.image} alt="" className="w-full h-full object-contain mix-blend-multiply" />
                                                        ) : (
                                                            <Package size={20} className="text-gray-300 m-auto" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900 line-clamp-1">{product.name}</p>
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{product.category} - {product.variantName || 'Standard'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`text-sm font-black ${product.stock === 0 ? 'text-red-500' : 'text-gray-900'}`}>
                                                    {product.stock}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="inline-flex items-center justify-center relative">
                                                    <input
                                                        type="number"
                                                        value={adjustment === 0 ? '' : adjustment}
                                                        onChange={(e) => handleAdjustmentChange(product.variantId, e.target.value)}
                                                        placeholder="0"
                                                        className={`w-24 px-3 py-2 text-center rounded-xl border-2 text-sm font-black focus:outline-none focus:ring-0 transition-all
                                                            ${adjustment > 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-600 placeholder:text-emerald-300' : ''}
                                                            ${adjustment < 0 ? 'bg-red-50 border-red-200 text-red-600 placeholder:text-red-300' : ''}
                                                            ${adjustment === 0 ? 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-300 focus:border-gray-400' : ''}
                                                        `}
                                                    />
                                                    {adjustment > 0 && <Plus size={12} className="absolute left-3 text-emerald-500 pointer-events-none" />}
                                                    {adjustment < 0 && <Minus size={12} className="absolute left-3 text-red-500 pointer-events-none" />}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <span className={`text-sm font-black transition-all ${finalStock < 0 ? 'text-red-600' :
                                                        finalStock !== product.stock ? 'text-blue-600' : 'text-gray-900'
                                                        }`}>
                                                        {finalStock}
                                                    </span>
                                                    {isModified && (
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">(New)</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {pendingCount > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white p-4 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-6 z-50 animate-in slide-in-from-bottom-6 border border-gray-800 w-[90%] md:w-auto max-w-2xl">
                    <div className="flex items-center gap-3 border-b sm:border-b-0 sm:border-r border-gray-700 pb-3 sm:pb-0 pr-0 sm:pr-6 justify-center sm:justify-start">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-black text-xs shrink-0">
                            {pendingCount}
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest">Pending Changes</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Review before syncing</p>
                        </div>
                    </div>
                    <div className="flex gap-3 justify-between sm:justify-start">
                        <button
                            onClick={resetAdjustments}
                            className="flex-1 sm:flex-none px-4 py-2 hover:bg-gray-800 rounded-lg text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-colors text-center"
                        >
                            Reset All
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-1 sm:flex-none px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2"
                        >
                            {saving ? 'Syncing...' : 'Confirm Updates'} <CheckCircle2 size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SellerStockAdjustmentPage;
