import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Input, Select } from '../common/FormControls';
import { useDraftState } from '../../hooks/useDraftState';

const ICON_OPTIONS = [
    { value: 'ShieldCheck', label: 'Shield Check (Certified / Lab)' },
    { value: 'Star', label: 'Star / Hallmark Assurance' },
    { value: 'RefreshCw', label: 'Refresh / Exchange & Buyback' },
    { value: 'Truck', label: 'Delivery / Insured Transit' },
    { value: 'Gem', label: 'Diamond / Conflict-Free' },
    { value: 'RotateCcw', label: 'Rotate / Easy Return' },
    { value: 'FileText', label: 'Report / Certificate Dossier' }
];

const DEFAULT_ITEMS = [
    { itemId: 'diamond-trust-1', name: '100% Certified', subtitle: 'Authentic Diamonds', iconName: 'ShieldCheck', image: '' },
    { itemId: 'diamond-trust-2', name: 'Lifetime Exchange', subtitle: '& Buyback Guarantee', iconName: 'RefreshCw', image: '' },
    { itemId: 'diamond-trust-3', name: 'Easy 15 Days Return', subtitle: 'No Questions Asked', iconName: 'RotateCcw', image: '' },
    { itemId: 'diamond-trust-4', name: 'Hallmark Purity', subtitle: 'BIS Stamped Assurance', iconName: 'Star', image: '' }
];

const DiamondTrustMarkersEditor = ({ sectionData, onSave }) => {
    const initialSettings = useMemo(() => {
        const s = sectionData?.settings || {};
        return {
            title: s.title || 'The Alankar Assurance',
            subtitle: s.subtitle || 'Every diamond comes with verified grading, lifetime care, and absolute purity',
            badge: s.badge || 'Certified Trust'
        };
    }, [sectionData?.settings]);

    const initialItems = useMemo(() => {
        const source = Array.isArray(sectionData?.items) && sectionData.items.length > 0
            ? sectionData.items
            : DEFAULT_ITEMS;

        return source.map((item, index) => {
            const fallback = DEFAULT_ITEMS[index] || DEFAULT_ITEMS[0];
            return {
                id: item.itemId || item.id || `diamond-trust-${index + 1}`,
                name: item.name || item.label || fallback.name,
                subtitle: item.subtitle || item.description || fallback.subtitle,
                iconName: item.iconName || item.iconKey || fallback.iconName,
                image: item.image || ''
            };
        });
    }, [sectionData?.items]);

    const [settings, setSettings] = useDraftState(
        `draft_settings_${sectionData?.sectionKey || 'diamond-trust-markers'}_diamond-collection`,
        initialSettings
    );
    const [items, setItems] = useDraftState(
        `draft_items_${sectionData?.sectionKey || 'diamond-trust-markers'}_diamond-collection`,
        initialItems
    );
    const [saving, setSaving] = useState(false);

    const updateItem = (id, field, value) => {
        setItems((prev) => prev.map((item) => (
            item.id === id ? { ...item, [field]: value } : item
        )));
    };

    const handleSettingChange = (field, value) => {
        setSettings((prev) => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        const normalizedItems = items.map((item, index) => ({
            itemId: item.id || `diamond-trust-${index + 1}`,
            name: String(item.name || '').trim(),
            label: String(item.name || '').trim(),
            subtitle: String(item.subtitle || '').trim(),
            description: String(item.subtitle || '').trim(),
            iconName: item.iconName || 'ShieldCheck',
            iconKey: item.iconName || 'ShieldCheck',
            image: item.image || '',
            sortOrder: index
        }));

        const invalid = normalizedItems.filter((item) => !item.name || !item.subtitle);
        if (invalid.length > 0) {
            toast.error('Each trust marker needs title and description before saving.');
            return;
        }

        setSaving(true);
        try {
            const result = await onSave({ items: normalizedItems, settings });
            if (result?.success !== false) {
                toast.success('Trust markers updated');
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header Settings */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-display text-base font-bold text-gray-800 mb-4 pb-2 border-b border-gray-50">
                    Trust Section Heading & Badge
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                        label="Section Badge"
                        value={settings.badge || ''}
                        onChange={(e) => handleSettingChange('badge', e.target.value)}
                        placeholder="e.g. Certified Trust"
                    />
                    <Input
                        label="Section Title"
                        value={settings.title || ''}
                        onChange={(e) => handleSettingChange('title', e.target.value)}
                        placeholder="e.g. The Alankar Assurance"
                    />
                    <Input
                        label="Section Subtitle"
                        value={settings.subtitle || ''}
                        onChange={(e) => handleSettingChange('subtitle', e.target.value)}
                        placeholder="e.g. Every diamond comes with verified grading..."
                    />
                </div>
            </div>

            {/* Marker Items List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                    <div>
                        <h3 className="font-display text-base font-bold text-gray-800">
                            Diamond Trust Credentials ({items.length})
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Configure authentic certifications, warranty, insured delivery, and purity guarantees.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-widest text-white bg-[#171717] hover:bg-[#C6A04A] transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Save All Changes'}
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {items.map((item, index) => (
                        <div key={item.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                                    Marker #{index + 1}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <Input
                                    label="Marker Title"
                                    value={item.name}
                                    onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                                    placeholder="e.g. 100% Certified"
                                />

                                <Input
                                    label="Description / Policy"
                                    value={item.subtitle}
                                    onChange={(e) => updateItem(item.id, 'subtitle', e.target.value)}
                                    placeholder="e.g. Authentic Diamonds"
                                />

                                <Select
                                    label="Icon"
                                    value={item.iconName}
                                    onChange={(e) => updateItem(item.id, 'iconName', e.target.value)}
                                    options={ICON_OPTIONS}
                                />

                                <Input
                                    label="Custom Image URL (Optional)"
                                    value={item.image || ''}
                                    onChange={(e) => updateItem(item.id, 'image', e.target.value)}
                                    placeholder="Leave empty for bundled asset"
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest text-white bg-[#171717] hover:bg-[#C6A04A] transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Save All Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DiamondTrustMarkersEditor;
