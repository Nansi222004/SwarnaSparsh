import React, { useEffect, useMemo, useState } from 'react';
import { Save, Coins, RefreshCcw } from 'lucide-react';
import PageHeader from '../../admin/components/common/PageHeader';
import { sellerService } from '../services/sellerService';
import toast from 'react-hot-toast';

const INITIAL_RATES = {
    gold10g: {
        k14: 0,
        k18: 0,
        k22: 0,
        k24: 0
    },
    silver10g: {
        sterling925: 0,
        silverOther: 0
    }
};

const formatCurrency = (value) => `Rs ${Number(value || 0).toLocaleString()}`;

const normalizeRatesFromApi = (rates = {}) => ({
    gold10g: {
        k14: Number(rates.gold10g?.k14) || 0,
        k18: Number(rates.gold10g?.k18) || 0,
        k22: Number(rates.gold10g?.k22) || 0,
        k24: Number(rates.gold10g?.k24) || 0
    },
    silver10g: {
        sterling925: Number(rates.silver10g?.sterling925) || 0,
        silverOther: Number(rates.silver10g?.silverOther) || 0
    }
});

const toPerGram = (value) => (Number(value || 0) / 10);
const toPerMilligram = (value) => toPerGram(value) / 1000;

const SellerMetalPricing = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [productCount, setProductCount] = useState(0);
    const [updatedAt, setUpdatedAt] = useState(null);
    const [gstRate, setGstRate] = useState(0);
    const [rates, setRates] = useState(INITIAL_RATES);

    const syncRates = (data) => {
        setRates(normalizeRatesFromApi(data?.metalRates || {}));
        setProductCount(Number(data?.sellerProductCount) || 0);
        setUpdatedAt(data?.updatedAt || null);
        setGstRate(Number(data?.gstRate) || 0);
    };

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const res = await sellerService.getMetalPricing();
            syncRates(res);
            setLoading(false);
        };
        load();
    }, []);

    const updateRate = (section, field, value) => {
        const numericValue = value === '' ? '' : Number(value);
        setRates((prev) => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: numericValue
            }
        }));
    };

    const handleSave = async () => {
        const allRates = [
            ...Object.values(rates.gold10g || {}),
            ...Object.values(rates.silver10g || {})
        ];
        if (allRates.some((value) => Number(value) < 0)) {
            toast.error('Metal rates cannot be negative');
            return;
        }

        setSaving(true);
        const res = await sellerService.updateMetalPricing({
            metalRates: {
                gold10g: {
                    k14: Number(rates.gold10g?.k14) || 0,
                    k18: Number(rates.gold10g?.k18) || 0,
                    k22: Number(rates.gold10g?.k22) || 0,
                    k24: Number(rates.gold10g?.k24) || 0
                },
                silver10g: {
                    sterling925: Number(rates.silver10g?.sterling925) || 0,
                    silverOther: Number(rates.silver10g?.silverOther) || 0
                }
            }
        });

        if (res.success) {
            const summary = res.data?.updateSummary || res.updateSummary;
            if (summary) {
                const count = summary.modifiedProducts || summary.processedProducts || 0;
                const variants = summary.processedVariants || 0;
                toast.success(`Metal pricing updated. Repriced ${count} products (${variants} variants).`);
                if (Array.isArray(summary.failedProductIds) && summary.failedProductIds.length > 0) {
                    toast.error(`Some products could not be repriced (${summary.failedProductIds.length}).`);
                }
            } else {
                toast.success('Metal pricing updated');
            }
            const refresh = await sellerService.getMetalPricing();
            syncRates(refresh);
        } else {
            toast.error(res.message || 'Failed to update metal pricing');
        }

        setSaving(false);
    };

    const cards = useMemo(() => ([
        {
            title: 'Seller-Owned Products',
            value: productCount,
            note: 'Only your products are repriced when you update seller metal rates.',
            icon: Coins
        },
        {
            title: 'Last Updated',
            value: updatedAt ? new Date(updatedAt).toLocaleDateString() : 'Not set',
            note: 'The latest time your seller metal rates were saved.',
            icon: RefreshCcw
        }
    ]), [productCount, updatedAt]);

    return (
        <div className="max-w-[1100px] mx-auto space-y-6 pb-20">
            <PageHeader title="Metal Pricing" subtitle="Update seller gold and silver rates for your products only" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cards.map((card) => (
                    <div key={card.title} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                        <div className="flex items-center justify-between">
                            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">{card.title}</p>
                            <card.icon className="w-5 h-5 text-[#3E2723]" />
                        </div>
                        <p className="text-3xl font-black text-gray-900 mt-3">{card.value}</p>
                        <p className="text-sm text-gray-500 mt-2">{card.note}</p>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-900">
                    Set your seller metal pricing per 10 grams. These rates apply only to your seller-owned products. Admin controls global GST separately in Tax Settings, and your current GST setting is {gstRate}%. Final product prices still include making charge, hidden charge, GST, and optional payment gateway charge based on each product configuration.
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Gold Rates (Per 10g)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">14 Karat</label>
                                <input
                                    type="number"
                                    value={rates.gold10g?.k14}
                                    onChange={(e) => updateRate('gold10g', 'k14', e.target.value)}
                                    onFocus={(e) => {
                                        if (e.target.value === '0' || Number(e.target.value) === 0) {
                                            updateRate('gold10g', 'k14', '');
                                        }
                                    }}
                                    onBlur={(e) => {
                                        if (e.target.value === '') {
                                            updateRate('gold10g', 'k14', 0);
                                        }
                                    }}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm font-bold text-gray-800 focus:outline-none focus:border-[#3E2723]/40"
                                    placeholder="0"
                                    disabled={loading}
                                />
                                <p className="text-[11px] text-gray-500">Per gram: {formatCurrency(toPerGram(rates.gold10g?.k14))}</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">18 Karat</label>
                                <input
                                    type="number"
                                    value={rates.gold10g?.k18}
                                    onChange={(e) => updateRate('gold10g', 'k18', e.target.value)}
                                    onFocus={(e) => {
                                        if (e.target.value === '0' || Number(e.target.value) === 0) {
                                            updateRate('gold10g', 'k18', '');
                                        }
                                    }}
                                    onBlur={(e) => {
                                        if (e.target.value === '') {
                                            updateRate('gold10g', 'k18', 0);
                                        }
                                    }}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm font-bold text-gray-800 focus:outline-none focus:border-[#3E2723]/40"
                                    placeholder="0"
                                    disabled={loading}
                                />
                                <p className="text-[11px] text-gray-500">Per gram: {formatCurrency(toPerGram(rates.gold10g?.k18))}</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">22 Karat</label>
                                <input
                                    type="number"
                                    value={rates.gold10g?.k22}
                                    onChange={(e) => updateRate('gold10g', 'k22', e.target.value)}
                                    onFocus={(e) => {
                                        if (e.target.value === '0' || Number(e.target.value) === 0) {
                                            updateRate('gold10g', 'k22', '');
                                        }
                                    }}
                                    onBlur={(e) => {
                                        if (e.target.value === '') {
                                            updateRate('gold10g', 'k22', 0);
                                        }
                                    }}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm font-bold text-gray-800 focus:outline-none focus:border-[#3E2723]/40"
                                    placeholder="0"
                                    disabled={loading}
                                />
                                <p className="text-[11px] text-gray-500">Per gram: {formatCurrency(toPerGram(rates.gold10g?.k22))}</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">24 Karat</label>
                                <input
                                    type="number"
                                    value={rates.gold10g?.k24}
                                    onChange={(e) => updateRate('gold10g', 'k24', e.target.value)}
                                    onFocus={(e) => {
                                        if (e.target.value === '0' || Number(e.target.value) === 0) {
                                            updateRate('gold10g', 'k24', '');
                                        }
                                    }}
                                    onBlur={(e) => {
                                        if (e.target.value === '') {
                                            updateRate('gold10g', 'k24', 0);
                                        }
                                    }}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm font-bold text-gray-800 focus:outline-none focus:border-[#3E2723]/40"
                                    placeholder="0"
                                    disabled={loading}
                                />
                                <p className="text-[11px] text-gray-500">Per gram: {formatCurrency(toPerGram(rates.gold10g?.k24))}</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Silver Rates (Per 10g)</h3>
                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">925 Sterling Silver</label>
                                <input
                                    type="number"
                                    value={rates.silver10g?.sterling925}
                                    onChange={(e) => updateRate('silver10g', 'sterling925', e.target.value)}
                                    onFocus={(e) => {
                                        if (e.target.value === '0' || Number(e.target.value) === 0) {
                                            updateRate('silver10g', 'sterling925', '');
                                        }
                                    }}
                                    onBlur={(e) => {
                                        if (e.target.value === '') {
                                            updateRate('silver10g', 'sterling925', 0);
                                        }
                                    }}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm font-bold text-gray-800 focus:outline-none focus:border-[#3E2723]/40"
                                    placeholder="0"
                                    disabled={loading}
                                />
                                <p className="text-[11px] text-gray-500">Per gram: {formatCurrency(toPerGram(rates.silver10g?.sterling925))}</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Silver (All Other)</label>
                                <input
                                    type="number"
                                    value={rates.silver10g?.silverOther}
                                    onChange={(e) => updateRate('silver10g', 'silverOther', e.target.value)}
                                    onFocus={(e) => {
                                        if (e.target.value === '0' || Number(e.target.value) === 0) {
                                            updateRate('silver10g', 'silverOther', '');
                                        }
                                    }}
                                    onBlur={(e) => {
                                        if (e.target.value === '') {
                                            updateRate('silver10g', 'silverOther', 0);
                                        }
                                    }}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm font-bold text-gray-800 focus:outline-none focus:border-[#3E2723]/40"
                                    placeholder="0"
                                    disabled={loading}
                                />
                                <p className="text-[11px] text-gray-500">Per gram: {formatCurrency(toPerGram(rates.silver10g?.silverOther))}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-xs text-gray-600">
                    Per milligram values are derived automatically from the per-10g rates: for example, 10g / 10 / 1000.
                    Current example: 18K per milligram is {formatCurrency(toPerMilligram(rates.gold10g?.k18))}.
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving || loading}
                    className="w-full md:w-auto px-6 py-3 rounded-xl bg-[#3E2723] text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-md disabled:opacity-60"
                >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Metal Pricing'}
                </button>
            </div>
        </div>
    );
};

export default SellerMetalPricing;

