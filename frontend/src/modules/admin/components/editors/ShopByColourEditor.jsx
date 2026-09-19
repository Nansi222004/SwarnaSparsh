import React, { useEffect, useMemo, useState } from 'react';
import { Image as ImageIcon, Save, ArrowUp, ArrowDown, Sparkles, CheckCircle2, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '../../services/adminService';
import { Input } from '../common/FormControls';
import { useDraftState } from '../../hooks/useDraftState';

import whiteImg from '../../../user/assets/gold_color_white.png';
import roseImg from '../../../user/assets/gold_color_rose.png';
import yellowImg from '../../../user/assets/gold_color_yellow.png';

const DEFAULT_TONE_ITEMS = [
    {
        id: 'colour-white-gold',
        itemId: 'colour-white-gold',
        name: 'White Gold',
        label: 'White Gold',
        tag: 'Pure Modern Brilliance',
        image: whiteImg,
        path: '/shop?metal=gold&tone=white-gold',
        sortOrder: 0
    },
    {
        id: 'colour-rose-gold',
        itemId: 'colour-rose-gold',
        name: 'Rose Gold',
        label: 'Rose Gold',
        tag: 'Warm Romantic Glow',
        image: roseImg,
        path: '/shop?metal=gold&tone=rose-gold',
        sortOrder: 1
    },
    {
        id: 'colour-gold',
        itemId: 'colour-gold',
        name: 'Gold',
        label: 'Gold',
        tag: 'Classic 22K Radiance',
        image: yellowImg,
        path: '/shop?metal=gold',
        sortOrder: 2
    }
];

const RECOMMENDED_IMAGE_SIZE = '1080 x 1080 px (1:1 Ratio)';

const ShopByColourEditor = ({ sectionData, onSave, defaultSection = {} }) => {
    const initialSettings = useMemo(() => {
        const fallbackSettings = defaultSection?.settings || {};
        const currentSettings = sectionData?.settings || {};

        return {
            title: currentSettings.title || fallbackSettings.title || 'Shop by Colour',
            subtitle: currentSettings.subtitle || fallbackSettings.subtitle || 'Choose Your Gold Tone',
            badge: currentSettings.badge || fallbackSettings.badge || 'Atelier Palette',
            position: currentSettings.position || fallbackSettings.position || 'right',
            enabled: currentSettings.enabled !== undefined 
                ? Boolean(currentSettings.enabled) 
                : (sectionData?.isActive !== false)
        };
    }, [defaultSection?.settings, sectionData?.settings, sectionData?.isActive]);

    const initialItems = useMemo(() => {
        const raw = Array.isArray(sectionData?.items) && sectionData.items.length > 0
            ? sectionData.items
            : (defaultSection?.items || []);

        // Filter out legacy plated/silver/oxidised items if present in old records
        const clean = raw.filter((it) => {
            const id = String(it.id || it.itemId || '').toLowerCase();
            const mk = String(it.metalKey || '').toLowerCase();
            const name = String(it.name || '').toLowerCase();
            return !id.includes('silver') && !id.includes('oxidised') && mk !== 'oxidised' && !name.includes('oxidised') && !name.includes('plated');
        });

        if (clean.length >= 3) {
            return clean.slice(0, 3).map((item, index) => ({
                id: item.itemId || item.id || DEFAULT_TONE_ITEMS[index].id,
                itemId: item.itemId || item.id || DEFAULT_TONE_ITEMS[index].id,
                name: item.label || item.name || DEFAULT_TONE_ITEMS[index].name,
                tag: item.tag || item.subtitle || DEFAULT_TONE_ITEMS[index].tag,
                image: item.image || DEFAULT_TONE_ITEMS[index].image,
                path: item.path || DEFAULT_TONE_ITEMS[index].path,
                sortOrder: index
            }));
        }

        return DEFAULT_TONE_ITEMS;
    }, [defaultSection?.items, sectionData?.items]);

    const [settings, setSettings] = useDraftState(
        `draft_settings_${sectionData?.sectionKey || sectionData?.id || 'shop-by-colour'}_${sectionData?.pageKey || 'home'}`,
        initialSettings
    );
    const [items, setItems] = useDraftState(
        `draft_items_${sectionData?.sectionKey || sectionData?.id || 'shop-by-colour'}_${sectionData?.pageKey || 'home'}`,
        initialItems
    );
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setSettings(initialSettings);
    }, [initialSettings]);

    const updateItem = (id, field, value) => {
        setItems((prev) => prev.map((item) => (
            item.id === id ? { ...item, [field]: value } : item
        )));
    };

    const handleImageUpload = async (id, file) => {
        if (!file) return;
        const uploadedUrl = await adminService.uploadSectionImage(file);
        if (!uploadedUrl) {
            toast.error('Image upload failed. Please try again.');
            return;
        }
        updateItem(id, 'image', uploadedUrl);
        toast.success('Swatch image updated');
    };

    const handleResetDefaultImage = (id, index) => {
        const defaultImg = DEFAULT_TONE_ITEMS[index]?.image || yellowImg;
        updateItem(id, 'image', defaultImg);
        toast.success('Reset to default tone swatch');
    };

    const moveItem = (index, direction) => {
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= items.length) return;

        setItems((prev) => {
            const next = [...prev];
            const temp = next[index];
            next[index] = next[targetIndex];
            next[targetIndex] = temp;
            return next;
        });
    };

    const handleSave = async () => {
        const missingImage = items.find((item) => !item.image);
        if (missingImage) {
            toast.error(`Please provide an image for ${missingImage.name || 'all colour options'}`);
            return;
        }

        setSaving(true);
        try {
            await onSave({
                label: 'Shop by Colour (Gold Tone Panel)',
                isActive: settings.enabled,
                settings: {
                    title: settings.title?.trim() || 'Shop by Colour',
                    subtitle: settings.subtitle?.trim() || 'Choose Your Gold Tone',
                    badge: settings.badge?.trim() || 'Atelier Palette',
                    position: settings.position || 'right',
                    enabled: settings.enabled
                },
                items: items.map((item, index) => ({
                    ...item,
                    itemId: item.itemId || item.id,
                    sortOrder: index
                }))
            });
            toast.success('Shop by Colour panel saved successfully');
        } catch (err) {
            console.error('Failed to save Shop by Colour:', err);
            toast.error(err?.response?.data?.message || err?.message || 'Failed to save section');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="px-6 md:px-8 py-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <div className="inline-flex items-center gap-2 mb-1 text-[#C59B27] text-xs font-bold uppercase tracking-widest">
                        <Sparkles size={14} />
                        <span>Gold Collection Integration</span>
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-[#3E2723]">Shop by Colour (Gold Tone Panel)</h3>
                    <p className="text-sm text-gray-500 mt-1 max-w-2xl">
                        Manage the luxury 3-tone colour panel displayed directly beside the Gold Collection Grid.
                        Changes here update the title, subtitle, swatches, labels, order, and position.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#3E2723] text-white font-semibold text-sm hover:bg-[#5a3d36] transition-colors disabled:opacity-60 shadow-sm"
                >
                    <Save size={16} />
                    {saving ? 'Saving...' : 'Save Section'}
                </button>
            </div>

            <div className="p-6 md:p-8 space-y-8">
                {/* 1. Panel General Settings */}
                <div className="rounded-2xl border border-[#EFE3DF] bg-[#FFFCFB] p-6 space-y-6">
                    <div className="flex items-center justify-between pb-3 border-b border-[#EFE3DF]">
                        <h4 className="text-sm font-bold text-[#3E2723] uppercase tracking-wider">
                            Panel Display & Visibility Settings
                        </h4>
                        <label className="inline-flex items-center gap-2.5 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.enabled}
                                onChange={(e) => setSettings((prev) => ({ ...prev, enabled: e.target.checked }))}
                                className="w-4 h-4 rounded text-[#3E2723] focus:ring-[#3E2723] cursor-pointer"
                            />
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                                {settings.enabled ? 'Panel Enabled' : 'Panel Disabled'}
                            </span>
                        </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <Input
                            label="Panel Title"
                            value={settings.title}
                            onChange={(e) => setSettings((prev) => ({ ...prev, title: e.target.value }))}
                            placeholder="Shop by Colour"
                        />
                        <Input
                            label="Panel Subtitle"
                            value={settings.subtitle}
                            onChange={(e) => setSettings((prev) => ({ ...prev, subtitle: e.target.value }))}
                            placeholder="Choose Your Gold Tone"
                        />
                        <Input
                            label="Eyebrow Badge"
                            value={settings.badge}
                            onChange={(e) => setSettings((prev) => ({ ...prev, badge: e.target.value }))}
                            placeholder="Atelier Palette"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                        <div>
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-2">
                                Display Position Beside Gold Collection Grid
                            </label>
                            <select
                                value={settings.position}
                                onChange={(e) => setSettings((prev) => ({ ...prev, position: e.target.value }))}
                                className="w-full bg-white border border-gray-200 rounded-xl py-2.5 px-3.5 text-sm focus:outline-none focus:border-[#3E2723] focus:ring-1 focus:ring-[#3E2723]/20"
                            >
                                <option value="right">Right Side beside Grid (Recommended / Default)</option>
                                <option value="left">Left Side before Grid</option>
                            </select>
                            <p className="text-[11px] text-gray-400 mt-1.5">
                                On desktop, the colour panel seamlessly docks beside the category cards. On mobile, it appears cleanly below.
                            </p>
                        </div>
                    </div>
                </div>

                {/* 2. The Three Gold Tone Options */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h4 className="text-base font-bold text-[#3E2723]">Gold Colour Tones</h4>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Exactly three tones (White Gold, Rose Gold, Gold) displayed with circular swatches and verified destination routes.
                            </p>
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                            3 of 3 Tones Active
                        </span>
                    </div>

                    <div className="grid grid-cols-1 gap-5">
                        {items.map((item, index) => (
                            <div
                                key={item.id}
                                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs hover:border-[#C59B27]/60 transition-all"
                            >
                                <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-full bg-[#3E2723] text-white text-xs font-bold flex items-center justify-center">
                                            {index + 1}
                                        </span>
                                        <span className="text-xs font-bold uppercase tracking-wider text-gray-800">
                                            {item.name || `Tone ${index + 1}`}
                                        </span>
                                    </div>

                                    {/* Reorder controls */}
                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => moveItem(index, -1)}
                                            disabled={index === 0}
                                            className="p-1.5 rounded-lg border border-gray-200 hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed text-stone-600 transition-colors"
                                            title="Move Up"
                                        >
                                            <ArrowUp size={14} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => moveItem(index, 1)}
                                            disabled={index === items.length - 1}
                                            className="p-1.5 rounded-lg border border-gray-200 hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed text-stone-600 transition-colors"
                                            title="Move Down"
                                        >
                                            <ArrowDown size={14} />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-[160px_minmax(0,1fr)] gap-6">
                                    {/* Swatch / Image upload */}
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="relative w-24 h-24 rounded-full border-2 border-[#E8DFD0] overflow-hidden bg-stone-50 shadow-inner">
                                            {item.image ? (
                                                <img
                                                    src={item.image}
                                                    alt={item.name}
                                                    className="w-full h-full object-cover rounded-full"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                    <ImageIcon size={24} />
                                                </div>
                                            )}
                                        </div>

                                        <label className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#3E2723] text-white text-[11px] font-bold uppercase tracking-wider hover:bg-[#2D1B18] transition-all cursor-pointer w-full text-center">
                                            <ImageIcon size={12} />
                                            <span>Change Swatch</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => handleImageUpload(item.id, e.target.files?.[0])}
                                            />
                                        </label>

                                        <button
                                            type="button"
                                            onClick={() => handleResetDefaultImage(item.id, index)}
                                            className="inline-flex items-center gap-1 text-[10px] text-stone-500 hover:text-[#3E2723] font-semibold"
                                        >
                                            <RotateCcw size={10} />
                                            <span>Reset Default</span>
                                        </button>
                                    </div>

                                    {/* Fields */}
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <Input
                                                label="Display Label"
                                                value={item.name}
                                                onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                                                placeholder="e.g. White Gold"
                                            />
                                            <Input
                                                label="Tagline / Subtitle"
                                                value={item.tag}
                                                onChange={(e) => updateItem(item.id, 'tag', e.target.value)}
                                                placeholder="e.g. Pure Modern Brilliance"
                                            />
                                        </div>

                                        <div>
                                            <Input
                                                label="Destination Filter URL"
                                                value={item.path}
                                                onChange={(e) => updateItem(item.id, 'path', e.target.value)}
                                                placeholder="/shop?metal=gold&tone=white-gold"
                                            />
                                            <p className="text-[11px] text-gray-400 mt-1">
                                                Verified route filtered for genuine gold tones without mixing unrelated or plated products.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShopByColourEditor;
