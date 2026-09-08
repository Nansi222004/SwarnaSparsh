import React, { useState, useMemo } from 'react';
import { X, TrendingUp, TrendingDown, DollarSign, Percent, AlertCircle, Search, ChevronDown, ChevronUp, User, Store } from 'lucide-react';

const BULK_ACTIONS = [
    { id: 'increase_making_amount', label: 'Increase Making (+Rs)', icon: <TrendingUp size={14} />, requiresValue: true, valueLabel: 'Amount' },
    { id: 'decrease_making_amount', label: 'Decrease Making (-Rs)', icon: <TrendingDown size={14} />, requiresValue: true, valueLabel: 'Amount' },
    { id: 'increase_making_percent', label: 'Increase Making (+%)', icon: <Percent size={14} />, requiresValue: true, valueLabel: 'Percent' },
    { id: 'decrease_making_percent', label: 'Decrease Making (-%)', icon: <DollarSign size={14} className="rotate-180" />, requiresValue: true, valueLabel: 'Percent' },
    { id: 'set_hallmarking_charge', label: 'Set Hallmarking', icon: <DollarSign size={14} />, requiresValue: true, valueLabel: 'Amount' },
    { id: 'set_diamond_certificate_charge', label: 'Set Diamond Certificate', icon: <DollarSign size={14} />, requiresValue: true, valueLabel: 'Amount' },
    { id: 'set_pg_charge_to_user', label: 'PG Charge to User', icon: <User size={14} />, requiresValue: false, valueLabel: '' },
    { id: 'set_pg_charge_to_seller', label: 'PG Charge to Seller/Admin', icon: <Store size={14} />, requiresValue: false, valueLabel: '' },
];

