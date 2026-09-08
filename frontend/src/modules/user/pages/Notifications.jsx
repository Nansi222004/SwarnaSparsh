import React, { useEffect } from 'react';
import { useNotification } from '../../../context/NotificationContext';
import { Bell, BellOff, ArrowLeft, Trash2, ShoppingBag, Check } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const Notifications = () => {
    const { 
        notificationsEnabled, 
        userNotifications, 
        toggleNotificationSettings, 
        deleteUserNotification,
        markNotificationRead,
        unreadCount,
        fetchNotifications
    } = useNotification();
    const navigate = useNavigate();

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Animation Variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
    };

    return (
        <div className="min-h-screen bg-white font-body pb-12 selection:bg-[#C59B27] selection:text-white">
            {/* Header - Minimal & Clean */}
            <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-[#E8DFD0] px-4 py-4 md:py-5">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-full hover:bg-black/5 transition-colors text-black group"
                        aria-label="Go back"
                    >
                        <ArrowLeft className="w-5 h-5 md:w-6 md:h-6 group-hover:-translate-x-1 transition-transform duration-300" />
                    </button>
                    <h1 className="text-xl md:text-2xl font-display font-medium text-black tracking-wide">Notifications</h1>
                    <div className="w-9 md:w-10"></div> {/* Spacer for centering */}
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 md:py-12 max-w-3xl">

                {/* Case 1: Notifications Disabled */}
                {!notificationsEnabled && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center text-center py-16 md:py-24"
                    >
                        {/* Icon removed as per request */}
                        <h2 className="text-2xl md:text-3xl font-display font-medium text-black mb-4">Notifications are Off</h2>
                        <p className="text-gray-500 text-sm md:text-base mb-8 max-w-md mx-auto leading-relaxed font-serif">
                            Stay updated with exclusive offers, order statuses, and new arrivals by enabling notifications.
                        </p>
                        <button
                            onClick={toggleNotificationSettings}
                            className="bg-[#141211] text-white px-8 md:px-10 py-3 md:py-4 rounded-full text-xs md:text-sm font-bold uppercase tracking-widest hover:bg-[#1C1917] hover:text-[#E8D198] transition-all transform hover:scale-105 shadow-md"
                        >
                            Enable Notifications
                        </button>
                    </motion.div>
                )}

                {/* Case 2: No Notifications (Enabled but empty) */}
                {notificationsEnabled && userNotifications.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center text-center py-16 md:py-24"
                    >
                        {/* Icon removed as per request */}
                        <h2 className="text-2xl md:text-3xl font-display font-medium text-black mb-3">All Caught Up</h2>
                        <p className="text-gray-500 text-sm md:text-base mb-8 max-w-xs mx-auto font-serif">
                            You have no new notifications at the moment.
                        </p>
                        <Link
                            to="/shop"
                            className="inline-flex items-center gap-2 text-black font-bold text-xs md:text-sm uppercase tracking-widest hover:text-[#C59B27] group transition-colors"
                        >
                            Continue Shopping
                            <ShoppingBag className="w-4 h-4 group-hover:scale-110 transition-transform text-[#C59B27]" />
                        </Link>
                    </motion.div>
                )}

                {/* Case 3: List of Notifications */}
                {notificationsEnabled && userNotifications.length > 0 && (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="space-y-4 md:space-y-6"
                    >
                        <div className="flex items-center justify-between mb-6 px-1">
                            <span className="text-xs font-bold uppercase tracking-wider text-[#C59B27]">{unreadCount} Unread</span>
                            <span className="text-xs font-serif italic text-gray-400">Click card to mark as read</span>
                        </div>

                        <AnimatePresence mode='popLayout'>
                            {userNotifications.map((note) => (
                                <motion.div
                                    key={note._id || note.id}
                                    layout
                                    variants={itemVariants}
                                    exit={{ opacity: 0, x: -100, transition: { duration: 0.3 } }}
                                    className={`group relative p-5 md:p-6 rounded-2xl border transition-all duration-300 cursor-pointer ${
                                        !note.isReadByMe 
                                            ? 'border-[#C59B27] bg-[#FAF8F5] hover:shadow-md' 
                                            : 'border-[#E8DFD0] bg-white hover:border-[#C59B27] shadow-sm hover:shadow-md'
                                    }`}
                                    onClick={() => {
                                        if (!note.isReadByMe) {
                                            markNotificationRead(note._id || note.id);
                                        }
                                        if (note.link) {
                                            if (note.link.startsWith('http://') || note.link.startsWith('https://')) {
                                                window.location.href = note.link;
                                            } else {
                                                navigate(note.link);
                                            }
                                        }
                                    }}
                                >
                                    <div className="flex items-start gap-4 md:gap-6 pr-8">
                                        <div className={`p-3 rounded-xl flex-shrink-0 ${
                                            !note.isReadByMe 
                                                ? 'bg-[#C59B27]/10 text-[#C59B27]' 
                                                : 'bg-gray-50 text-gray-400'
                                        }`}>
                                            <Bell className="w-5 h-5 md:w-6 md:h-6" />
                                        </div>
                                        <div className="flex-grow min-w-0">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-1 mb-1 md:mb-2">
                                                <div className="flex items-center gap-2">
                                                    <h3 className={`text-base md:text-lg font-display text-black ${!note.isReadByMe ? 'font-semibold' : ''}`}>
                                                        {note.title}
                                                    </h3>
                                                    {!note.isReadByMe && (
                                                        <span className="w-2 h-2 rounded-full bg-[#C59B27] inline-block" />
                                                    )}
                                                </div>
                                                <span className="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-wider">
                                                    {note.date || (note.createdAt ? new Date(note.createdAt).toLocaleDateString() : '')}
                                                </span>
                                            </div>
                                            <p className={`text-xs md:text-sm leading-relaxed font-serif line-clamp-2 group-hover:line-clamp-none transition-all duration-300 ${
                                                !note.isReadByMe ? 'text-black' : 'text-gray-500'
                                            }`}>
                                                {note.message}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="absolute top-4 right-4 flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                        {!note.isReadByMe && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    markNotificationRead(note._id || note.id);
                                                }}
                                                className="p-2 text-gray-300 hover:text-green-600 hover:bg-green-50 rounded-full transition-all"
                                                title="Mark as read"
                                                aria-label="Mark as read"
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteUserNotification(note._id || note.id);
                                            }}
                                            className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                                            title="Delete notification"
                                            aria-label="Delete notification"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default Notifications;
