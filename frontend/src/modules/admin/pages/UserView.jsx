import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Mail,
    Phone,
    Calendar,
    ShieldCheck,
    ShieldOff,
    Package,
    Heart,
    Ticket,
    MapPin,
    ChevronRight
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import AdminStatsCard from '../components/AdminStatsCard';
import { adminService } from '../services/adminService';
import toast from 'react-hot-toast';

const UserView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [metrics, setMetrics] = useState(null);
    const [orders, setOrders] = useState([]);
    const [addresses, setAddresses] = useState([]);
    const [lastAddress, setLastAddress] = useState(null);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState(false);

    useEffect(() => {
        const loadUser = async () => {
            setLoading(true);
            try {
                const userData = await adminService.getUserById(id);
                setUser(userData?.user || null);
                setMetrics(userData?.metrics || null);
                setOrders(userData?.recentOrders || []);
                setAddresses(userData?.addresses || []);
                setLastAddress(userData?.lastAddress || null);
            } catch (err) {
                toast.error("Failed to load user details");
            } finally {
                setLoading(false);
            }
        };
        loadUser();
    }, [id]);

    const totalSpend = useMemo(() => metrics?.spentAmount || 0, [metrics]);

    const handleToggleBlock = async () => {
        if (!user) return;
        setToggling(true);
        const response = await adminService.toggleUserStatus(user._id || user.id);
        if (response?.success) {
            toast.success(response.message || (user.isBlocked ? "User unblocked" : "User blocked"));
            const refreshed = await adminService.getUserById(user._id || user.id);
            setUser(refreshed?.user || null);
            setMetrics(refreshed?.metrics || null);
            setOrders(refreshed?.recentOrders || []);
            setAddresses(refreshed?.addresses || []);
            setLastAddress(refreshed?.lastAddress || null);
        } else {
            toast.error(response?.message || "Failed to update user status");
        }
        setToggling(false);
    };

    if (loading) {
        return (
            <div className="p-20 text-center text-xs font-bold uppercase tracking-widest text-gray-400">
                Loading user profile...
            </div>
        );
    }

    if (!user) {
        return (
            <div className="p-20 text-center">
                <h2 className="text-2xl font-bold text-gray-400">User Not Found</h2>
                <button
                    onClick={() => navigate('/admin/users')}
                    className="mt-4 text-primary font-bold hover:underline underline-offset-4 flex items-center gap-2 mx-auto"
                >
                    <ArrowLeft size={16} /> Back to Users
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20 text-left animate-in fade-in duration-500">
            <PageHeader
                title="User Profile"
                subtitle={`Detailed overview of ${user.name || 'Customer'}`}
                backPath="/admin/users"
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Card */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-xl font-black text-gray-600">
                            {(user.name || 'U').charAt(0)}
                        </div>
                        <div>
                            <p className="text-lg font-black text-gray-900">{user.name || 'Unnamed User'}</p>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{user.role || 'user'}</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                            <Mail size={14} className="text-gray-400" />
                            <span className="font-semibold">{user.email || 'No email'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                            <Phone size={14} className="text-gray-400" />
                            <span className="font-semibold">{user.phone || 'No phone'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                            <Calendar size={14} className="text-gray-400" />
                            <span className="font-semibold">
                                Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                            </span>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                        <button
                            onClick={handleToggleBlock}
                            disabled={toggling}
                            className={`w-full px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${user.isBlocked
                                ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white border border-emerald-200'
                                : 'bg-red-50 text-red-600 hover:bg-red-500 hover:text-white border border-red-200'
                                }`}
                        >
                            {user.isBlocked ? <ShieldCheck size={14} /> : <ShieldOff size={14} />}
                            {user.isBlocked ? 'Enable Account' : 'Block Account'}
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <AdminStatsCard
                            label="Orders"
                            value={metrics?.ordersCount || 0}
                            icon={Package}
                            color="text-blue-600"
                            bgColor="bg-blue-50"
                        />
                        <AdminStatsCard
                            label="Total Spend"
                            value={`INR ${totalSpend.toLocaleString()}`}
                            icon={Package}
                            color="text-emerald-600"
                            bgColor="bg-emerald-50"
                        />
                        <AdminStatsCard
                            label="Wishlist"
                            value={user.wishlistCount || user.wishlist?.length || 0}
                            icon={Heart}
                            color="text-rose-600"
                            bgColor="bg-rose-50"
                        />
                        <AdminStatsCard
                            label="Coupons Used"
                            value={user.usedCoupons?.length || 0}
                            icon={Ticket}
                            color="text-amber-600"
                            bgColor="bg-amber-50"
                        />
                    </div>

                    {/* Recent Address */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <MapPin size={16} className="text-gray-400" />
                            <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">Last Shipping Address</h3>
                        </div>
                        {lastAddress ? (
                            <div className="text-sm font-semibold text-gray-700">
                                {[lastAddress.name || `${lastAddress.firstName || ''} ${lastAddress.lastName || ''}`.trim(), lastAddress.phone, lastAddress.flatNo, lastAddress.area, lastAddress.city, lastAddress.state, lastAddress.pincode]
                                    .filter(Boolean)
                                    .join(', ')}
                            </div>
                        ) : (
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">No saved address yet</div>
                        )}
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <MapPin size={16} className="text-gray-400" />
                            <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">Address Book</h3>
                        </div>
                        {addresses.length > 0 ? (
                            <div className="space-y-3">
                                {addresses.slice(0, 3).map((address) => (
                                    <div key={address._id} className="p-4 rounded-xl border border-gray-100 bg-gray-50">
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="text-xs font-black text-gray-900 uppercase tracking-widest">{address.type}</p>
                                            {address.isDefault && (
                                                <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                                                    Default
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs font-bold text-gray-700 mt-2">
                                            {[address.name, address.phone, address.flatNo, address.area, address.city, address.state, address.pincode].filter(Boolean).join(', ')}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">No addresses saved</div>
                        )}
                    </div>

                    {/* Order History */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                            <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">Order History</h3>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{metrics?.ordersCount || orders.length} orders</span>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {orders.length > 0 ? orders.slice(0, 10).map((order) => (
                                <div
                                    key={order._id}
                                    className="p-5 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer"
                                    onClick={() => navigate(`/admin/orders/${order._id}`)}
                                >
                                    <div>
                                        <p className="text-xs font-black text-gray-900">#{order.orderId}</p>
                                        <p className="text-[10px] font-bold text-gray-400">
                                            {new Date(order.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-black text-gray-900">INR {order.total?.toLocaleString()}</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{order.status}</p>
                                    </div>
                                    <ChevronRight size={16} className="text-gray-300" />
                                </div>
                            )) : (
                                <div className="p-10 text-center text-xs font-bold uppercase tracking-widest text-gray-400">No orders found</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserView;
