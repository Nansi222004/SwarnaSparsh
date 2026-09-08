import React, { useEffect, useState, useCallback } from 'react';
import {
    Wallet, TrendingUp, CreditCard, ArrowDownLeft, ArrowUpRight,
    Clock, CheckCircle, XCircle, RefreshCw, ChevronLeft, ChevronRight,
    AlertCircle, Ban, X, Send, Info
} from 'lucide-react';
import sellerPayoutService from '../services/sellerPayoutService';

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatINR = (v) => {
    const n = Number(v || 0);
    if (!Number.isFinite(n)) return '₹0';
    return '₹' + n.toLocaleString('en-IN');
};
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtDatetime = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const statusBadge = (status) => {
    const map = {
        PENDING:    'bg-amber-100 text-amber-800 border border-amber-200',
        PROCESSING: 'bg-blue-100 text-blue-800 border border-blue-200',
        APPROVED:   'bg-emerald-100 text-emerald-800 border border-emerald-200',
        REJECTED:   'bg-rose-100 text-rose-800 border border-rose-200',
    };
    return map[status] || 'bg-gray-100 text-gray-700 border border-gray-200';
};

const txnTypeClasses = (type) =>
    type === 'CREDIT'
        ? 'text-emerald-600'
        : 'text-rose-600';

const reasonLabel = (reason) => {
    const map = {
        commission_confirmed: 'Commission Credited',
        commission_reversed:  'Commission Reversed',
        payout_requested:     'Payout Requested',
        payout_rejected:      'Payout Refunded (Rejected)',
        payout_cancelled:     'Payout Cancelled',
        payout_approved:      'Payout Approved',
    };
    return map[reason] || reason;
};

