import React, { useState, useEffect } from 'react';
import {
    Package, ShoppingBag, RotateCcw, TrendingUp,
    IndianRupee, Clock, CheckCircle2, Boxes, AlertCircle,
    ArrowRight, ShoppingCart, ChevronRight, Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import sellerCommissionService, { formatINR } from '../services/sellerCommissionService';
import { sellerService } from '../services/sellerService';

const formatCurrency = (value) => `INR ${Number(value || 0).toLocaleString()}`;

const SellerDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalProducts: 0,
        totalInventory: 0,
        pendingOrders: 0,
        acceptedOrders: 0,
        deliveredOrders: 0,
        returnRequests: 0,
        totalRevenue: 0,
        lowStockItems: []
    });
    const [analytics, setAnalytics] = useState(null);
    const [visitorInsights, setVisitorInsights] = useState([]);
    const [recentOrders, setRecentOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [commissionTotals, setCommissionTotals] = useState({ confirmed: 0, pending: 0, reversed: 0, net: 0, gross: 0 });
    const [commissionLoading, setCommissionLoading] = useState(true);
    const [showMetalPricingAlert, setShowMetalPricingAlert] = useState(false);

    useEffect(() => {
        const fetchSellerStats = async () => {
            try {
                setLoadError('');
                const [statsRes, insightsRes] = await Promise.all([
                    api.get('seller/dashboard/stats'),
                    api.get('seller/analytics/visitor-insights')
                ]);

                if (statsRes.data.success) {
                    const payload = statsRes.data.data || statsRes.data;
                    const { stats: sellerStats, recentOrders: orderRows, analytics: dashboardAnalytics } = payload;

                    setStats({
                        totalProducts: sellerStats?.totalProducts ?? payload.totalProducts ?? 0,
                        totalInventory: sellerStats?.totalStock ?? 0,
                        pendingOrders: sellerStats?.pendingOrders ?? 0,
                        acceptedOrders: sellerStats?.acceptedOrders ?? 0,
                        deliveredOrders: sellerStats?.deliveredOrders ?? 0,
                        returnRequests: sellerStats?.returnRequests ?? 0,
                        totalRevenue: sellerStats?.totalRevenue ?? payload.totalEarnings ?? 0,
                        lowStockItems: sellerStats?.lowStockProducts ?? []
                    });
                    setAnalytics(dashboardAnalytics || null);
                    setRecentOrders((orderRows || []).map((order) => ({
                        id: order._id,
                        customerName: order.userId?.fullName || order.userId?.name || order.shippingAddress?.firstName || 'Customer',
                        product: order.items?.[0]?.productId?.name || order.items?.[0]?.name || 'Jewellery Item',
                        price: Number(order.sellerSubtotal ?? order.total ?? 0),
                        paymentStatus: String(order.paymentStatus || 'pending').toLowerCase(),
                        orderStatus: order.status || 'Processing'
                    })));
                }

                if (insightsRes.data.success) {
                    setVisitorInsights(insightsRes.data.data.insights || []);
                }
            } catch (err) {
                setLoadError(err?.response?.data?.message || err?.message || 'Failed to load dashboard');
            } finally {
                setLoading(false);
            }
        };

        fetchSellerStats();
    }, []);

    useEffect(() => {
        const fetchCommission = async () => {
            setCommissionLoading(true);
            try {
                const res = await sellerCommissionService.getSummary();
                if (res?.success) {
                    const t = res.data?.totals || {};
                    setCommissionTotals({
                        confirmed: Number(t.confirmed) || 0,
                        pending:   Number(t.pending)   || 0,
                        reversed:  Number(t.reversed)  || 0,
                        gross:     Number(t.gross)     || 0,
                        net:       Number(t.net)       || 0,
                    });
                }
            } catch (e) {
                console.error('Failed to load seller commission summary:', e);
            } finally {
                setCommissionLoading(false);
            }
        };
        fetchCommission();
    }, []);

    useEffect(() => {
        const checkMetalPricing = async () => {
            try {
                const res = await sellerService.getMetalPricing();
                const rates = res?.metalRates || {};
                const gold = rates.gold10g || {};
                const silver = rates.silver10g || {};
                
                const hasZeroRates = 
                    (Number(gold.k14) || 0) === 0 &&
                    (Number(gold.k18) || 0) === 0 &&
                    (Number(gold.k22) || 0) === 0 &&
                    (Number(gold.k24) || 0) === 0 &&
                    (Number(silver.sterling925) || 0) === 0 &&
                    (Number(silver.silverOther) || 0) === 0;

                if (hasZeroRates) {
                    setShowMetalPricingAlert(true);
                }
            } catch (err) {
                console.error("Failed to check metal pricing:", err);
            }
        };
        checkMetalPricing();
    }, []);

    const netPayout = Math.max(0, Number(stats.totalRevenue || 0) - Number(commissionTotals.net || 0));

    const statCards = [
        { label: 'Active Listings', value: stats.totalProducts, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50', path: '/seller/products' },
        { label: 'Total Inventory', value: stats.totalInventory, icon: Boxes, color: 'text-purple-600', bg: 'bg-purple-50', path: '/seller/inventory' },
        { label: 'Pending Fulfillment', value: stats.pendingOrders, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', path: '/seller/orders?status=pending' },
        { label: 'In-Transit Orders', value: stats.acceptedOrders, icon: ShoppingBag, color: 'text-indigo-600', bg: 'bg-indigo-50', path: '/seller/orders?status=processing' },
        { label: 'Completed Orders', value: stats.deliveredOrders, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', path: '/seller/orders?status=delivered' },
        { label: 'Return Requests', value: stats.returnRequests, icon: RotateCcw, color: 'text-red-600', bg: 'bg-red-50', path: '/seller/returns' },
        { label: 'Gross Revenue', value: formatCurrency(stats.totalRevenue), icon: IndianRupee, color: 'text-[#3E2723]', bg: 'bg-[#FDFBF7]', wide: true, path: '/seller/analytics' },
        { label: "Today's Volume", value: analytics?.todayStats?.orders || 0, icon: ShoppingCart, color: 'text-sky-600', bg: 'bg-sky-50', path: '/seller/orders' },
        { label: 'Monthly Target', value: formatCurrency(analytics?.monthlyStats?.revenue || 0), icon: TrendingUp, color: 'text-rose-600', bg: 'bg-rose-50', path: '/seller/analytics' },
    ];

    const ordersFilter = (arr, status) => arr.filter((order) => order.orderStatus === status);

    const statusWidgets = [
        { label: 'Pending', count: stats.pendingOrders, color: 'bg-amber-500', path: '/seller/orders?status=pending' },
        { label: 'Processing', count: stats.acceptedOrders, color: 'bg-indigo-500', path: '/seller/orders?status=processing' },
        { label: 'Shipped', count: ordersFilter(recentOrders, 'Shipped').length, color: 'bg-blue-500', path: '/seller/orders?status=shipped' },
        { label: 'Delivered', count: stats.deliveredOrders, color: 'bg-emerald-500', path: '/seller/orders?status=delivered' },
        { label: 'Returned', count: stats.returnRequests, color: 'bg-red-500', path: '/seller/returns' }
    ];

    if (loading) {
        return (
            <div className="p-20 text-center text-gray-400 font-black uppercase tracking-widest animate-pulse">
                Synchronizing seller dashboard...
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="p-10 md:p-20">
                <div className="max-w-2xl mx-auto bg-white border border-red-100 rounded-3xl p-8 shadow-sm">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
                            <AlertCircle size={22} />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-sm font-black uppercase tracking-widest text-gray-900">Dashboard Unavailable</h2>
                            <p className="text-sm text-gray-600 mt-2">{loadError}</p>
                            <div className="mt-6 flex items-center gap-3">
                                <button
                                    onClick={() => window.location.reload()}
                                    className="px-6 py-3 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#3E2723] transition-all"
                                >
                                    Retry
                                </button>
                                <button
                                    onClick={() => navigate('/seller/orders')}
                                    className="px-6 py-3 bg-gray-50 border border-gray-200 text-gray-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all"
                                >
                                    Open Orders
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Calculate dynamic coordinates for Transaction Frequency (7-day orders count graph)
    const dailyData = analytics?.dailyOrders || [
        { date: 'Mon', count: 0 },
        { date: 'Tue', count: 0 },
        { date: 'Wed', count: 0 },
        { date: 'Thu', count: 0 },
        { date: 'Fri', count: 0 },
        { date: 'Sat', count: 0 },
        { date: 'Sun', count: 0 }
    ];

    const maxDailyOrders = Math.max(...dailyData.map(d => d.count), 1);
    
    // Map each of the 7 points to (x, y) coordinates for SVG viewBox "0 0 600 100"
    const points = dailyData.map((d, index) => {
        const x = index * 100;
        const y = 90 - (d.count / maxDailyOrders) * 70; // map y to range 20 to 90
        return { x, y };
    });

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const fillPath = `${linePath} L 600 100 L 0 100 Z`;

    // Calculate dynamic height for Weekly Revenue Velocity
    const weeklyRevenueData = analytics?.weeklyRevenue || [
        { week: 'W1', revenue: 0 },
        { week: 'W2', revenue: 0 },
        { week: 'W3', revenue: 0 },
        { week: 'W4', revenue: 0 }
    ];
    const maxWeeklyRevenue = Math.max(...weeklyRevenueData.map(w => w.revenue), 1);

    return (
        <div className="space-y-6 font-sans pb-20 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-light text-gray-800 tracking-wide text-left">Operational Dashboard</h1>
                    <p className="text-sm font-light text-gray-500 mt-1 text-left">Store performance and transaction metrics</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-medium border border-emerald-100">
                        <TrendingUp size={14} /> Online
                    </span>
                    <div className="h-4 w-px bg-gray-300 mx-1" />
                    <span className="text-xs font-medium text-gray-500">
                        {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {statCards.map((stat, index) => (
                    <div 
                        key={index} 
                        onClick={() => stat.path && navigate(stat.path)}
                        className={`bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all duration-300 ${stat.wide ? 'xl:col-span-1' : ''} ${stat.path ? 'cursor-pointer hover:border-emerald-200' : ''}`}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color}`}>
                                <stat.icon size={18} />
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 mb-1">{stat.label}</p>
                            <p className="text-2xl font-semibold text-gray-800">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-medium text-gray-800">Platform Commission</h3>
                        <p className="text-sm font-light text-gray-500 mt-1">
                            Charged on every delivered order, reversed on cancel / return
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/seller/commission')}
                        className="px-4 py-2 rounded-xl bg-[#3E2723] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#2D1B18] flex items-center gap-2"
                    >
                        Full Report <ChevronRight size={12} />
                    </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
                        <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Net Charged</p>
                        <p className="text-xl font-black text-emerald-700 mt-2">
                            {commissionLoading ? '…' : formatINR(commissionTotals.net)}
                        </p>
                    </div>
                    <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4">
                        <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Pending Pipeline</p>
                        <p className="text-xl font-black text-amber-700 mt-2">
                            {commissionLoading ? '…' : formatINR(commissionTotals.pending)}
                        </p>
                    </div>
                    <div className="rounded-2xl bg-rose-50 border border-rose-100 p-4">
                        <p className="text-[10px] font-black text-rose-700 uppercase tracking-widest">Reversed</p>
                        <p className="text-xl font-black text-rose-700 mt-2">
                            {commissionLoading ? '…' : formatINR(commissionTotals.reversed)}
                        </p>
                    </div>
                    <div className="rounded-2xl bg-[#FDFBF7] border border-[#EFEBE9] p-4">
                        <p className="text-[10px] font-black text-[#3E2723] uppercase tracking-widest">Net Payout (Est.)</p>
                        <p className="text-xl font-black text-[#3E2723] mt-2">
                            {commissionLoading ? '…' : formatINR(netPayout)}
                        </p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                            Gross revenue − net commission
                        </p>
                    </div>
                </div>
            </div>

            {stats.lowStockItems.length > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-[2rem] p-8 flex flex-col md:flex-row items-center justify-between gap-6 animate-pulse">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-red-500 text-white rounded-2xl shadow-lg shadow-red-500/20">
                            <AlertCircle size={24} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-red-900 uppercase tracking-widest">Inventory Depletion Warning</h3>
                            <p className="text-xs font-bold text-red-700/60 uppercase mt-1">{stats.lowStockItems.length} SKUs are currently below operational safety thresholds (&lt; 5 units).</p>
                        </div>
                    </div>
                    <button onClick={() => navigate('/seller/inventory')} className="px-6 py-3 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all flex items-center gap-2">
                        Restock Now <ArrowRight size={14} />
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h3 className="text-lg font-medium text-gray-800">Transaction Frequency</h3>
                            <p className="text-sm font-light text-gray-500 mt-1">30-Day Acquisition Cycle</p>
                        </div>
                        <div className="flex gap-2">
                            <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-[#3E2723]">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#3E2723]" /> Orders
                            </div>
                        </div>
                    </div>

                    <div className="relative h-64 w-full group">
                        <svg className="w-full h-full overflow-visible" viewBox="0 0 600 100" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#3E2723" stopOpacity="0.1" />
                                    <stop offset="100%" stopColor="#3E2723" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            {[0, 25, 50, 75, 100].map((value) => (
                                <line key={value} x1="0" y1={`${value}%`} x2="100%" y2={`${value}%`} stroke="#F8F9FA" strokeWidth="1" />
                            ))}
                            {points.length > 0 && (
                                <>
                                    <path d={fillPath} fill="url(#gradient)" className="transition-all duration-700" />
                                    <path d={linePath} fill="none" stroke="#3E2723" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-700" />
                                </>
                            )}
                        </svg>
                        <div className="absolute inset-0 flex items-end justify-between px-2 pt-10 pointer-events-none">
                            {dailyData.map((day, index) => (
                                <div key={index} className="flex flex-col items-center gap-1">
                                    <span className="text-[9px] font-bold text-[#3E2723]">{day.count}</span>
                                    <div className="text-[8px] font-bold text-gray-400 uppercase">{day.date}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-4 bg-[#3E2723] rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                    <div className="relative z-10">
                        <h3 className="text-lg font-medium text-white/90 mb-8">Category Composition</h3>
                        <div className="space-y-6">
                            {analytics?.categoryPerformance?.map((category, index) => (
                                <div key={index} className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                        <span className="opacity-80">{category.name}</span>
                                        <span>{category.value}%</span>
                                    </div>
                                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-white transition-all duration-1000 ease-out" style={{ width: `${category.value}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-12 pt-8 border-t border-white/10">
                            <p className="text-sm font-light text-white/70 leading-relaxed">
                                Top performing category is <span className="font-medium text-white">NECKLACES</span> accounting for 45% of total acquisition volume this quarter.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-4 space-y-8">
                    <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm">
                        <h3 className="text-lg font-medium text-gray-800 mb-6">Fulfillment Summary</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {statusWidgets.map((widget, index) => (
                                <div 
                                    key={index} 
                                    onClick={() => widget.path && navigate(widget.path)}
                                    className={`p-4 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col gap-2 ${widget.path ? 'cursor-pointer hover:border-gray-300 hover:bg-gray-100 transition-colors' : ''}`}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${widget.color}`} />
                                        <span className="text-xs font-medium text-gray-500">{widget.label}</span>
                                    </div>
                                    <span className="text-xl font-semibold text-gray-800">{widget.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-lg font-medium text-gray-800">Revenue Velocity</h3>
                            <IndianRupee size={16} className="text-gray-400" />
                        </div>
                        <div className="flex items-end justify-between h-32 gap-3 px-2">
                            {weeklyRevenueData.map((week, index) => (
                                <div key={index} className="flex-1 group relative">
                                    <div
                                        className="w-full bg-[#EFEBE9] group-hover:bg-[#8D6E63] rounded-t-lg transition-all duration-500"
                                        style={{ height: `${(week.revenue / maxWeeklyRevenue) * 100}%` }}
                                    />
                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[8px] font-black opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                        {formatCurrency(week.revenue)}
                                    </div>
                                    <div className="mt-3 text-[8px] font-black text-gray-300 uppercase text-center">{week.week}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-8 bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-medium text-gray-800">Product Engagement</h3>
                            <p className="text-sm font-light text-gray-500 mt-1">Visitor Views & Cart Additions</p>
                        </div>
                        <Eye size={16} className="text-gray-400" />
                    </div>
                    
                    <div className="space-y-4">
                        {visitorInsights.slice(0, 5).map((insight, idx) => (
                            <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100/50 gap-4">
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className="w-10 h-10 shrink-0 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600 shadow-sm">
                                        {idx + 1}
                                    </div>
                                    <span className="text-sm font-medium text-gray-800 truncate">{insight.name}</span>
                                </div>
                                <div className="flex items-center gap-6 sm:justify-end shrink-0 pl-14 sm:pl-0">
                                    <div className="text-left sm:text-right">
                                        <p className="text-[10px] font-medium text-gray-500 uppercase tracking-widest mb-0.5">Views</p>
                                        <p className="text-sm font-bold text-gray-900">{insight.views}</p>
                                    </div>
                                    <div className="text-left sm:text-right">
                                        <p className="text-[10px] font-medium text-gray-500 uppercase tracking-widest mb-0.5">Carts</p>
                                        <p className="text-sm font-bold text-[#8D6E63]">{insight.carts}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {visitorInsights.length === 0 && (
                            <div className="text-center py-10 text-[10px] font-black text-gray-300 uppercase tracking-widest">
                                No engagement data yet
                            </div>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-8 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0 z-10">
                        <h3 className="text-lg font-medium text-gray-800">Live Transaction Stream</h3>
                        <button onClick={() => navigate('/seller/orders')} className="text-sm font-medium text-[#8D6E63] flex items-center gap-1 hover:text-[#3E2723] transition-colors">
                            Audit Module <ChevronRight size={14} />
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[#FDFBF7] border-b border-[#EFEBE9]">
                                <tr>
                                    <th className="px-8 py-5 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">ID</th>
                                    <th className="px-4 py-5 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Client</th>
                                    <th className="px-4 py-5 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Asset</th>
                                    <th className="px-4 py-5 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Value</th>
                                    <th className="px-4 py-5 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Security</th>
                                    <th className="px-8 py-5 text-right text-[9px] font-black text-gray-400 uppercase tracking-widest">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {recentOrders.map((order) => (
                                    <tr key={order.id} className="group hover:bg-gray-50/50 transition-colors">
                                        <td className="px-8 py-5 text-[10px] font-black text-[#3E2723]">{order.id}</td>
                                        <td className="px-4 py-5">
                                            <div className="text-[10px] font-black text-gray-900 uppercase leading-none mb-1">{order.customerName}</div>
                                            <div className="text-[8px] font-bold text-gray-300 uppercase tracking-widest italic leading-none">KYC VERIFIED</div>
                                        </td>
                                        <td className="px-4 py-5 max-w-[150px]">
                                            <div className="text-[10px] font-bold text-gray-700 uppercase truncate">{order.product}</div>
                                        </td>
                                        <td className="px-4 py-5 text-[10px] font-black text-gray-900 tracking-tighter">{formatCurrency(order.price)}</td>
                                        <td className="px-4 py-5">
                                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                                                ['paid', 'cod'].includes(order.paymentStatus) ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                                            }`}>
                                                {order.paymentStatus.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <button
                                                onClick={() => navigate(`/seller/order-details/${order.id}`)}
                                                className="p-2 hover:bg-white rounded-xl border border-transparent hover:border-gray-200 transition-all text-gray-400 hover:text-[#3E2723]"
                                            >
                                                <Eye size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            {showMetalPricingAlert && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl border border-gray-100 flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
                        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-4">
                            <AlertCircle size={24} />
                        </div>
                        <h3 className="text-lg font-black text-gray-900 uppercase tracking-wide">Configure Metal Pricing</h3>
                        <p className="text-sm text-gray-600 mt-3 leading-relaxed">
                            To add a product, first set the metal pricing because if it does not add a metal price it will come as 0 in metal price.
                        </p>
                        <div className="mt-6 flex flex-col sm:flex-row gap-3 w-full">
                            <button
                                onClick={() => {
                                    setShowMetalPricingAlert(false);
                                    navigate('/seller/metal-pricing');
                                }}
                                className="flex-1 px-5 py-3 bg-[#3E2723] hover:bg-black text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95"
                            >
                                Set Pricing
                            </button>
                            <button
                                onClick={() => setShowMetalPricingAlert(false)}
                                className="flex-1 px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SellerDashboard;
