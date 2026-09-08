import React, { useEffect, useState } from 'react';
import { Wallet, RefreshCcw } from 'lucide-react';
import adminCommissionService, { formatINR } from '../services/adminCommissionService';

const StatusBadge = ({ value }) => {
    const tones = {
        none:      'bg-gray-100 text-gray-600',
        pending:   'bg-amber-50 text-amber-700',
        confirmed: 'bg-emerald-50 text-emerald-700',
        partial:   'bg-blue-50 text-blue-700',
        reversed:  'bg-rose-50 text-rose-700',
    };
    return (
        <span className={`inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${tones[value] || 'bg-gray-100 text-gray-600'}`}>
            {value || 'none'}
        </span>
    );
};

const TypePill = ({ value }) => {
    const tones = {
        accrual:  'bg-blue-50 text-blue-700',
        reversal: 'bg-rose-50 text-rose-700',
        backfill: 'bg-violet-50 text-violet-700',
    };
    return (
        <span className={`inline-block text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${tones[value] || 'bg-gray-100 text-gray-600'}`}>
            {value || '—'}
        </span>
    );
};

/**
 * Reusable admin commission card. Renders one of:
 *   - Order breakdown   (props.orderId)
 *   - Seller breakdown  (props.sellerId)
 *
 * Falls back to a denormalized commissionSummary if passed (for instant render).
 */
const CommissionBreakdownCard = ({ orderId, sellerId, commissionSummary = null, dense = false }) => {
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState('');
    const [order, setOrder]         = useState(null);
    const [rows, setRows]           = useState([]);
    const [sellerTotals, setSellerTotals] = useState(null);

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            if (orderId) {
                const res = await adminCommissionService.getForOrder(orderId);
                if (res?.success) {
                    setOrder(res.data?.order || null);
                    setRows(res.data?.rows || []);
                } else {
                    setError(res?.message || 'Failed to load commission');
                }
            } else if (sellerId) {
                const res = await adminCommissionService.getForSeller(sellerId, { limit: 10, page: 1 });
                if (res?.success) {
                    setSellerTotals(res.data?.totals || null);
                    setRows(res.data?.rows || []);
                } else {
                    setError(res?.message || 'Failed to load commission');
                }
            }
        } catch (e) {
            setError(e?.message || 'Failed to load commission');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (orderId || sellerId) load();
        else setLoading(false);
        /* eslint-disable-next-line */
    }, [orderId, sellerId]);

    const totalConfirmed = sellerTotals?.confirmed ?? 0;
    const totalPending   = sellerTotals?.pending   ?? 0;
    const totalReversed  = sellerTotals?.reversed  ?? 0;

    const orderTotal     = order?.commissionSummary?.totalCommission ?? commissionSummary?.totalCommission ?? 0;
    const orderStatus    = order?.commissionSummary?.status ?? commissionSummary?.status ?? 'none';

    return (
        <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${dense ? 'p-4' : 'p-6'} space-y-4`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Wallet size={16} className="text-[#3E2723]" />
                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Platform Commission</h3>
                </div>
                <button
                    onClick={load}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50"
                    title="Refresh"
                >
                    <RefreshCcw size={14} />
                </button>
            </div>

            {error && (
                <div className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
                    {error}
                </div>
            )}

            {loading ? (
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest py-2">Loading…</p>
            ) : (
                <>
                    {/* Header totals */}
                    {orderId ? (
                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-xl bg-gray-50 border border-gray-100 px-3 py-2.5">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Commission</p>
                                <p className="text-lg font-black text-gray-900 mt-0.5">{formatINR(orderTotal)}</p>
                            </div>
                            <div className="rounded-xl bg-gray-50 border border-gray-100 px-3 py-2.5">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</p>
                                <div className="mt-1"><StatusBadge value={orderStatus} /></div>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-3">
                            <div className="rounded-xl bg-gray-50 border border-gray-100 px-3 py-2.5">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Confirmed</p>
                                <p className="text-base font-black text-emerald-600 mt-0.5">{formatINR(totalConfirmed)}</p>
                            </div>
                            <div className="rounded-xl bg-gray-50 border border-gray-100 px-3 py-2.5">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pending</p>
                                <p className="text-base font-black text-amber-600 mt-0.5">{formatINR(totalPending)}</p>
                            </div>
                            <div className="rounded-xl bg-gray-50 border border-gray-100 px-3 py-2.5">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Reversed</p>
                                <p className="text-base font-black text-rose-600 mt-0.5">{formatINR(totalReversed)}</p>
                            </div>
                        </div>
                    )}

                    {/* Ledger entries */}
                    {rows.length === 0 ? (
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest text-center py-3">
                            No commission entries
                        </p>
                    ) : (
                        <div className="border border-gray-100 rounded-xl overflow-hidden">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        <th className="text-left text-[9px] font-black text-gray-400 uppercase tracking-widest py-2 px-3">Date</th>
                                        {!orderId && <th className="text-left text-[9px] font-black text-gray-400 uppercase tracking-widest py-2 px-3">Order</th>}
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
                                            {!orderId && (
                                                <td className="py-2 px-3 text-[11px] font-semibold text-blue-600">
                                                    {row.orderNumber || row.orderId?.toString().slice(-6) || '—'}
                                                </td>
                                            )}
                                            <td className="py-2 px-3 text-[11px] font-semibold text-gray-700">
                                                {row.tierLabel || '—'}
                                            </td>
                                            <td className={`py-2 px-3 text-[11px] font-black text-right ${row.type === 'reversal' ? 'text-rose-600' : 'text-gray-900'}`}>
                                                {row.type === 'reversal' ? '−' : ''}{formatINR(row.commissionAmount)}
                                            </td>
                                            <td className="py-2 px-3 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <TypePill value={row.type} />
                                                    <StatusBadge value={row.status} />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default CommissionBreakdownCard;
