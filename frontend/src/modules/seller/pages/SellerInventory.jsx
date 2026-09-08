import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, AlertTriangle, History, FileBarChart, RefreshCcw } from 'lucide-react';
import AdminStatsCard from '../../admin/components/AdminStatsCard';
import { sellerInventoryService } from '../services/sellerInventoryService';
import toast from 'react-hot-toast';

const SellerInventory = () => {
    const navigate = useNavigate();
    const [inventory, setInventory] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadOverview = async () => {
            setLoading(true);
            try {
                const [inventoryData, alertsData] = await Promise.all([
                    sellerInventoryService.getInventory(),
                    sellerInventoryService.getLowStockAlerts()
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

    return (
        <div className="space-y-8 font-sans animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Inventory Overview</h1>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Monitor stock health and take action fast</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => navigate('/seller/inventory/adjust')}
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
                            onClick={() => navigate('/seller/inventory/adjust')}
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
                            onClick={() => navigate('/seller/inventory/history')}
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
                            onClick={() => navigate('/seller/inventory/alerts')}
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
                            onClick={() => navigate('/seller/inventory/reports')}
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
        </div>
    );
};

export default SellerInventory;
