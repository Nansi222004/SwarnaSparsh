import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../../services/api';

const parseMarkerText = (text, defaultBold, defaultNormal) => {
    if (!text) return { bold: defaultBold, normal: defaultNormal };
    const parts = text.trim().split(/\s+/);
    if (parts.length <= 1) {
        return { bold: text, normal: '' };
    }
    const normal = parts[parts.length - 1];
    const bold = parts.slice(0, -1).join(' ');
    return { bold, normal };
};

const TrustMarkers = () => {
    const [settings, setSettings] = useState({
        purityText: '925 Fine Silver',
        warrantyText: '6-Month Warranty',
        safetyText: 'Skin Safe Jewellery',
        platingText: 'Lifetime Plating',
        returnPolicy: 'Easy Returns'
    });

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const res = await api.get('public/settings');
                if (res.data.success && res.data.data?.settings) {
                    setSettings(res.data.data.settings);
                    return;
                }
            } catch (err) {
                console.warn("Failed to fetch public settings from API, falling back to localStorage/defaults:", err.message);
            }

            const saved = localStorage.getItem('siteSettings');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    setSettings(prev => ({ ...prev, ...parsed }));
                } catch (e) {
                    console.error("Failed to parse siteSettings from localStorage", e);
                }
            }
        };

        loadSettings();
        window.addEventListener('storage', loadSettings);
        return () => window.removeEventListener('storage', loadSettings);
    }, []);

    const purity = parseMarkerText(settings.purityText, '925', 'Fine Silver');
    const warranty = parseMarkerText(settings.warrantyText, '6-Month', 'Warranty');
    const safety = parseMarkerText(settings.safetyText, 'Skin Safe', 'Jewellery');
    const plating = parseMarkerText(settings.platingText, 'Lifetime', 'Plating');
    const returns = parseMarkerText(settings.returnPolicy, 'Easy', 'Returns');

    const markers = [
        { id: 1, bold: purity.bold, normal: purity.normal },
        { id: 2, bold: warranty.bold, normal: warranty.normal },
        { id: 3, bold: safety.bold, normal: safety.normal },
        { id: 4, bold: plating.bold, normal: plating.normal },
        { id: 5, bold: returns.bold, normal: returns.normal }
    ];

    return (
        <section className="w-full bg-gradient-to-r from-[#FAF8F5] via-[#FFFDF9] to-[#FAF8F5] py-3 md:py-5 border-y border-[#E8DFD0]/60">
            <div className="container mx-auto px-4 max-w-[1400px]">
                <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:items-center md:justify-center md:gap-6">
                    {markers.map((marker, index) => (
                        <motion.div
                            key={marker.id}
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: index * 0.08 }}
                            className={`bg-white px-3 md:px-7 py-2 md:py-3 rounded-xl shadow-xs border border-[#E8DFD0]/70 hover:border-[#C59B27]/60 hover:shadow-sm flex items-center justify-center text-center whitespace-normal md:whitespace-nowrap group cursor-default transition-all duration-300 ${index === markers.length - 1 ? 'col-span-2' : ''}`}
                        >
                            <span className="text-[#141211] text-[12px] md:text-[14px] tracking-tight flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#C59B27] shrink-0 opacity-70 group-hover:scale-125 transition-transform" />
                                <span className="font-bold">{marker.bold}</span>{" "}
                                <span className="font-normal text-stone-600">{marker.normal}</span>
                            </span>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default TrustMarkers;
