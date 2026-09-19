import React, { useEffect, useMemo, useState } from 'react';
import { Image as ImageIcon, Save, ArrowUp, ArrowDown, Sparkles, CheckCircle2, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '../../services/adminService';
import { Input } from '../common/FormControls';
import { useDraftState } from '../../hooks/useDraftState';

import ringsImg from '../../../user/assets/categories/rings.png';
import earringsImg from '../../../user/assets/categories/earrings.png';
import silverchainsImg from '../../../user/assets/categories/silverchains.png';
import braceletsImg from '../../../user/assets/categories/bracelets.png';

const DEFAULT_SILVER_ITEMS = [
    {
        id: 'silver-rings',
        itemId: 'silver-rings',
        name: '925 Silver Rings',
        label: '925 Silver Rings',
        tag: 'Everyday elegance in genuine sterling silver',
        image: ringsImg,
        path: '/shop?metal=silver&silver_type=925&category=finger-ring',
        sortOrder: 0
    },
    {
        id: 'silver-earrings',
        itemId: 'silver-earrings',
        name: '925 Silver Earrings',
        label: '925 Silver Earrings',
        tag: 'Timeless silver styles for every occasion',
        image: earringsImg,
        path: '/shop?metal=silver&silver_type=925&category=earrings',
        sortOrder: 1
    },
    {
        id: 'silver-chains',
        itemId: 'silver-chains',
        name: '925 Silver Chains & Necklaces',
        label: '925 Silver Chains & Necklaces',
        tag: 'Classic silver essentials',
        image: silverchainsImg,
        path: '/shop?metal=silver&silver_type=925&category=necklace',
        sortOrder: 2
    },
    {
        id: 'silver-bracelets',
        itemId: 'silver-bracelets',
        name: '925 Silver Bracelets',
        label: '925 Silver Bracelets',
        tag: 'Refined styles for everyday wear',
        image: braceletsImg,
        path: '/shop?metal=silver&silver_type=925&category=bracelet',
        sortOrder: 3
    }
];

const RECOMMENDED_IMAGE_SIZE = '1080 x 1080 px (1:1 Ratio)';

const ShopBySilverEditor = ({ sectionData, onSave, defaultSection = {} }) => {
    const initialSettings = useMemo(() => {
        const fallbackSettings = defaultSection?.settings || {};
        const currentSettings = sectionData?.settings || {};

        return {
            title: currentSettings.title || fallbackSettings.title || 'Shop by Silver',
            subtitle: currentSettings.subtitle || fallbackSettings.subtitle || 'Handcrafted 925 Sterling Silver',
            badge: currentSettings.badge || fallbackSettings.badge || 'Pure 925 Silver',
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

        if (raw.length >= 4) {
            return raw.slice(0, 4).map((item, index) => ({
                id: item.itemId || item.id || DEFAULT_SILVER_ITEMS[index].id,
                itemId: item.itemId || item.id || DEFAULT_SILVER_ITEMS[index].id,
                name: item.label || item.name || DEFAULT_SILVER_ITEMS[index].name,
                tag: item.tag || item.subtitle || DEFAULT_SILVER_ITEMS[index].tag,
                image: item.image || DEFAULT_SILVER_ITEMS[index].image,
                path: item.path || DEFAULT_SILVER_ITEMS[index].path,
                sortOrder: index
            }));
        }

        return DEFAULT_SILVER_ITEMS;
    }, [defaultSection?.items, sectionData?.items]);

    const [settings, setSettings] = useDraftState(
        `draft_settings_${sectionData?.sectionKey || sectionData?.id || 'shop-by-silver'}_${sectionData?.pageKey || 'home'}`,
        initialSettings
    );
    const [items, setItems] = useDraftState(
        `draft_items_${sectionData?.sectionKey || sectionData?.id || 'shop-by-silver'}_${sectionData?.pageKey || 'home'}`,
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
        toast.success('Category image updated');
    };

    const moveItem = (index, direction) => {
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= items.length) return;

        const next = [...items];
        const [moved] = next.splice(index, 1);
        next.splice(targetIndex, 0, moved);

        setItems(next.map((item, idx) => ({ ...item, sortOrder: idx })));
    };

    const handleResetDefaults = () => {
        setSettings(initialSettings);
        setItems(DEFAULT_SILVER_ITEMS);
        toast.success('Reset to default silver categories');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const payload = {
                ...sectionData,
                label: sectionData?.label || 'Shop by Silver (Silver Type Panel)',
                isActive: settings.enabled,
                sortOrder: sectionData?.sortOrder || 2.25,
                settings: {
                    ...(sectionData?.settings || {}),
                    title: settings.title.trim() || 'Shop by Silver',
                    subtitle: settings.subtitle.trim() || 'Handcrafted 925 Sterling Silver',
                    badge: settings.badge.trim() || 'Pure 925 Silver',
                    position: settings.position || 'right',
                    enabled: settings.enabled
                },
                items: items.map((item, index) => ({
                    itemId: item.itemId || item.id,
                    name: item.name.trim(),
                    label: item.name.trim(),
                    tag: item.tag.trim(),
                    image: item.image,
                    path: item.path.trim(),
                    sortOrder: index
                }))
            };

            await onSave(payload);
            toast.success('Shop by Silver panel saved successfully');
        } catch (err) {
            console.error('Failed to save Shop by Silver panel:', err);
            toast.error(err.response?.data?.message || 'Failed to save section changes');
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Header / Panel Configuration Card */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 mb-5 border-b border-stone-100 gap-4">
                    <div>
                        <div className="inline-flex items-center gap-2 text-stone-600 text-xs font-bold uppercase tracking-wider mb-1">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Silver Collection Integration</span>
                        </div>
                        <h2 className="text-xl font-serif font-bold text-stone-900">
                            Shop by Silver Type Panel
                        </h2>
                        <p className="text-xs text-stone-500 mt-0.5">
                            Displays genuine 925 sterling silver categories beside the Silver Collection Grid on the homepage.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={handleResetDefaults}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Reset Defaults
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                            Panel Title
                        </label>
                        <Input
                            type="text"
                            value={settings.title}
                            onChange={(e) => setSettings((prev) => ({ ...prev, title: e.target.value }))}
                            placeholder="Shop by Silver"
                            className="w-full"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                            Badge / Eyebrow Text
                        </label>
                        <Input
                            type="text"
                            value={settings.badge}
                            onChange={(e) => setSettings((prev) => ({ ...prev, badge: e.target.value }))}
                            placeholder="Pure 925 Silver"
                            className="w-full"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                            Subtitle / Tagline
                        </label>
                        <Input
                            type="text"
                            value={settings.subtitle}
                            onChange={(e) => setSettings((prev) => ({ ...prev, subtitle: e.target.value }))}
                            placeholder="Handcrafted 925 Sterling Silver"
                            className="w-full"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                            Desktop Panel Position
                        </label>
                        <select
                            value={settings.position}
                            onChange={(e) => setSettings((prev) => ({ ...prev, position: e.target.value }))}
                            className="w-full px-3.5 py-2 text-sm bg-white border border-stone-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#C59B27] transition-all"
                        >
                            <option value="right">Right Side (Beside 2x2 Category Grid)</option>
                            <option value="left">Left Side (Beside Lead Category)</option>
                        </select>
                        <p className="text-[11px] text-stone-400 mt-1">
                            Choose which side of the Silver Collection Grid the panel appears on desktop.
                        </p>
                    </div>
                </div>

                {/* Independent Visibility Toggle */}
                <div className="mt-6 pt-5 border-t border-stone-100 flex items-center justify-between">
                    <div>
                        <h4 className="text-sm font-semibold text-stone-900">Panel Visibility</h4>
                        <p className="text-xs text-stone-500">
                            When disabled, the Silver Collection Grid expands to a full 12-column layout.
                        </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={settings.enabled}
                            onChange={(e) => setSettings((prev) => ({ ...prev, enabled: e.target.checked }))}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-stone-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#141211]"></div>
                    </label>
                </div>
            </div>

            {/* Silver Category Options List */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-base font-serif font-bold text-stone-900">
                            Silver Categories ({items.length})
                        </h3>
                        <p className="text-xs text-stone-500">
                            Configure category label, description, image, and destination URL for each silver option.
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    {items.map((item, index) => (
                        <div
                            key={item.id}
                            className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded-xl border border-stone-200 bg-stone-50/50 hover:bg-stone-50 transition-colors gap-4"
                        >
                            {/* Left: Thumbnail & Reorder */}
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <div className="flex flex-col gap-1">
                                    <button
                                        type="button"
                                        onClick={() => moveItem(index, -1)}
                                        disabled={index === 0}
                                        className="p-1 text-stone-400 hover:text-stone-700 disabled:opacity-30 transition-colors"
                                        title="Move Up"
                                    >
                                        <ArrowUp className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => moveItem(index, 1)}
                                        disabled={index === items.length - 1}
                                        className="p-1 text-stone-400 hover:text-stone-700 disabled:opacity-30 transition-colors"
                                        title="Move Down"
                                    >
                                        <ArrowDown className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                {/* Thumbnail preview & upload button */}
                                <div className="relative group/thumb w-14 h-14 rounded-full p-0.5 bg-white border-2 border-stone-200 overflow-hidden shrink-0 shadow-xs">
                                    <img
                                        src={item.image}
                                        alt={item.name}
                                        className="w-full h-full object-cover rounded-full"
                                    />
                                    <label className="absolute inset-0 bg-black/50 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center cursor-pointer transition-opacity text-white">
                                        <ImageIcon className="w-4 h-4" />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => handleImageUpload(item.id, e.target.files?.[0])}
                                        />
                                    </label>
                                </div>

                                <div className="min-w-[120px]">
                                    <span className="text-xs font-serif font-bold text-stone-900 block">
                                        {item.name}
                                    </span>
                                    <span className="text-[10px] text-stone-500 font-sans">
                                        Slot #{index + 1}
                                    </span>
                                </div>
                            </div>

                            {/* Middle: Inputs */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1 w-full">
                                <div>
                                    <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-1">
                                        Category Label
                                    </label>
                                    <Input
                                        type="text"
                                        value={item.name}
                                        onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                                        className="w-full text-xs"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-1">
                                        Tagline / Description
                                    </label>
                                    <Input
                                        type="text"
                                        value={item.tag}
                                        onChange={(e) => updateItem(item.id, 'tag', e.target.value)}
                                        className="w-full text-xs"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-1">
                                        Destination URL
                                    </label>
                                    <Input
                                        type="text"
                                        value={item.path}
                                        onChange={(e) => updateItem(item.id, 'path', e.target.value)}
                                        className="w-full text-xs"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-4 p-3 bg-stone-50 rounded-xl border border-stone-200/60 text-[11px] text-stone-500 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                        Recommended Image Size: <strong>{RECOMMENDED_IMAGE_SIZE}</strong>. Swatches should clearly depict genuine 925 sterling silver jewelry.
                    </span>
                </div>
            </div>

            {/* Bottom Save Action Bar */}
            <div className="flex items-center justify-end gap-3 pt-2">
                <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#141211] text-[#FAF8F5] font-sans font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-stone-800 disabled:opacity-50 shadow-md hover:shadow-lg transition-all"
                >
                    <Save className="w-4 h-4 text-stone-300" />
                    <span>{saving ? 'Saving Changes...' : 'Save Silver Panel'}</span>
                </button>
            </div>
        </form>
    );
};

export default ShopBySilverEditor;