const BulkUpdateModal = ({ isOpen, onClose, onApply, products = [] }) => {
    const [config, setConfig] = useState({
        type: 'increase_making_amount',
        value: '',
    });
    const [selectedIds, setSelectedIds] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [collapsedCategories, setCollapsedCategories] = useState({});

    const getProductId = (product) => product.id || product._id;

    React.useEffect(() => {
        if (isOpen && products.length > 0) {
            setSelectedIds(products.map((p) => getProductId(p)).filter(Boolean));
        }
        setSearchQuery('');
        setCollapsedCategories({});
        setConfig({ type: 'increase_making_amount', value: '' });
    }, [isOpen, products]);

    const groupedProducts = useMemo(() => {
        const getCategoryName = (product) => {
            const categories = product.categories || [];
            const primary = categories[0];
            if (typeof primary === 'string') return primary;
            return primary?.name || product.category || 'Uncategorized';
        };

        const filtered = products.filter((p) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            getCategoryName(p).toLowerCase().includes(searchQuery.toLowerCase())
        );

        return filtered.reduce((acc, product) => {
            const category = getCategoryName(product);
            if (!acc[category]) acc[category] = [];
            acc[category].push(product);
            return acc;
        }, {});
    }, [products, searchQuery]);

    if (!isOpen) return null;

    const selectedType = BULK_ACTIONS.find((item) => item.id === config.type) || BULK_ACTIONS[0];

    const handleSubmit = (e) => {
        e.preventDefault();
        if (selectedType.requiresValue && (!config.value || isNaN(config.value))) return;
        if (selectedIds.length === 0) return;

        onApply({
            ...config,
            value: selectedType.requiresValue ? config.value : undefined,
            productIds: selectedIds,
        });
        onClose();
    };

    const toggleProduct = (id) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
        );
    };

    const toggleCategory = (category, items) => {
        const itemIds = items.map((i) => getProductId(i)).filter(Boolean);
        const allSelected = itemIds.every((id) => selectedIds.includes(id));

        if (allSelected) {
            setSelectedIds((prev) => prev.filter((id) => !itemIds.includes(id)));
        } else {
            setSelectedIds((prev) => [...new Set([...prev, ...itemIds])]);
        }
    };

    const toggleCollapse = (category) => {
        setCollapsedCategories((prev) => ({
            ...prev,
            [category]: !prev[category],
        }));
    };

    const toggleAll = () => {
        const allVisibleIds = Object.values(groupedProducts).flat().map((p) => getProductId(p)).filter(Boolean);
        const allSelected = allVisibleIds.every((id) => selectedIds.includes(id));

        if (allSelected) {
            setSelectedIds((prev) => prev.filter((id) => !allVisibleIds.includes(id)));
        } else {
            setSelectedIds((prev) => [...new Set([...prev, ...allVisibleIds])]);
        }
    };

    const totalVisible = Object.values(groupedProducts).flat().length;
    const selectedVisible = Object.values(groupedProducts).flat().filter((p) => selectedIds.includes(getProductId(p))).length;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-2xl rounded-[1.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-gray-100 flex flex-col max-h-[85vh]">
                <div className="bg-[#3E2723] p-5 text-white flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="text-lg font-black uppercase tracking-tight">Bulk Price Management</h2>
                        <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mt-0.5">
                            {selectedIds.length} Total Selected
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                    <div className="flex-1 border-b lg:border-b-0 lg:border-r border-gray-100 flex flex-col min-h-0 bg-gray-50/30">
                        <div className="p-4 border-b border-gray-100 bg-white sticky top-0 z-20">
                            <div className="relative mb-3">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#3E2723] transition-all"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    {totalVisible} Products
                                </span>
                                <button
                                    type="button"
                                    onClick={toggleAll}
                                    className="text-[10px] font-bold text-[#3E2723] hover:underline uppercase tracking-tight"
                                >
                                    {selectedVisible === totalVisible && totalVisible > 0 ? 'Deselect Visible' : 'Select Visible'}
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                            {Object.keys(groupedProducts).length > 0 ? (
                                Object.entries(groupedProducts).map(([category, items]) => {
                                    const categoryItemIds = items.map((i) => getProductId(i)).filter(Boolean);
                                    const isCategoryFullSelected = categoryItemIds.every((id) => selectedIds.includes(id));
                                    const isCategoryPartialSelected = !isCategoryFullSelected && categoryItemIds.some((id) => selectedIds.includes(id));
                                    const isCollapsed = collapsedCategories[category];

                                    return (
                                        <div key={category} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                            <div className="bg-gray-50 px-3 py-2.5 flex items-center justify-between border-b border-gray-100 cursor-pointer select-none" onClick={() => toggleCollapse(category)}>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); toggleCollapse(category); }}
                                                        className="text-gray-400 hover:text-gray-600 transition-colors"
                                                    >
                                                        {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                                                    </button>
                                                    <input
                                                        type="checkbox"
                                                        checked={isCategoryFullSelected}
                                                        ref={(el) => el && (el.indeterminate = isCategoryPartialSelected)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        onChange={() => toggleCategory(category, items)}
                                                        className="w-3.5 h-3.5 rounded text-[#3E2723] focus:ring-[#3E2723] border-gray-300"
                                                    />
                                                    <span className="text-[11px] font-black text-gray-700 uppercase tracking-wide">{category}</span>
                                                </div>
                                                <span className="text-[10px] font-bold text-gray-400 bg-white px-2 py-0.5 rounded-full border border-gray-100 shadow-sm">{items.length}</span>
                                            </div>

                                            {!isCollapsed && (
                                                <div className="divide-y divide-gray-50">
                                                    {items.map((product) => {
                                                        const productId = getProductId(product);
                                                        return (
                                                            <label key={productId} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer transition-colors group">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedIds.includes(productId)}
                                                                    onChange={() => toggleProduct(productId)}
                                                                    className="w-3.5 h-3.5 rounded border-gray-300 text-[#3E2723] focus:ring-[#3E2723]"
                                                                />
                                                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                                                    <img src={product.image || product.images?.[0] || ''} alt="" className="w-8 h-8 rounded-lg object-cover bg-gray-100 shrink-0 border border-gray-100" />
                                                                    <div className="min-w-0 flex-1">
                                                                        <div className="flex items-center justify-between gap-2">
                                                                            <p className="text-[11px] font-bold text-gray-700 truncate">{product.name}</p>
                                                                            {product.variants && product.variants[0] && (
                                                                                <span className="text-[10px] font-bold text-gray-400 tabular-nums">Rs {product.variants[0].price}</span>
                                                                            )}
                                                                        </div>
                                                                        <p className="text-[9px] text-gray-400 font-medium truncate uppercase tracking-tighter">ID: {productId}</p>
                                                                    </div>
                                                                </div>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                    <Search size={24} className="mb-2 opacity-20" />
                                    <p className="text-xs font-medium">No products match your search</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="w-full lg:w-[320px] p-5 bg-white flex flex-col gap-6 shrink-0 h-full overflow-y-auto custom-scrollbar">
                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3.5 flex gap-3 items-start shrink-0">
                            <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={16} />
                            <p className="text-[10px] font-bold text-amber-800 leading-relaxed">
                                Updating <span className="underline">{selectedIds.length} items</span> by changing pricing inputs only. Final prices will be recalculated automatically.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Method</label>
                                <div className="grid grid-cols-1 gap-2">
                                    {BULK_ACTIONS.map((action) => (
                                        <button
                                            key={action.id}
                                            type="button"
                                            onClick={() => setConfig({ type: action.id, value: '' })}
                                            className={`flex items-center gap-3 p-3 rounded-xl text-[10px] font-bold transition-all border text-left ${config.type === action.id
                                                ? 'bg-[#3E2723] text-white border-[#3E2723] shadow-md shadow-[#3E2723]/20'
                                                : 'bg-white text-gray-600 border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                        >
                                            <div className={`${config.type === action.id ? 'bg-white/20' : 'bg-gray-100'} p-1.5 rounded-lg shrink-0`}>
                                                {React.cloneElement(action.icon, { size: 14 })}
                                            </div>
                                            <span className="leading-tight">{action.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {selectedType.requiresValue ? (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{selectedType.valueLabel}</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            required
                                            value={config.value}
                                            onChange={(e) => setConfig({ ...config, value: e.target.value })}
                                            placeholder="0"
                                            className="w-full bg-gray-50 border border-transparent rounded-xl p-3 pr-10 text-sm font-bold outline-none focus:bg-white focus:border-[#3E2723] transition-all placeholder:text-gray-300 shadow-inner"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-[10px] font-bold text-emerald-800">
                                    This action does not require a numeric value. It will switch who bears the payment gateway charge for all selected products.
                                </div>
                            )}
                        </div>

                        <div className="mt-auto pt-4 border-t border-gray-100">
                            <button
                                type="submit"
                                disabled={selectedIds.length === 0}
                                className="w-full px-6 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-[#3E2723] text-white hover:bg-black transition-all shadow-xl shadow-[#3E2723]/20 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98]"
                            >
                                Apply Update
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="w-full mt-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-all hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BulkUpdateModal;
