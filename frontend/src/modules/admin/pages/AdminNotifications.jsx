import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Bell, ShoppingBag, Star, Store,
    AlertTriangle, Check, Trash2,
    Clock, CheckCircle2, Eye
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import { adminService } from '../services/adminService';
import toast from 'react-hot-toast';

const AdminNotifications = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);

    React.useEffect(() => {
        const fetchNotifs = async () => {
            setLoading(true);
            try {
                const data = await adminService.getAdminNotifications();
                setNotifications(data || []);
            } catch (err) {
                toast.error("Failed to load notifications");
            } finally {
                setLoading(false);
            }
        };
        fetchNotifs();
    }, []);

    const markAsRead = async (id) => {
        const success = await adminService.markAdminNotificationRead(id);
        if (success) {
            setNotifications((prev) => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        } else {
            toast.error("Failed to update notification");
        }
    };

    const markAllAsRead = async () => {
        const success = await adminService.markAllAdminNotificationsRead();
        if (success) {
            setNotifications((prev) => prev.map(n => ({ ...n, isRead: true })));
        } else {
            toast.error("Failed to mark all as read");
        }
    };

    const handleConfirmDelete = async () => {
        if (!deleteConfirmId) return;
        const success = await adminService.deleteAdminNotification(deleteConfirmId);
        if (success) {
            setNotifications((prev) => prev.filter(n => n._id !== deleteConfirmId));
            toast.success("Notification deleted successfully");
        } else {
            toast.error("Failed to delete notification");
        }
        setDeleteConfirmId(null);
    };

    const typeIcons = {
        ORDER: <ShoppingBag className="w-4 h-4 text-blue-600" />,
        RETURN: <AlertTriangle className="w-4 h-4 text-orange-600" />,
        REPLACEMENT: <AlertTriangle className="w-4 h-4 text-red-600" />,
        COUPON: <Star className="w-4 h-4 text-amber-600" />,
        SELLER_REQUEST: <Store className="w-4 h-4 text-indigo-600" />,
        GENERAL: <Bell className="w-4 h-4 text-gray-600" />
    };

    const priorityStyles = {
        'Urgent': 'bg-red-100 text-red-700 border-red-200',
        'High': 'bg-orange-100 text-orange-700 border-orange-200',
        'Medium': 'bg-blue-100 text-blue-700 border-blue-200',
        'Low': 'bg-gray-100 text-gray-700 border-gray-200'
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-8 font-sans">
            <div className="max-w-[1200px] mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <PageHeader
                        title="Notifications"
                        subtitle="Manage system alerts & updates"
                    />
                    <div className="flex gap-3">
                        <button
                            onClick={markAllAsRead}
                            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-gray-800 transition-all shadow-sm"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            Mark all read
                        </button>
                    </div>
                </div>

                {/* Notifications Table */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="p-4 text-[10px] font-black text-gray-500 uppercase tracking-widest w-16 text-center">Type</th>
                                    <th className="p-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Notification Details</th>
                                    <th className="p-4 text-[10px] font-black text-gray-500 uppercase tracking-widest w-24">Priority</th>
                                    <th className="p-4 text-[10px] font-black text-gray-500 uppercase tracking-widest w-32">Time</th>
                                    <th className="p-4 text-[10px] font-black text-gray-500 uppercase tracking-widest w-24 text-center">Status</th>
                                    <th className="p-4 text-[10px] font-black text-gray-500 uppercase tracking-widest w-24 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="p-12 text-center text-xs font-bold uppercase tracking-widest text-gray-400">
                                            Loading notifications...
                                        </td>
                                    </tr>
                                ) : notifications.map((notif) => (
                                    <tr key={notif._id}
                                        className={`group hover:bg-gray-50 transition-colors ${!notif.isRead ? 'bg-[#FDFBF7]' : ''}`}
                                    >
                                        <td className="p-4 text-center align-top pt-5">
                                            <div className="bg-white p-2 rounded-lg border border-gray-100 shadow-sm inline-flex items-center justify-center">
                                                {typeIcons[notif.type] || typeIcons.GENERAL}
                                            </div>
                                        </td>
                                        <td className="p-4 align-top pt-5">
                                            <div className="space-y-1">
                                                <h4 className={`text-sm font-bold ${!notif.isRead ? 'text-black' : 'text-gray-600'}`}>
                                                    {notif.title}
                                                </h4>
                                                <p className="text-xs text-gray-500 font-medium leading-relaxed max-w-md">
                                                    {notif.message}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="p-4 align-top pt-5">
                                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold border ${priorityStyles[notif.priority || 'Medium']}`}>
                                                {notif.priority || 'Medium'}
                                            </span>
                                        </td>
                                        <td className="p-4 align-top pt-5">
                                            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400">
                                                <Clock className="w-3.5 h-3.5" />
                                                <span>{notif.createdAt ? new Date(notif.createdAt).toLocaleString() : '--'}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center align-top pt-5">
                                            {notif.isRead ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold uppercase tracking-wide">
                                                    Read
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wide animate-pulse">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                                                    New
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right align-top pt-5">
                                            <div className="flex items-center justify-end gap-2">
                                                {notif.link && (
                                                    <button
                                                        onClick={() => {
                                                            markAsRead(notif._id);
                                                            navigate(notif.link);
                                                        }}
                                                        className="p-2 bg-white border border-gray-200 rounded-lg text-gray-400 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {!notif.isRead && (
                                                    <button
                                                        onClick={() => markAsRead(notif._id)}
                                                        className="p-2 bg-white border border-gray-200 rounded-lg text-gray-400 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
                                                        title="Mark as read"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => setDeleteConfirmId(notif._id)}
                                                    className="p-2 bg-white border border-gray-200 rounded-lg text-gray-400 hover:text-red-600 hover:border-red-200 transition-all shadow-sm"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {notifications.length === 0 && !loading && (
                        <div className="p-20 text-center">
                            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Bell className="w-6 h-6 text-gray-300" />
                            </div>
                            <h3 className="text-gray-900 font-bold text-lg mb-1">No notifications found</h3>
                            <p className="text-sm text-gray-400">You're all caught up!</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Custom Delete Confirmation Modal */}
            {deleteConfirmId && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
                        <div className="p-6 text-center">
                            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Notification?</h3>
                            <p className="text-sm text-gray-500 mb-6 font-medium">Are you sure you want to delete this notification? This action cannot be undone.</p>
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="px-5 py-2.5 bg-gray-50 text-gray-700 font-bold text-xs uppercase tracking-wider rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors w-full"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmDelete}
                                    className="px-5 py-2.5 bg-red-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-red-700 transition-colors shadow-sm w-full"
                                >
                                    Yes, Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminNotifications;
