import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Download, PieChart, TrendingUp, DollarSign, Package } from 'lucide-react';
import { adminService } from '../../services/adminService';
import toast from 'react-hot-toast';

const InventoryReportsPage = () => {
    const activeTabState = useState('category'); // 'category' or 'sales'
    const activeTab = activeTabState[0];
    const setActiveTab = activeTabState[1];
    const [period, setPeriod] = useState('month');
    const [loading, setLoading] = useState(false);
    const [categoryData, setCategoryData] = useState([]);
    const [salesData, setSalesData] = useState([]);
    const [ownerData, setOwnerData] = useState([]);

    useEffect(() => {
        const loadInventory = async () => {
            setLoading(true);
            try {
                const now = new Date();
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
                const historyParams = period === 'month'
                    ? { startDate: monthStart, endDate: now.toISOString(), limit: 500 }
                    : { limit: 500 };
                const [inventory, logs] = await Promise.all([
                    adminService.getInventory({ limit: 500 }),
                    adminService.getStockHistory(historyParams)
                ]);
                const categoryMap = new Map();
                const productPriceMap = new Map();
                const productCategoryMap = new Map();
                const ownerMap = new Map();

                (inventory || []).forEach(p => {
                    const categoryName = p.categories?.[0]?.name || 'Uncategorized';
                    const ownerName = p.sellerId?.shopName || p.sellerId?.fullName || 'Admin Inventory';
                    const variants = p.variants || [];
                    const totalQty = variants.reduce((acc, v) => acc + (v.stock || 0), 0);
                    const avgPrice = variants.length > 0
                        ? variants.reduce((acc, v) => acc + (v.price || 0), 0) / variants.length
                        : 0;
                    const value = Math.round(totalQty * avgPrice);

                    if (!categoryMap.has(categoryName)) {
                        categoryMap.set(categoryName, { category: categoryName, uniqueProducts: 0, totalQty: 0, value: 0 });
                    }
                    const current = categoryMap.get(categoryName);
                    current.uniqueProducts += 1;
                    current.totalQty += totalQty;
                    current.value += value;

                    const avgUnitPrice = variants.length > 0
                        ? variants.reduce((acc, v) => acc + (v.price || 0), 0) / variants.length
                        : 0;
                    const productKey = (p._id || p.id)?.toString();
                    if (productKey) {
                        productPriceMap.set(productKey, avgUnitPrice);
                        productCategoryMap.set(productKey, categoryName);
                    }

                    if (!ownerMap.has(ownerName)) {
                        ownerMap.set(ownerName, { owner: ownerName, units: 0, productCount: 0, estimatedValue: 0 });
                    }
                    const currentOwner = ownerMap.get(ownerName);
                    currentOwner.units += totalQty;
                    currentOwner.productCount += 1;
                    currentOwner.estimatedValue += value;
                });

                setCategoryData(Array.from(categoryMap.values()));
                setOwnerData(Array.from(ownerMap.values()).sort((a, b) => b.units - a.units));

                const salesMap = new Map();
                (logs || []).forEach(log => {
                    if (log.changeType !== 'sale') return;
                    const productKey = (log.productId?._id || log.productId)?.toString();
                    if (!productKey) return;
                    const current = salesMap.get(productKey) || {
                        id: productKey,
                        name: log.productId?.name || 'Unknown',
                        category: productCategoryMap.get(productKey) || 'Uncategorized',
                        owner: log.productId?.sellerId?.shopName || log.productId?.sellerId?.fullName || 'Admin Inventory',
                        sold: 0,
                        avgPrice: Math.round(productPriceMap.get(productKey) || 0),
                        revenue: 0
                    };
                    const soldQty = Math.abs(log.change || 0);
                    current.sold += soldQty;
                    current.revenue = current.sold * current.avgPrice;
                    salesMap.set(productKey, current);
                });

                setSalesData(Array.from(salesMap.values()));
            } catch (err) {
                toast.error("Failed to load inventory reports");
            } finally {
                setLoading(false);
            }
        };
        loadInventory();
    }, [period]);

    const totalInventoryValue = useMemo(
        () => categoryData.reduce((acc, item) => acc + (item.value || 0), 0),
        [categoryData]
    );

    const totalItemsInStock = useMemo(
        () => categoryData.reduce((acc, item) => acc + (item.totalQty || 0), 0),
        [categoryData]
    );

    const topCategory = useMemo(() => {
        if (categoryData.length === 0) return null;
        return categoryData.reduce((top, current) => (current.value > (top?.value || 0) ? current : top), null);
    }, [categoryData]);

    const exportActiveReport = () => {
        const rows = activeTab === 'category'
            ? [
                ['Category', 'Unique Products', 'Total Quantity', 'Estimated Value'],
                ...categoryData.map((item) => [item.category, item.uniqueProducts, item.totalQty, item.value])
            ]
            : [
                ['Product Name', 'Category', 'Units Sold', 'Average Price', 'Total Revenue'],
                ...salesData.map((item) => [item.name, item.category, item.sold, item.avgPrice, item.revenue])
            ];

        if (rows.length <= 1) {
            toast.error(`No ${activeTab === 'category' ? 'category' : 'sales'} data available to export`);
            return;
        }

        const csv = rows
            .map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','))
            .join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${activeTab}-inventory-report-${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 1000);
        toast.success(`${activeTab === 'category' ? 'Category' : 'Sales'} report exported`);
    };

    return (
        <div className="space-y-8 font-sans animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-tight">Inventory Reports</h1>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mt-1">Valuation and sales analytics</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setPeriod(prev => (prev === 'month' ? 'all' : 'month'))}
                        className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2"
                    >
                        <Calendar size={14} /> {period === 'month' ? 'This Month' : 'All Time'}
                    </button>
                    <button
                        onClick={exportActiveReport}
                        className="px-4 py-2 bg-[#1a1a1a] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95 flex items-center gap-2"
                    >
                        <Download size={14} /> Export CSV
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-8">
                <button
                    onClick={() => setActiveTab('category')}
                    className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'category' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                        }`}
                >
                    <PieChart size={14} /> Category Report
                </button>
                <button
                    onClick={() => setActiveTab('sales')}
                    className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'sales' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                        }`}
                >
                    <TrendingUp size={14} /> Product Sales
                </button>
            </div>

            {/* Category View */}
            {activeTab === 'category' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Inventory Value</p>
                            <p className="text-3xl font-black text-gray-900">INR {totalInventoryValue.toLocaleString()}</p>
                            <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
                                <div className="bg-emerald-500 h-full rounded-full w-[75%]"></div>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Items in Stock</p>
                            <p className="text-3xl font-black text-gray-900">{totalItemsInStock.toLocaleString()}</p>
                            <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
                                <div className="bg-blue-500 h-full rounded-full w-[60%]"></div>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Top Category</p>
                            <div className="flex items-center gap-3 mt-1">
                                <div className="px-3 py-1 bg-purple-50 text-purple-600 rounded-lg text-xs font-black uppercase tracking-widest">
                                    {topCategory?.category || 'N/A'}
                                </div>
                                <span className="text-xs font-bold text-gray-400">
                                    {topCategory ? `${Math.round((topCategory.value / Math.max(totalInventoryValue, 1)) * 100)}% of Value` : ''}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Inventory Ownership</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left min-w-[800px]">
                            <thead className="bg-[#F8FAFC] border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Owner</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Products</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Units</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Estimated Value</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr><td colSpan="4" className="px-6 py-12 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">Loading ownership...</td></tr>
                                ) : ownerData.length === 0 ? (
                                    <tr><td colSpan="4" className="px-6 py-12 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">No ownership data available</td></tr>
                                ) : ownerData.map((item) => (
                                    <tr key={item.owner} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 text-xs font-black text-gray-900">{item.owner}</td>
                                        <td className="px-6 py-4 text-center text-xs font-bold text-gray-600">{item.productCount}</td>
                                        <td className="px-6 py-4 text-center text-xs font-bold text-gray-600">{item.units}</td>
                                        <td className="px-6 py-4 text-right text-sm font-black text-gray-900">INR {item.estimatedValue.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Category Table */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left min-w-[800px]">
                            <thead className="bg-[#F8FAFC] border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Unique Products</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Total Quantity</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Estimated Value</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr><td colSpan="4" className="px-6 py-12 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">Loading report...</td></tr>
                                ) : categoryData.length === 0 ? (
                                    <tr><td colSpan="4" className="px-6 py-12 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">No data available</td></tr>
                                ) : categoryData.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 text-xs font-black text-gray-900">{item.category}</td>
                                        <td className="px-6 py-4 text-center text-xs font-bold text-gray-600">{item.uniqueProducts}</td>
                                        <td className="px-6 py-4 text-center text-xs font-bold text-gray-600">{item.totalQty.toLocaleString()} units</td>
                                        <td className="px-6 py-4 text-right text-sm font-black text-gray-900">INR {item.value.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Sales View */}
            {activeTab === 'sales' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-6 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Total Revenue</p>
                                <p className="text-4xl font-black text-emerald-900">INR {salesData.reduce((acc, item) => acc + (item.revenue || 0), 0).toLocaleString()}</p>
                            </div>
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-emerald-500 shadow-sm">
                                <DollarSign size={24} />
                            </div>
                        </div>
                        <div className="bg-blue-50 rounded-2xl border border-blue-100 p-6 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Total Units Sold</p>
                                <p className="text-4xl font-black text-blue-900">{salesData.reduce((acc, item) => acc + (item.sold || 0), 0).toLocaleString()}</p>
                            </div>
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-blue-500 shadow-sm">
                                <Package size={24} />
                            </div>
                        </div>
                    </div>

                    {/* Sales Table */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left min-w-[800px]">
                            <thead className="bg-[#F8FAFC] border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest w-[40%]">Product Name</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Owner</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Units Sold</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Avg Price</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Total Revenue</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr><td colSpan="6" className="px-6 py-12 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">Loading sales...</td></tr>
                                ) : salesData.length === 0 ? (
                                    <tr><td colSpan="6" className="px-6 py-12 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">No sales data yet</td></tr>
                                ) : salesData.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 text-xs font-black text-gray-900">{item.name}</td>
                                        <td className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">{item.owner}</td>
                                        <td className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">{item.category}</td>
                                        <td className="px-6 py-4 text-center text-xs font-black text-blue-600">{item.sold}</td>
                                        <td className="px-6 py-4 text-right text-xs font-bold text-gray-500">INR {item.avgPrice}</td>
                                        <td className="px-6 py-4 text-right text-sm font-black text-emerald-600">INR {item.revenue.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryReportsPage;
