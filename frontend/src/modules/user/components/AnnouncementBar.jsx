import React, { useState, useEffect } from 'react';
import { Truck, ShieldCheck, RefreshCw, Headset, Tag, Gift, Star, Bell, Zap, Shield } from 'lucide-react';
import api from '../../../services/api';

const iconMap = {
    'Truck': Truck,
    'Shield': Shield,
    'ShieldCheck': ShieldCheck,
    'RefreshCw': RefreshCw,
    'Headset': Headset,
    'Tag': Tag,
    'Gift': Gift,
    'Star': Star,
    'Bell': Bell,
    'Zap': Zap
};

const AnnouncementBar = () => {
    const [announcements, setAnnouncements] = useState([
        { icon: 'RefreshCw', text: "Easy Returns & Refunds" },
        { icon: 'Headset', text: "Dedicated Support Team" },
        { icon: 'Truck', text: "Free Shipping" },
        { icon: 'Shield', text: "Secure Payments" }
    ]);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const res = await api.get('public/settings');
                if (res.data.success && res.data.data?.settings?.announcementItems?.length > 0) {
                    setAnnouncements(res.data.data.settings.announcementItems);
                    return;
                }
            } catch (err) {
                console.warn("Failed to fetch public settings from API, falling back to localStorage/defaults:", err.message);
            }

            const saved = localStorage.getItem('siteSettings');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.announcementItems && parsed.announcementItems.length > 0) {
                    setAnnouncements(parsed.announcementItems);
                }
            }
        };

        loadSettings();
        window.addEventListener('storage', loadSettings);
        return () => window.removeEventListener('storage', loadSettings);
    }, []);

    return (
        <div className="bg-[#141211] text-[#FAF8F5] border-b border-[#C59B27]/25 overflow-hidden py-1 relative z-[60]">
            <div className="flex animate-marquee whitespace-nowrap">
                {[...Array(10)].map((_, i) => (
                    <div key={i} className="flex items-center gap-6 md:gap-12 pr-6 md:pr-12">
                        {announcements.map((item, idx) => {
                            return (
                                <div key={idx} className="flex items-center gap-1.5">
                                    {item.type === 'image' && item.image ? (
                                        <img src={item.image} alt="" className="w-4 h-4 object-contain" />
                                    ) : (
                                        (() => {
                                            const IconComponent = iconMap[item.icon] || Tag;
                                            return <IconComponent className="w-3.5 h-3.5 text-[#E8D198]" />;
                                        })()
                                    )}
                                    <span className="text-[10px] font-medium uppercase tracking-widest text-[#FAF8F5]/90">{item.text}</span>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
            <style>
                {`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-10%); }
                }
                .animate-marquee {
                    animation: marquee 20s linear infinite;
                    display: flex;
                    width: max-content;
                }
            `}
            </style>
        </div>
    );
};

export default AnnouncementBar;
