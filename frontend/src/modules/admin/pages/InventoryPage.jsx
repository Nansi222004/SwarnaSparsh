import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, AlertTriangle, History, FileBarChart, RefreshCcw, Store } from 'lucide-react';
import AdminStatsCard from '../components/AdminStatsCard';
import { adminService } from '../services/adminService';
import toast from 'react-hot-toast';

const InventoryPage = () => {
    const navigate = useNavigate();
    const [inventory, setInventory] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadOverview = async () => {
            setLoading(true);
            try {
                const [inventoryData, alertsData] = await Promise.all([
                    adminService.getInventory(),
                    adminService.getLowStockAlerts()
                ]);
                setInventory(inventoryData || []);
                setAlerts(alertsData || []);
            } catch (err) {
                toast.error("Failed to load inventory overview");
            } finally {
                setLoading(false);
            }
        };
        loadOverview();
    }, []);

    const totals = useMemo(() => {
        const totalProducts = inventory.length;
        const totalVariants = inventory.reduce((acc, p) => acc + (p.variants?.length || 0), 0);
        const totalStock = inventory.reduce(
            (acc, p) => acc + (p.variants || []).reduce((sum, v) => sum + (v.stock || 0), 0),
            0
        );
        return { totalProducts, totalVariants, totalStock };
    }, [inventory]);

    const outOfStockCount = useMemo(
        () => alerts.filter(a => a.currentStock === 0).length,
        [alerts]
    );

    const snapshotRows = useMemo(() => {
        return (inventory || []).flatMap((product) =>
            (product.variants || []).map((variant) => ({
                key: `${product._id || product.id}-${variant._id}`,
                name: product.name,
                image: product.images?.[0] || '',
                variantName: variant.name || 'Standard',
                categoryName: product.categories?.[0]?.name || 'Uncategorized',
                ownerName: product.sellerId?.shopName || product.sellerId?.fullName || 'Admin Inventory',
                stock: Number(variant.stock) || 0,
                sold: Number(variant.sold) || 0
            }))
        );
    }, [inventory]);

    const ownershipSummary = useMemo(() => {
        const ownerMap = new Map();
        snapshotRows.forEach((row) => {
            const current = ownerMap.get(row.ownerName) || { ownerName: row.ownerName, units: 0, variants: 0 };
            current.units += row.stock;
            current.variants += 1;
            ownerMap.set(row.ownerName, current);
        });
        return Array.from(ownerMap.values()).sort((a, b) => b.units - a.units);
    }, [snapshotRows]);

    return (
        <div className="space-y-8 font-sans animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Inventory Overview</h1>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Monitor stock health and take action fast</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => navigate('/admin/inventory/adjust')}
                        className="px-5 py-2 bg-[#0f172a] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black shadow-lg shadow-gray-200 transition-all flex items-center gap-2"
                    >
                        <RefreshCcw size={14} /> Adjust Stock
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <AdminStatsCard
                    label="Total Products"
                    value={totals.totalProducts}
                    icon={Package}
                    color="text-blue-600"
                    bgColor="bg-blue-50"
                />
                <AdminStatsCard
                    label="Total Variants"
                    value={totals.totalVariants}
                    icon={Package}
                    color="text-indigo-600"
                    bgColor="bg-indigo-50"
                />
                <AdminStatsCard
                    label="Out of Stock"
                    value={outOfStockCount}
                    icon={AlertTriangle}
                    color="text-red-600"
                    bgColor="bg-red-50"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                    <h2 className="text-xs font-black uppercase tracking-widest text-gray-500">Quick Actions</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                            onClick={() => navigate('/admin/inventory/adjust')}
                            className="p-4 rounded-xl border border-gray-200 hover:border-gray-300 bg-gray-50 text-left transition-all"
                        >
                            <div className="flex items-center gap-3">
                                <RefreshCcw size={16} className="text-gray-500" />
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-gray-700">Stock Adjustment</p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Update inventory levels</p>
                                </div>
                            </div>
                        </button>
                        <button
                            onClick={() => navigate('/admin/inventory/history')}
                            className="p-4 rounded-xl border border-gray-200 hover:border-gray-300 bg-gray-50 text-left transition-all"
                        >
                            <div className="flex items-center gap-3">
                                <History size={16} className="text-gray-500" />
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-gray-700">Stock History</p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">View audit trail</p>
                                </div>
                            </div>
                        </button>
                        <button
                            onClick={() => navigate('/admin/inventory/alerts')}
                            className="p-4 rounded-xl border border-gray-200 hover:border-gray-300 bg-gray-50 text-left transition-all"
                        >
                            <div className="flex items-center gap-3">
                                <AlertTriangle size={16} className="text-gray-500" />
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-gray-700">Low Stock Alerts</p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Prioritize restocks</p>
                                </div>
                            </div>
                        </button>
                        <button
                            onClick={() => navigate('/admin/inventory/reports')}
                            className="p-4 rounded-xl border border-gray-200 hover:border-gray-300 bg-gray-50 text-left transition-all"
                        >
                            <div className="flex items-center gap-3">
                                <FileBarChart size={16} className="text-gray-500" />
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-gray-700">Reports</p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Inventory insights</p>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xs font-black uppercase tracking-widest text-gray-500">Stock Snapshot</h2>
                        {loading && (
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Loading...</span>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Stock Units</p>
                            <p className="text-2xl font-black text-gray-900 mt-1">{totals.totalStock.toLocaleString()}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Low Stock Alerts</p>
                            <p className="text-2xl font-black text-gray-900 mt-1">{alerts.length.toLocaleString()}</p>
                        </div>
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        {alerts.length > 0 ? 'Review alerts to avoid stockouts.' : 'All good. No low stock alerts.'}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-6">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <div>
                            <h2 className="text-xs font-black uppercase tracking-widest text-gray-500">Live Inventory Snapshot</h2>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Admin and seller stock in one view</p>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                            {snapshotRows.length} Variants
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-[#F8FAFC] border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Product</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Owner</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">In Stock</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Sold</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-12 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">
                                            Loading snapshot...
                                        </td>
                                    </tr>
                                ) : snapshotRows.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-12 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">
                                            No inventory found
                                        </td>
                                    </tr>
                                ) : (
                                    snapshotRows.slice(0, 10).map((row) => (
                                        <tr key={row.key} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gray-50 rounded-lg border border-gray-100 p-1 flex-shrink-0">
                                                        {row.image ? (
                                                            <img src={row.image} alt="" className="w-full h-full object-contain mix-blend-multiply" />
                                                        ) : (
                                                            <Package size={18} className="text-gray-300 m-auto" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-gray-900 line-clamp-1">{row.name}</p>
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                                                            {row.categoryName} • {row.variantName}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-50 border border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-600">
                                                    <Store size={12} />
                                                    {row.ownerName}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center text-sm font-black text-gray-900">{row.stock}</td>
                                            <td className="px-6 py-4 text-center text-sm font-black text-gray-500">{row.sold}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {snapshotRows.length > 10 && (
                        <div className="px-6 py-3 border-t border-gray-100">
                            <button
                                onClick={() => navigate('/admin/inventory/adjust')}
                                className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-gray-900 transition-colors"
                            >
                                Review full stock via adjustment screen
                            </button>
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                    <div>
                        <h2 className="text-xs font-black uppercase tracking-widest text-gray-500">Ownership Split</h2>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Who currently owns the units in stock</p>
                    </div>
                    <div className="space-y-3">
                        {ownershipSummary.length === 0 ? (
                            <div className="px-4 py-8 rounded-xl bg-gray-50 border border-gray-100 text-center text-xs font-bold uppercase tracking-widest text-gray-400">
                                No ownership data available
                            </div>
                        ) : (
                            ownershipSummary.map((item) => (
                                <div key={item.ownerName} className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-xs font-black text-gray-900 uppercase tracking-widest">{item.ownerName}</p>
                                        <p className="text-xs font-black text-gray-600">{item.units} Units</p>
                                    </div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">
                                        {item.variants} Variants tracked
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InventoryPage;
