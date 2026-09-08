import React from 'react';
import { Bell, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { adminService } from '../services/adminService';

const AdminHeader = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [counts, setCounts] = React.useState({ sellers: 0, customers: 0, notifications: 0 });

    React.useEffect(() => {
        let isMounted = true;

        const updateCounts = async () => {
            try {
                const sellers = await adminService.getSellers({ status: 'PENDING' });
                const users = JSON.parse(localStorage.getItem('users_data') || '[]');
                const notifs = await adminService.getAdminNotifications() || [];
                
                const pendingSellers = Array.isArray(sellers) ? sellers.length : 0;
                const pendingUsers = users.filter(u => u.status === 'Pending' && (u.type === 'retailer' || u.type === 'horeca')).length;
                const unreadNotifs = Array.isArray(notifs) ? notifs.filter(n => !n.isRead).length : 0;

                if (isMounted) {
                    setCounts({ sellers: pendingSellers, customers: pendingUsers, notifications: unreadNotifs });
                }
            } catch (err) {
                console.error("Error updating admin header counts:", err);
            }
        };
        updateCounts();
        const interval = setInterval(updateCounts, 15000);
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    const totalPending = counts.sellers + counts.customers + counts.notifications;

    return (
        <header className="h-20 bg-footerBg border-b border-white/5 flex items-center justify-end text-left w-full">
            {/* Right Actions with Dark Background */}
            <div className="h-full bg-white/5 px-8 flex items-center gap-6 border-l border-white/5">
                <button 
                    onClick={() => navigate('/admin/notifications')}
                    className="relative p-2.5 bg-white/5 text-gray-400 rounded-xl hover:text-white border border-white/10 shadow-sm transition-all focus:ring-2 focus:ring-primary/10"
                >
                    <Bell size={20} />
                    {totalPending > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-footerBg shadow-sm animate-bounce">
                            {totalPending}
                        </span>
                    )}
                </button>

                <div className="h-8 w-px bg-white/10 mx-1" />

                <div className="flex items-center gap-3 cursor-pointer group">
                    <div className="text-right">
                        <p className="text-sm font-black text-white leading-none">{user?.name || 'Admin User'}</p>
                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1.5">Staff Account</p>
                    </div>
                    <div className="w-10 h-10 bg-white/10 text-white rounded-xl flex items-center justify-center border border-white/10 shadow-sm group-hover:bg-primary group-hover:text-white transition-all">
                        <User size={20} />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default AdminHeader;
