import React from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import {
    Plus, Ticket, Clock, RotateCcw, AlertTriangle,
    Users, IndianRupee, ShoppingBag,
    Package, Activity, ShieldCheck
} from 'lucide-react';
import AdminStatsCard from '../components/AdminStatsCard';
import AdminTable from '../components/AdminTable';


const AdminDashboard = () => {
    const navigate = useNavigate();
    const formatCurrency = (value) => `INR ${Number(value || 0).toLocaleString()}`;
    const getStatusTone = (status) => {
        switch (String(status || 'Processing')) {
            case 'Delivered':
                return 'text-emerald-600 bg-emerald-50';
            case 'Cancelled':
                return 'text-red-600 bg-red-50';
            case 'Shipped':
            case 'Out for Delivery':
                return 'text-blue-600 bg-blue-50';
            default:
                return 'text-orange-500 bg-orange-50';
        }
    };

    const [statsData, setStatsData] = React.useState({
        users: 0,
        orders: 0,
        pendingOrders: 0,
        products: 0,
        revenue: 0,
        recent: [],
    });
    const [loading, setLoading] = React.useState(true);
    const [errorMessage, setErrorMessage] = React.useState('');

    const fetchStats = React.useCallback(async () => {
        setLoading(true);
        setErrorMessage('');
        try {
            const res = await api.get('admin/stats');
            if (!res.data.success) {
                setErrorMessage('Unable to load dashboard stats.');
                return;
            }
            const payload = res.data.data || {};
            const summary = payload.summary || {};
            const pendingFromDistribution = (payload.statusDistribution || []).reduce((sum, item) => (
                ['Processing', 'Confirmed', 'Packed'].includes(item?._id) ? sum + Number(item.count || 0) : sum
            ), 0);
            const recentOrders = Array.isArray(payload.recentOrders) ? payload.recentOrders : [];

            setStatsData({
                users: Number(summary.totalUsers || 0),
                orders: Number(summary.totalOrders || 0),
                pendingOrders: Number(payload.pendingOrders ?? pendingFromDistribution ?? 0),
                products: Number(summary.totalProducts || 0),
                revenue: Number(summary.totalRevenue || 0),
                recent: recentOrders.map((order) => ({
                    id: order.orderId || order._id || 'N/A',
                    date: order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A',
                    customer: order.customerName || order.userId?.name || order.user?.name || order.shippingAddress?.firstName || 'Customer',
                    amount: formatCurrency(order.total || order.totalAmount || 0),
                    status: order.status || order.orderStatus || 'Processing'
                }))
            });
        } catch (err) {
            console.error('Failed to fetch admin stats:', err);
            setErrorMessage('Unable to load dashboard stats. Please retry.');
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const quickActions = [
        { label: 'VISITOR ANALYTICS', icon: Activity, bg: 'bg-blue-50', text: 'text-blue-500', path: '/admin/analytics' },
        { label: 'ADD PRODUCT', icon: Plus, bg: 'bg-[#F0FDF4]', text: 'text-emerald-500', path: '/admin/products/new' },
        { label: 'CREATE COUPON', icon: Ticket, bg: 'bg-[#FDF2F8]', text: 'text-pink-500', path: '/admin/coupons/add' },
        { label: 'PENDING ORDERS', icon: Clock, bg: 'bg-[#FFF7ED]', text: 'text-orange-500', path: '/admin/orders?status=pending' },
        { label: 'CHECK RETURNS', icon: RotateCcw, bg: 'bg-[#FFF1F2]', text: 'text-rose-500', path: '/admin/returns' },
        { label: 'STOCK ALERTS', icon: AlertTriangle, bg: 'bg-[#FEF2F2]', text: 'text-red-500', path: '/admin/inventory/alerts' },
        { label: 'POS DIRECT SALES', icon: ShoppingBag, bg: 'bg-[#EFF6FF]', text: 'text-blue-500', path: '/admin/direct-sales' },
    ];

    const stats = [
        { label: 'TOTAL REVENUE', value: formatCurrency(statsData.revenue), icon: IndianRupee, color: 'text-emerald-500', bgColor: 'bg-emerald-50' },
        { label: 'TOTAL ORDERS', value: statsData.orders, icon: ShoppingBag, color: 'text-blue-500', bgColor: 'bg-blue-50' },
        { label: 'PENDING ORDERS', value: statsData.pendingOrders, icon: Clock, color: 'text-orange-500', bgColor: 'bg-orange-50', badge: statsData.pendingOrders > 0 ? 'ACTION REQUIRED' : '', badgeColor: 'text-red-500' },
        { label: 'STORE PRODUCTS', value: statsData.products, icon: Package, color: 'text-indigo-500', bgColor: 'bg-indigo-50' },
        { label: 'CUSTOMER USERS', value: statsData.users, icon: Users, color: 'text-blue-500', bgColor: 'bg-blue-50' },
    ];

    const orderColumns = [
        {
            header: 'ORDER',
            className: 'w-[30%]',
            render: (row) => (
                <div className="flex flex-col">
                    <span className="text-xs font-semibold text-black">{row.id}</span>
                    <span className="text-[10px] font-medium text-gray-400 mt-1">{row.date}</span>
                </div>
            )
        },
        {
            header: 'CUSTOMER',
            className: 'w-[30%]',
            render: (row) => (
                <span className="text-xs font-semibold text-gray-600 group-hover:text-black transition-colors">{row.customer}</span>
            )
        },
        {
            header: 'AMOUNT',
            className: 'w-[20%] text-right',
            render: (row) => (
                <span className="text-xs font-semibold text-black">{row.amount}</span>
            )
        },
        {
            header: 'STATUS',
            className: 'w-[20%] text-right',
            render: (row) => (
                <span className={`inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${getStatusTone(row.status)}`}>
                    {row.status}
                </span>
            )
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="text-left">
                <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-tight">ADMIN DASHBOARD</h1>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mt-1">PLATFORM ANALYTICS & QUICK CONTROLS</p>
            </div>

            {errorMessage && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold text-red-700">{errorMessage}</p>
                    <button
                        onClick={fetchStats}
                        className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold uppercase tracking-wide hover:bg-red-700"
                    >
                        Retry
                    </button>
                </div>
            )}



            <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 text-left">QUICK MANAGEMENT</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
                    {quickActions.map((action, idx) => (
                        <button
                            key={idx}
                            onClick={() => navigate(action.path)}
                            className={`${action.bg} py-3 px-3 rounded-lg flex flex-col items-center justify-center gap-2 hover:shadow-md transition-all active:scale-95 border border-transparent hover:border-black/5 group h-full`}
                        >
                            <div className="p-2 bg-white/60 rounded-full group-hover:scale-110 transition-transform">
                                <action.icon className={`w-4 h-4 ${action.text}`} />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-900 text-center leading-tight">
                                {action.label}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {stats.map((stat, idx) => (
                    <AdminStatsCard
                        key={idx}
                        label={stat.label}
                        value={stat.value}
                        icon={stat.icon}
                        color={stat.color}
                        bgColor={stat.bgColor}
                        badge={stat.badge}
                        badgeColor={stat.badgeColor}
                    />
                ))}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <div className="flex justify-between items-center mb-6">
                    <div className="text-left">
                        <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide">RECENT ORDERS</h2>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mt-1">QUEUE OF LATEST CUSTOMER ORDERS</p>
                    </div>
                    <button onClick={() => navigate('/admin/orders')} className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest hover:text-emerald-700">VIEW ALL</button>
                </div>
                <AdminTable
                    columns={orderColumns}
                    data={statsData.recent}
                    emptyMessage={loading ? 'Loading recent orders...' : 'No Data Available'}
                />
            </div>
        </div>
    );
};

export default AdminDashboard;
