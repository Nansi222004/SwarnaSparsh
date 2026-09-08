import React, { useEffect, useState } from 'react';
import {
    Bell, Send, Tag, ShoppingBag, Eye, Trash2, Clock, ChevronRight, X, Plus
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import { adminService } from '../services/adminService';
import toast from 'react-hot-toast';

const GlobalNotificationManager = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [newNotif, setNewNotif] = useState({
        type: 'GENERAL',
        title: '',
        message: '',
        priority: 'Medium',
        link: ''
    });

    const loadNotifications = async () => {
        setLoading(true);
        const list = await adminService.getAdminNotifications();
        setNotifications(Array.isArray(list) ? list : []);
        setLoading(false);
    };

    useEffect(() => {
        loadNotifications();
    }, []);

    const markAsRead = async (id) => {
        const ok = await adminService.markAdminNotificationRead(id);
        if (!ok) {
            toast.error('Failed to update notification');
            return;
        }
        setNotifications((prev) => prev.map((item) => (
            item._id === id ? { ...item, isRead: true } : item
        )));
    };

    const deleteNotif = async (id) => {
        const ok = await adminService.deleteAdminNotification(id);
        if (!ok) {
            toast.error('Failed to delete notification');
            return;
        }
        setNotifications((prev) => prev.filter((item) => item._id !== id));
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setSaving(true);
        const result = await adminService.broadcastAdminNotification(newNotif);
        setSaving(false);

        if (!result?.success) {
            toast.error(result?.message || 'Failed to create notification');
            return;
        }

        toast.success(result.message || 'Notification created');
        setIsCreateModalOpen(false);
        setNewNotif({
            type: 'GENERAL',
            title: '',
            message: '',
            priority: 'Medium',
            link: ''
        });
        await loadNotifications();
    };

    const typeIcons = {
        ORDER: <ShoppingBag className="w-4 h-4 text-blue-600" />,
        RETURN: <Tag className="w-4 h-4 text-amber-600" />,
        REPLACEMENT: <Tag className="w-4 h-4 text-indigo-600" />,
        COUPON: <Tag className="w-4 h-4 text-emerald-600" />,
        SELLER_REQUEST: <Tag className="w-4 h-4 text-purple-600" />,
        GENERAL: <Bell className="w-4 h-4 text-gray-600" />
    };

    return (
        <div className="max-w-[1400px] mx-auto space-y-3 md:space-y-4 animate-in fade-in duration-500 pb-20 font-sans">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-1 px-1">
                <PageHeader
                    title="Global Notifications"
                    subtitle="Manage system-wide alerts & updates"
                />
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 bg-black text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm hover:bg-gray-800 transition-all active:scale-95"
                >
                    <Plus className="w-4 h-4" />
                    <span>Add Notification</span>
                </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white text-black uppercase tracking-widest text-[9px] md:text-[11px] font-bold border-b border-gray-100">
                                <th className="px-4 md:px-6 py-3 md:py-4 text-center w-16">Type</th>
                                <th className="px-4 md:px-6 py-3 md:py-4">Notification Details</th>
                                <th className="px-4 md:px-6 py-3 md:py-4">Priority</th>
                                <th className="px-4 md:px-6 py-3 md:py-4">Date</th>
                                <th className="px-4 md:px-6 py-3 md:py-4 text-center">Status</th>
                                <th className="px-4 md:px-6 py-3 md:py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 uppercase tracking-tighter text-[10px] md:text-sm">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="p-12 text-center text-xs font-bold uppercase tracking-widest text-gray-400">
                                        Loading notifications...
                                    </td>
                                </tr>
                            ) : notifications.map((notif) => (
                                <tr key={notif._id} className={`hover:bg-gray-50/50 transition-colors group ${notif.isRead ? 'bg-gray-50/20' : ''}`}>
                                    <td className="px-4 md:px-6 py-3 md:py-4 text-center align-top pt-5">
                                        <div className="bg-white p-2 rounded-lg border border-gray-100 shadow-sm inline-flex items-center justify-center">
                                            {typeIcons[notif.type] || typeIcons.GENERAL}
                                        </div>
                                    </td>
                                    <td className="px-4 md:px-6 py-3 md:py-4 align-top pt-5">
                                        <div className="space-y-1">
                                            <h4 className="text-sm font-bold text-gray-900">{notif.title}</h4>
                                            <p className="text-[10px] md:text-xs text-gray-500 font-bold lowercase tracking-normal leading-relaxed max-w-lg">
                                                {notif.message}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-4 md:px-6 py-3 md:py-4 align-top pt-5">
                                        <span className="text-xs font-bold text-gray-700">{notif.priority || 'Medium'}</span>
                                    </td>
                                    <td className="px-4 md:px-6 py-3 md:py-4 align-top pt-5">
                                        <div className="flex items-center gap-1.5 font-bold text-gray-500">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span>{notif.createdAt ? new Date(notif.createdAt).toLocaleString() : '--'}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 md:px-6 py-3 md:py-4 text-center align-top pt-5">
                                        <span className={`px-2.5 py-1 rounded text-[10px] md:text-[11px] font-bold border ${notif.isRead ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-green-50 text-green-600 border-green-100'}`}>
                                            {notif.isRead ? 'Read' : 'New'}
                                        </span>
                                    </td>
                                    <td className="px-4 md:px-6 py-3 md:py-4 text-right align-top pt-5">
                                        <div className="flex items-center justify-end gap-2 transition-opacity">
                                            {!notif.isRead && (
                                                <button
                                                    onClick={() => markAsRead(notif._id)}
                                                    className="p-2 bg-white border border-gray-200 rounded-lg text-gray-400 hover:text-black hover:border-black transition-all shadow-sm"
                                                    title="Mark as read"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => deleteNotif(notif._id)}
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
                        <h3 className="text-gray-900 font-bold text-lg mb-1">No Alerts Created</h3>
                        <p className="text-sm text-gray-400">Create a new notification to get started.</p>
                    </div>
                )}
            </div>

            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                            <h3 className="text-xl font-black text-black uppercase tracking-wide">Create Notification</h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-lg text-gray-400 transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Type</label>
                                    <select
                                        className="w-full p-3 bg-white border-2 border-gray-100 rounded-lg text-xs font-bold focus:outline-none focus:border-black transition-all"
                                        value={newNotif.type}
                                        onChange={(e) => setNewNotif({ ...newNotif, type: e.target.value })}
                                    >
                                        <option value="GENERAL">General</option>
                                        <option value="ORDER">Order</option>
                                        <option value="RETURN">Return</option>
                                        <option value="REPLACEMENT">Replacement</option>
                                        <option value="COUPON">Coupon</option>
                                        <option value="SELLER_REQUEST">Seller Request</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Priority</label>
                                    <div className="relative">
                                        <select
                                            className="w-full p-3 bg-white border-2 border-gray-100 rounded-lg text-xs font-bold focus:outline-none focus:border-black transition-all appearance-none"
                                            value={newNotif.priority}
                                            onChange={(e) => setNewNotif({ ...newNotif, priority: e.target.value })}
                                        >
                                            <option value="Low">Low</option>
                                            <option value="Medium">Medium</option>
                                            <option value="High">High</option>
                                            <option value="Urgent">Urgent</option>
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                            <ChevronRight className="w-4 h-4 rotate-90" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Headline</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Flash Sale Live!"
                                    className="w-full p-3 bg-white border-2 border-gray-100 rounded-lg text-sm font-bold focus:outline-none focus:border-black transition-all"
                                    value={newNotif.title}
                                    onChange={(e) => setNewNotif({ ...newNotif, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Message</label>
                                <textarea
                                    placeholder="Short message for customers..."
                                    className="w-full p-3 bg-white border-2 border-gray-100 rounded-lg text-sm font-medium h-24 resize-none focus:outline-none focus:border-black transition-all"
                                    value={newNotif.message}
                                    onChange={(e) => setNewNotif({ ...newNotif, message: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Link (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="/shop"
                                    className="w-full p-3 bg-white border-2 border-gray-100 rounded-lg text-sm font-medium focus:outline-none focus:border-black transition-all"
                                    value={newNotif.link}
                                    onChange={(e) => setNewNotif({ ...newNotif, link: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="flex-1 px-4 py-3.5 bg-white border-2 border-gray-100 text-gray-900 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className={`flex-1 px-4 py-3.5 text-white rounded-lg text-xs font-black uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 ${saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-black hover:bg-gray-800'}`}
                                >
                                    <Send className="w-3.5 h-3.5" />
                                    {saving ? 'Creating...' : 'Launch Alert'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GlobalNotificationManager;
