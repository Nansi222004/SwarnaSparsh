import React, { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, Zap, Ban, ArrowRight, Clock, Package, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdminStatsCard from '../../../admin/components/AdminStatsCard';
import { sellerInventoryService } from '../../services/sellerInventoryService';
import toast from 'react-hot-toast';

const SellerLowStockAlertsPage = () => {
    const navigate = useNavigate();
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [threshold, setThreshold] = useState(5);
    const [page, setPage] = useState(1);
    const [limit] = useState(25);
    const [pagination, setPagination] = useState(null);

    useEffect(() => {
        const loadAlerts = async () => {
            setLoading(true);
            try {
                const result = await sellerInventoryService.getLowStockAlertsPaged({
                    page,
                    limit,
                    threshold,
                    ...(searchTerm ? { search: searchTerm } : {})
                });
                setAlerts(result?.alerts || []);
                setPagination(result?.pagination || null);
            } catch (err) {
                toast.error("Failed to load low stock alerts");
            } finally {
                setLoading(false);
            }
        };
        const t = setTimeout(loadAlerts, 250);
        return () => clearTimeout(t);
    }, [page, limit, threshold, searchTerm]);

    useEffect(() => {
        setPage(1);
    }, [threshold, searchTerm]);

    const outOfStockCount = useMemo(() => alerts.filter(a => a.currentStock === 0).length, [alerts]);
    const lowStockCount = useMemo(() => alerts.filter(a => a.currentStock > 0 && a.currentStock <= a.threshold).length, [alerts]);

    return (
        <div className="space-y-8 font-sans animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-tight">Low Stock Alerts</h1>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mt-1">Critical inventory warnings</p>
                </div>
                <button
                    onClick={() => navigate('/seller/inventory/adjust')}
                    className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-200 transition-all flex items-center gap-2"
                >
                    <Zap size={14} /> Quick Restock
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <AdminStatsCard
                    label="Total Alerts"
                    value={alerts.length}
                    icon={AlertTriangle}
                    color="text-amber-600"
                    bgColor="bg-amber-50"
                />
                <AdminStatsCard
                    label="Out of Stock"
                    value={outOfStockCount}
                    icon={Ban}
                    color="text-red-600"
                    bgColor="bg-red-50"
                />
                <AdminStatsCard
                    label="Low Stock Warning"
                    value={lowStockCount}
                    icon={Clock}
                    color="text-orange-600"
                    bgColor="bg-orange-50"
                />
            </div>

            <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md w-full ml-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                    <input
                        type="text"
                        placeholder="Search by product..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-xl border-none text-xs font-bold text-gray-900 focus:ring-0 placeholder:text-gray-400"
                    />
                </div>
                <div className="flex items-center gap-3 px-3">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Threshold</p>
                    <input
                        type="number"
                        min={1}
                        value={threshold}
                        onChange={(e) => setThreshold(Number.parseInt(e.target.value || '5', 10) || 5)}
                        className="w-24 px-3 py-2 bg-gray-50 rounded-xl border-none text-xs font-black text-gray-900 focus:ring-0"
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-gray-800 font-bold uppercase tracking-widest text-[10px] md:text-xs">Product Details</th>
                                <th className="px-6 py-4 text-gray-800 font-bold uppercase tracking-widest text-[10px] md:text-xs">Category</th>
                                <th className="px-6 py-4 text-gray-800 font-bold uppercase tracking-widest text-[10px] md:text-xs">Stock Status</th>
                                <th className="px-6 py-4 text-gray-800 font-bold uppercase tracking-widest text-[10px] md:text-xs text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 uppercase tracking-tighter text-[10px] md:text-[11px] text-gray-900">
                            {loading ? (
                                <tr><td colSpan="4" className="px-6 py-12 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">Loading Alerts...</td></tr>
                            ) : alerts.length === 0 ? (
                                <tr><td colSpan="4" className="px-6 py-12 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">No alerts found</td></tr>
                            ) : alerts.map((item) => {
                                const isOOS = item.currentStock === 0;
                                const safeThreshold = item.threshold || 1;
                                const percentage = Math.min((item.currentStock / safeThreshold) * 100, 100);

                                return (
                                    <tr key={`${item.productId}-${item.variantId}`} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 bg-gray-50 rounded-lg border border-gray-100 p-1 flex-shrink-0 relative ${isOOS ? 'grayscale opacity-75' : ''}`}>
                                                    {item.productImage ? (
                                                        <img src={item.productImage} alt="" className="w-full h-full object-contain mix-blend-multiply" />
                                                    ) : (
                                                        <Package size={20} className="text-gray-300 m-auto" />
                                                    )}
                                                    {isOOS && (
                                                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100/50 rounded-lg">
                                                            <AlertTriangle size={16} className="text-red-500" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-black line-clamp-1">{item.productName}</p>
                                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest">{item.variantName || 'Standard'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-gray-100 rounded text-[10px] font-bold text-gray-600 uppercase tracking-wide">
                                                {item.categoryName}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="max-w-[200px]">
                                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1.5">
                                                    <span className={isOOS ? 'text-red-600' : 'text-orange-600'}>
                                                        {item.currentStock} Units Left
                                                    </span>
                                                    <span className="text-gray-400">Alert at {item.threshold}</span>
                                                </div>
                                                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-500 ${isOOS ? 'bg-red-500' : 'bg-orange-500'}`}
                                                        style={{ width: `${isOOS ? 0 : percentage}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => navigate('/seller/inventory/adjust')}
                                                className="px-4 py-2 bg-white border border-gray-200 hover:border-emerald-200 hover:bg-emerald-50 text-gray-600 hover:text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95 flex items-center gap-2 ml-auto"
                                            >
                                                Quick Restock <ArrowRight size={12} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {pagination?.pages > 1 && (
                <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Page {pagination.page} of {pagination.pages} ({pagination.total} alerts)
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page <= 1 || loading}
                            className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-600 text-[10px] font-black uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Prev
                        </button>
                        <button
                            onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                            disabled={page >= pagination.pages || loading}
                            className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-600 text-[10px] font-black uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SellerLowStockAlertsPage;