// ── Sub-components ────────────────────────────────────────────────────────────
const KpiCard = ({ icon: Icon, label, value, sub, accent }) => (
    <div className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-start gap-4 min-w-0`}>
        <div className={`p-3 rounded-xl shrink-0 ${accent}`}>
            <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider truncate">{label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5 tabular-nums">{value}</p>
            {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
    </div>
);

// ── Request Payout Modal ──────────────────────────────────────────────────────
const RequestPayoutModal = ({ wallet, onClose, onSuccess }) => {
    const [amount, setAmount]     = useState('');
    const [note,   setNote]       = useState('');
    const [loading, setLoading]   = useState(false);
    const [error,   setError]     = useState('');

    const maxAmount = wallet?.walletBalance || 0;
    const minAmount = wallet?.minPayoutAmount || 500;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const num = Number(amount);
        if (!num || num < minAmount) { setError(`Minimum payout amount is ₹${minAmount}`); return; }
        if (num > maxAmount)         { setError(`Amount exceeds available balance ₹${formatINR(maxAmount)}`); return; }
        setLoading(true);
        try {
            const res = await sellerPayoutService.createRequest({ amount: num, sellerNote: note });
            if (!res.success) { setError(res.message || 'Failed to submit request'); return; }
            onSuccess(res.data?.newBalance);
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Request Payout</h3>
                        <p className="text-sm text-gray-500 mt-0.5">Available: <span className="font-semibold text-emerald-600">{formatINR(maxAmount)}</span></p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Bank details reminder */}
                    <div className="flex items-start gap-3 bg-blue-50 rounded-xl p-4 border border-blue-100">
                        <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-blue-800">Bank Account on file</p>
                            {wallet?.bankAccount?.accountNumber ? (
                                <p className="text-xs text-blue-600 mt-0.5">
                                    A/C: •••• {wallet.bankAccount.accountNumber.slice(-4)}&nbsp;&nbsp;|&nbsp;&nbsp;IFSC: {wallet.bankAccount.ifscCode || '—'}
                                </p>
                            ) : (
                                <p className="text-xs text-blue-600 mt-0.5">No bank account added yet. Update your profile to add one.</p>
                            )}
                        </div>
                    </div>

                    {/* Amount input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount (₹)</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-lg">₹</span>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder={`Min ₹${minAmount}`}
                                min={minAmount}
                                max={maxAmount}
                                className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3E2723]/30 focus:border-[#3E2723] text-lg font-semibold"
                                required
                            />
                        </div>
                        <div className="flex justify-between mt-1.5">
                            <p className="text-xs text-gray-400">Min: {formatINR(minAmount)}</p>
                            <button type="button" onClick={() => setAmount(maxAmount)} className="text-xs text-[#3E2723] font-medium hover:underline">Withdraw all</button>
                        </div>
                    </div>

                    {/* Note */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Note to admin <span className="text-gray-400">(optional)</span></label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            rows={2}
                            placeholder="e.g. Urgent payment needed"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3E2723]/30 focus:border-[#3E2723] text-sm resize-none"
                        />
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 rounded-xl px-4 py-3 border border-rose-100">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3 pt-1">
                        <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-3 rounded-xl bg-[#3E2723] text-white font-medium hover:bg-[#4e342e] transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                        >
                            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            {loading ? 'Submitting…' : 'Submit Request'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const SellerWallet = () => {
    const [wallet,    setWallet]   = useState(null);
    const [txns,      setTxns]     = useState([]);
    const [requests,  setRequests] = useState([]);
    const [txnPage,   setTxnPage]  = useState(1);
    const [reqPage,   setReqPage]  = useState(1);
    const [txnMeta,   setTxnMeta]  = useState({});
    const [reqMeta,   setReqMeta]  = useState({});
    const [tab,       setTab]      = useState('transactions'); // 'transactions' | 'requests'
    const [loading,   setLoading]  = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [cancelling, setCancelling] = useState(null);

    const fetchWallet = useCallback(async () => {
        const res = await sellerPayoutService.getWallet();
        if (res.success) setWallet(res.data);
    }, []);

    const fetchTxns = useCallback(async (page = 1) => {
        const res = await sellerPayoutService.getTransactions({ page, limit: 15 });
        if (res.success) {
            setTxns(res.data.transactions || []);
            setTxnMeta(res.data.pagination || {});
        }
    }, []);

    const fetchRequests = useCallback(async (page = 1) => {
        const res = await sellerPayoutService.getMyRequests({ page, limit: 10 });
        if (res.success) {
            setRequests(res.data.requests || []);
            setReqMeta(res.data.pagination || {});
        }
    }, []);

    const loadAll = useCallback(async () => {
        setLoading(true);
        try {
            await Promise.all([fetchWallet(), fetchTxns(1), fetchRequests(1)]);
        } catch (err) {
            console.error("Error loading wallet details:", err);
        } finally {
            setLoading(false);
        }
    }, [fetchWallet, fetchTxns, fetchRequests]);

    useEffect(() => { loadAll(); }, [loadAll]);

    useEffect(() => { if (!loading) fetchTxns(txnPage); }, [txnPage]); // eslint-disable-line
    useEffect(() => { if (!loading) fetchRequests(reqPage); }, [reqPage]); // eslint-disable-line

    const handlePayoutSuccess = async (newBalance) => {
        setShowModal(false);
        setWallet((prev) => prev ? { ...prev, walletBalance: newBalance, canRequestPayout: false } : prev);
        await loadAll();
    };

    const handleCancelRequest = async (id) => {
        if (!window.confirm('Cancel this payout request? The amount will be refunded to your wallet.')) return;
        setCancelling(id);
        try {
            const res = await sellerPayoutService.cancelRequest(id);
            if (res.success) await loadAll();
            else alert(res.message || 'Failed to cancel');
        } catch {
            alert('Failed to cancel payout request');
        } finally {
            setCancelling(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-[#3E2723]/20 border-t-[#3E2723] rounded-full animate-spin" />
                    <p className="text-sm text-gray-400">Loading wallet…</p>
                </div>
            </div>
        );
    }

    const kpis = [
        {
            icon: Wallet,
            label: 'Available Balance',
            value: formatINR(wallet?.walletBalance),
            sub: wallet?.activePayout ? `₹${wallet.activePayout.amount?.toLocaleString('en-IN')} pending payout` : 'Ready to withdraw',
            accent: 'bg-[#3E2723]',
        },
        {
            icon: TrendingUp,
            label: 'Total Earned',
            value: formatINR(wallet?.totalCommissionsEarned),
            sub: 'All confirmed orders',
            accent: 'bg-emerald-500',
        },
        {
            icon: CreditCard,
            label: 'Total Paid Out',
            value: formatINR(wallet?.totalPaidOut),
            sub: 'Approved withdrawals',
            accent: 'bg-violet-500',
        },
    ];

    return (
        <>
            {showModal && (
                <RequestPayoutModal
                    wallet={wallet}
                    onClose={() => setShowModal(false)}
                    onSuccess={handlePayoutSuccess}
                />
            )}

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Wallet &amp; Payouts</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Manage your earnings and withdrawal requests</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        disabled={!wallet?.canRequestPayout}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#3E2723] text-white text-sm font-medium rounded-xl hover:bg-[#4e342e] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                    >
                        <ArrowUpRight className="w-4 h-4" />
                        Request Payout
                    </button>
                </div>

                {/* Active payout warning */}
                {wallet?.activePayout && (
                    <div className="flex items-start gap-3 bg-amber-50 rounded-2xl p-4 border border-amber-200">
                        <Clock className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-sm font-semibold text-amber-800">Active payout request</p>
                            <p className="text-xs text-amber-700 mt-0.5">
                                {formatINR(wallet.activePayout.amount)} — {wallet.activePayout.status} — submitted {fmtDate(wallet.activePayout.createdAt)}
                            </p>
                        </div>
                    </div>
                )}

                {/* Negative balance warning */}
                {(wallet?.walletBalance || 0) < 0 && (
                    <div className="flex items-start gap-3 bg-rose-50 rounded-2xl p-4 border border-rose-200">
                        <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-sm font-semibold text-rose-800">Balance temporarily negative</p>
                            <p className="text-xs text-rose-700 mt-0.5">
                                An order return or cancellation reversed a commission that was already credited to your wallet.
                                Your balance will recover automatically as new orders are delivered and commissions are confirmed.
                            </p>
                        </div>
                    </div>
                )}

                {/* KPI cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {kpis.map((k) => <KpiCard key={k.label} {...k} />)}
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="flex border-b border-gray-100">
                        {[
                            { key: 'transactions', label: 'Transaction History' },
                            { key: 'requests',     label: 'Payout Requests' },
                        ].map(({ key, label }) => (
                            <button
                                key={key}
                                onClick={() => setTab(key)}
                                className={`flex-1 py-3.5 text-sm font-medium transition-colors ${
                                    tab === key
                                        ? 'border-b-2 border-[#3E2723] text-[#3E2723]'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* ── Transaction History ── */}
                    {tab === 'transactions' && (
                        <div>
                            {txns.length === 0 ? (
                                <div className="py-16 text-center text-gray-400">
                                    <Wallet className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                    <p className="text-sm">No transactions yet</p>
                                </div>
                            ) : (
                                <>
                                    {/* Mobile cards */}
                                    <div className="block sm:hidden divide-y divide-gray-50">
                                        {txns.map((t) => (
                                            <div key={t._id} className="px-4 py-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 truncate">{reasonLabel(t.reason)}</p>
                                                        <p className="text-xs text-gray-400 mt-0.5">{fmtDatetime(t.createdAt)}</p>
                                                        {t.description && <p className="text-xs text-gray-400 mt-0.5 truncate">{t.description}</p>}
                                                    </div>
                                                    <div className={`text-sm font-bold shrink-0 tabular-nums ${txnTypeClasses(t.type)}`}>
                                                        {t.type === 'CREDIT' ? '+' : '−'}{formatINR(t.amount)}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.type === 'CREDIT' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                                        {t.type}
                                                    </span>
                                                    <span className="text-xs text-gray-400">Bal: {formatINR(t.balanceAfter)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Desktop table */}
                                    <div className="hidden sm:block overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                                                    <th className="text-left px-6 py-3 font-medium">Date</th>
                                                    <th className="text-left px-6 py-3 font-medium">Description</th>
                                                    <th className="text-center px-4 py-3 font-medium">Type</th>
                                                    <th className="text-right px-6 py-3 font-medium">Amount</th>
                                                    <th className="text-right px-6 py-3 font-medium">Balance</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {txns.map((t) => (
                                                    <tr key={t._id} className="hover:bg-gray-50/50 transition-colors">
                                                        <td className="px-6 py-3.5 text-gray-500 whitespace-nowrap">{fmtDatetime(t.createdAt)}</td>
                                                        <td className="px-6 py-3.5 text-gray-800">
                                                            <p className="font-medium">{reasonLabel(t.reason)}</p>
                                                            {t.description && <p className="text-xs text-gray-400 mt-0.5">{t.description}</p>}
                                                        </td>
                                                        <td className="px-4 py-3.5 text-center">
                                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${t.type === 'CREDIT' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                                                {t.type === 'CREDIT' ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                                                                {t.type}
                                                            </span>
                                                        </td>
                                                        <td className={`px-6 py-3.5 text-right font-bold tabular-nums ${txnTypeClasses(t.type)}`}>
                                                            {t.type === 'CREDIT' ? '+' : '−'}{formatINR(t.amount)}
                                                        </td>
                                                        <td className="px-6 py-3.5 text-right tabular-nums text-gray-700">{formatINR(t.balanceAfter)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination */}
                                    <Pagination meta={txnMeta} page={txnPage} setPage={setTxnPage} />
                                </>
                            )}
                        </div>
                    )}

                    {/* ── Payout Requests ── */}
                    {tab === 'requests' && (
                        <div>
                            {requests.length === 0 ? (
                                <div className="py-16 text-center text-gray-400">
                                    <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                    <p className="text-sm">No payout requests yet</p>
                                </div>
                            ) : (
                                <>
                                    {/* Mobile cards */}
                                    <div className="block sm:hidden divide-y divide-gray-50">
                                        {requests.map((r) => (
                                            <div key={r._id} className="px-4 py-4 space-y-2">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-900 tabular-nums">{formatINR(r.amount)}</p>
                                                        <p className="text-xs text-gray-400">{fmtDate(r.createdAt)}</p>
                                                    </div>
                                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusBadge(r.status)}`}>{r.status}</span>
                                                </div>
                                                {r.sellerNote && <p className="text-xs text-gray-500">"{r.sellerNote}"</p>}
                                                {r.adminNote  && <p className="text-xs text-gray-500">Admin: {r.adminNote}</p>}
                                                {r.status === 'PENDING' && (
                                                    <button
                                                        onClick={() => handleCancelRequest(r._id)}
                                                        disabled={cancelling === r._id}
                                                        className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 disabled:opacity-50"
                                                    >
                                                        <Ban className="w-3 h-3" />
                                                        {cancelling === r._id ? 'Cancelling…' : 'Cancel request'}
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Desktop table */}
                                    <div className="hidden sm:block overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                                                    <th className="text-left px-6 py-3 font-medium">Payout ID</th>
                                                    <th className="text-left px-6 py-3 font-medium">Date</th>
                                                    <th className="text-right px-6 py-3 font-medium">Amount</th>
                                                    <th className="text-center px-4 py-3 font-medium">Status</th>
                                                    <th className="text-left px-6 py-3 font-medium">Admin Note</th>
                                                    <th className="px-4 py-3" />
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {requests.map((r) => (
                                                    <tr key={r._id} className="hover:bg-gray-50/50 transition-colors">
                                                        <td className="px-6 py-3.5 font-mono text-xs text-gray-500">{r.payoutId}</td>
                                                        <td className="px-6 py-3.5 text-gray-500 whitespace-nowrap">{fmtDate(r.createdAt)}</td>
                                                        <td className="px-6 py-3.5 text-right font-bold tabular-nums text-gray-900">{formatINR(r.amount)}</td>
                                                        <td className="px-4 py-3.5 text-center">
                                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusBadge(r.status)}`}>
                                                                {r.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-3.5 text-gray-500 text-xs max-w-[200px] truncate">{r.adminNote || '—'}</td>
                                                        <td className="px-4 py-3.5">
                                                            {r.status === 'PENDING' && (
                                                                <button
                                                                    onClick={() => handleCancelRequest(r._id)}
                                                                    disabled={cancelling === r._id}
                                                                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                                                                    title="Cancel request"
                                                                >
                                                                    {cancelling === r._id
                                                                        ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                                                        : <XCircle className="w-3.5 h-3.5" />}
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <Pagination meta={reqMeta} page={reqPage} setPage={setReqPage} />
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

// ── Pagination ────────────────────────────────────────────────────────────────
const Pagination = ({ meta, page, setPage }) => {
    if (!meta?.pages || meta.pages <= 1) return null;
    return (
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <p className="text-xs text-gray-400">
                Showing {(page - 1) * meta.limit + 1}–{Math.min(page * meta.limit, meta.total)} of {meta.total}
            </p>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-gray-600 px-1">{page} / {meta.pages}</span>
                <button
                    onClick={() => setPage((p) => Math.min(meta.pages, p + 1))}
                    disabled={page === meta.pages}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default SellerWallet;
