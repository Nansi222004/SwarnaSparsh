import React, { useEffect, useState } from 'react';
import { Wallet, RefreshCcw } from 'lucide-react';
import sellerCommissionService, { formatINR, commissionStatusTone } from '../services/sellerCommissionService';

const StatusPill = ({ value }) => (
    <span className={`inline-block text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md border ${commissionStatusTone(value)}`}>
        {value || 'none'}
    </span>
);

const TypePill = ({ value }) => {
    const map = {
        accrual:  'bg-blue-50 text-blue-700 border-blue-100',
        reversal: 'bg-rose-50 text-rose-700 border-rose-100',
        backfill: 'bg-violet-50 text-violet-700 border-violet-100',
    };
    return (
        <span className={`inline-block text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${map[value] || 'bg-gray-50 text-gray-600 border-gray-100'}`}>
            {value || '—'}
        </span>
    );
};

/**
 * Seller-facing commission breakdown card. Shows:
 *   - The seller's net commission charged on this order
 *   - Gross subtotal − commission = Net payout (when sellerSubtotal is provided)
 *   - The full per-order ledger entries (this seller's slice only)
 */
const SellerCommissionCard = ({ orderId, sellerSubtotal = null }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState('');
    const [data, setData]       = useState(null);

    const load = async () => {
        if (!orderId) return;
        setLoading(true);
        setError('');
        try {
            const res = await sellerCommissionService.getForOrder(orderId);
            if (res?.success) setData(res.data);
            else setError(res?.message || 'Failed to load commission');
        } catch (e) {
            setError(e?.message || 'Failed to load commission');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); /* eslint-disable-next-line */ }, [orderId]);

    const netCommission = Number(data?.sellerCommission || 0);
    const status        = data?.sellerStatus || 'none';
    const rows          = data?.rows || [];

    const gross = sellerSubtotal !== null ? Number(sellerSubtotal) : null;
    const netPayout = gross !== null ? Math.max(0, gross - netCommission) : null;

    return (
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8 space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Wallet size={14} className="text-[#3E2723]" />
                    Platform Commission
                </h3>
                <button
                    onClick={load}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50"
                    title="Refresh"
                >
                    <RefreshCcw size={14} />
                </button>
            </div>

            {error && (
                <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
                    {error}
                </div>
            )}

            {loading ? (
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest py-2">Loading…</p>
            ) : (
                <>
                    {gross !== null ? (
                        <div className="space-y-4">
                            <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                                <span>Seller Subtotal</span>
                                <span className="text-gray-900">{formatINR(gross)}</span>
                            </div>
                            <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                                <span>Platform Commission</span>
                                <span className="text-rose-600">− {formatINR(netCommission)}</span>
                            </div>
                            <div className="pt-4 border-t border-gray-100 flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] font-black text-[#3E2723] uppercase tracking-[0.2em]">Your Net Payout</p>
                                    <StatusPill value={status} />
                                </div>
                                <span className="text-2xl font-black text-emerald-600 tracking-tighter">{formatINR(netPayout)}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Commission</p>
                                <p className="text-lg font-black text-rose-600 mt-1">{formatINR(netCommission)}</p>
                            </div>
                            <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</p>
                                <div className="mt-1.5"><StatusPill value={status} /></div>
                            </div>
                        </div>
                    )}

                    {rows.length === 0 ? (
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pt-2">
                            Commission for this order has not been recorded yet.
                        </p>
                    ) : (
                        <div className="border border-gray-100 rounded-2xl overflow-x-auto">
                            <table className="w-full min-w-[500px]">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        <th className="text-left text-[9px] font-black text-gray-400 uppercase tracking-widest py-2 px-3">Date</th>
                                        <th className="text-left text-[9px] font-black text-gray-400 uppercase tracking-widest py-2 px-3">Tier</th>
                                        <th className="text-right text-[9px] font-black text-gray-400 uppercase tracking-widest py-2 px-3">Amount</th>
                                        <th className="text-right text-[9px] font-black text-gray-400 uppercase tracking-widest py-2 px-3">Type / Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row) => (
                                        <tr key={row._id} className="border-b border-gray-50 last:border-0">
                                            <td className="py-2 px-3 text-[11px] font-semibold text-gray-700">
                                                {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—'}
                                            </td>
                                            <td className="py-2 px-3 text-[11px] font-semibold text-gray-700">
                                                {row.tierLabel || '—'}
                                            </td>
                                            <td className={`py-2 px-3 text-[11px] font-black text-right ${row.type === 'reversal' ? 'text-rose-600' : 'text-gray-900'}`}>
                                                {row.type === 'reversal' ? '−' : ''}{formatINR(row.commissionAmount)}
                                            </td>
                                            <td className="py-2 px-3 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <TypePill value={row.type} />
                                                    <StatusPill value={row.status} />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
                        Commission is tier-based on your post-discount subtotal in this order. Refunds, cancellations, and returns fully reverse it.
                    </p>
                </>
            )}
        </div>
    );
};

export default SellerCommissionCard;
