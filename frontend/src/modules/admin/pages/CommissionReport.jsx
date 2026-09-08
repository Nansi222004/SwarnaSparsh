import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    Wallet,
    Hourglass,
    Undo2,
    TrendingUp,
    Filter,
    RefreshCcw,
    Search,
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import AdminTable from '../components/AdminTable';
import adminCommissionService, { formatINR } from '../services/adminCommissionService';

const initialFilters = {
    sellerId: '',
    orderNumber: '',
    type: '',
    status: '',
    from: '',
    to: '',
};

const StatusPill = ({ value }) => {
    const map = {
        pending:   'bg-amber-50 text-amber-700',
        confirmed: 'bg-emerald-50 text-emerald-700',
        reversed:  'bg-rose-50 text-rose-700',
    };
    return (
        <span className={`inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${map[value] || 'bg-gray-100 text-gray-600'}`}>
            {value || '—'}
        </span>
    );
};

const TypePill = ({ value }) => {
    const map = {
        accrual:  'bg-blue-50 text-blue-700',
        reversal: 'bg-rose-50 text-rose-700',
        backfill: 'bg-violet-50 text-violet-700',
    };
    return (
        <span className={`inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${map[value] || 'bg-gray-100 text-gray-600'}`}>
            {value || '—'}
        </span>
    );
};

const Kpi = ({ label, value, icon: Icon, tone = 'text-gray-900', bg = 'bg-white' }) => (
    <div className={`${bg} rounded-2xl border border-gray-200 shadow-sm p-5`}>
        <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">{label}</p>
            {Icon && <Icon className="w-5 h-5 text-[#3E2723]" />}
        </div>
        <p className={`text-2xl md:text-3xl font-black mt-3 ${tone}`}>{value}</p>
    </div>
);

const CommissionReportPage = () => {
    const [summary, setSummary] = useState(null);
    const [summaryLoading, setSummaryLoading] = useState(true);

    const [filters, setFilters] = useState(initialFilters);
    const [appliedFilters, setAppliedFilters] = useState(initialFilters);
    const [page, setPage] = useState(1);
    const [limit] = useState(25);
    const [ledger, setLedger] = useState({ rows: [], pagination: { page: 1, pages: 1, total: 0, limit } });
    const [ledgerLoading, setLedgerLoading] = useState(true);

    const loadSummary = async () => {
        setSummaryLoading(true);
        const res = await adminCommissionService.getSummary({
            from: appliedFilters.from || undefined,
            to:   appliedFilters.to   || undefined,
        });
        if (res?.success) setSummary(res.data);
        else toast.error(res?.message || 'Failed to load summary');
        setSummaryLoading(false);
    };

    const loadLedger = async () => {
        setLedgerLoading(true);
        const params = { page, limit };
        if (appliedFilters.sellerId)    params.sellerId    = appliedFilters.sellerId;
        if (appliedFilters.orderNumber) params.orderNumber = appliedFilters.orderNumber;
        if (appliedFilters.type)        params.type        = appliedFilters.type;
        if (appliedFilters.status)      params.status      = appliedFilters.status;
        if (appliedFilters.from)        params.from        = appliedFilters.from;
        if (appliedFilters.to)          params.to          = appliedFilters.to;

        const res = await adminCommissionService.getLedger(params);
        if (res?.success) setLedger(res.data || { rows: [], pagination: {} });
        else toast.error(res?.message || 'Failed to load ledger');
        setLedgerLoading(false);
    };

    useEffect(() => { loadSummary(); /* eslint-disable-next-line */ }, [appliedFilters.from, appliedFilters.to]);
    useEffect(() => { loadLedger();  /* eslint-disable-next-line */ }, [appliedFilters, page]);

    const handleApplyFilters = () => {
        setPage(1);
        setAppliedFilters({ ...filters });
    };

    const handleClearFilters = () => {
        setFilters(initialFilters);
        setAppliedFilters(initialFilters);
        setPage(1);
    };

    const columns = useMemo(() => ([
        {
            header: 'CREATED',
            className: 'w-[14%]',
            render: (row) => (
                <div className="flex flex-col">
                    <span className="text-xs font-semibold text-black">
                        {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—'}
                    </span>
                    <span className="text-[10px] font-medium text-gray-400 mt-0.5">
                        {row.createdAt ? new Date(row.createdAt).toLocaleTimeString() : ''}
                    </span>
                </div>
            ),
        },
        {
            header: 'ORDER',
            className: 'w-[14%]',
            render: (row) => (
                <Link
                    to={`/admin/orders/${row.orderId}`}
                    className="text-xs font-bold text-blue-600 hover:underline"
                >
                    {row.orderNumber || row.orderId?.toString().slice(-8) || '—'}
                </Link>
            ),
        },
        {
            header: 'SELLER',
            className: 'w-[18%]',
            render: (row) => {
                const s = row.sellerId || {};
                const name = s.shopName || s.fullName || s.email || (typeof row.sellerId === 'string' ? row.sellerId.slice(-8) : '—');
                return (
                    <Link
                        to={`/admin/seller-details/${s._id || row.sellerId}`}
                        className="text-xs font-semibold text-gray-700 hover:underline"
                    >
                        {name}
                    </Link>
                );
            },
        },
        {
            header: 'TIER',
            className: 'w-[14%]',
            render: (row) => (
                <span className="text-xs font-semibold text-gray-700">
                    {row.tierLabel || '—'}
                </span>
            ),
        },
        {
            header: 'SUBTOTAL',
            className: 'w-[10%]',
            render: (row) => (
                <span className="text-xs font-semibold text-gray-800">
                    {formatINR(row.taxableAmount || row.sellerSubtotal)}
                </span>
            ),
        },
        {
            header: 'AMOUNT',
            className: 'w-[10%]',
            render: (row) => (
                <span className={`text-xs font-black ${row.type === 'reversal' ? 'text-rose-600' : 'text-gray-900'}`}>
                    {row.type === 'reversal' ? '−' : ''}{formatINR(row.commissionAmount)}
                </span>
            ),
        },
        {
            header: 'TYPE',
            className: 'w-[10%]',
            render: (row) => <TypePill value={row.type} />,
        },
        {
            header: 'STATUS',
            className: 'w-[10%]',
            render: (row) => <StatusPill value={row.status} />,
        },
    ]), []);

    const pagination = useMemo(() => ({
        page,
        limit,
        totalItems: ledger?.pagination?.total || 0,
        totalPages: ledger?.pagination?.pages || 1,
        onPageChange: (p) => setPage(Math.max(1, p)),
    }), [page, limit, ledger]);

    return (
        <div className="max-w-[1400px] mx-auto space-y-6 pb-20">
            <PageHeader
                title="Commission Report"
                subtitle="Platform commission accrued, confirmed, and reversed across all sellers"
            />

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Kpi
                    label="Confirmed (Net)"
                    value={summaryLoading ? '…' : formatINR(summary?.totals?.net)}
                    icon={Wallet}
                    tone="text-emerald-600"
                />
                <Kpi
                    label="Pending Pipeline"
                    value={summaryLoading ? '…' : formatINR(summary?.totals?.pending)}
                    icon={Hourglass}
                    tone="text-amber-600"
                />
                <Kpi
                    label="Reversed"
                    value={summaryLoading ? '…' : formatINR(summary?.totals?.reversed)}
                    icon={Undo2}
                    tone="text-rose-600"
                />
                <Kpi
                    label="Gross Accrued"
                    value={summaryLoading ? '…' : formatINR(summary?.totals?.gross)}
                    icon={TrendingUp}
                    tone="text-blue-600"
                />
            </div>

            {/* Top sellers */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide">Top Sellers by Confirmed Commission</h3>
                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mt-1">
                            Highest 10 within the selected date range
                        </p>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="text-left text-[10px] font-black text-gray-400 uppercase tracking-widest pb-2">Seller</th>
                                <th className="text-right text-[10px] font-black text-gray-400 uppercase tracking-widest pb-2">Confirmed</th>
                                <th className="text-right text-[10px] font-black text-gray-400 uppercase tracking-widest pb-2">Pending</th>
                                <th className="text-right text-[10px] font-black text-gray-400 uppercase tracking-widest pb-2">Reversed</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(summary?.topSellers || []).length === 0 && (
                                <tr>
                                    <td colSpan={4} className="py-6 text-center text-xs font-semibold text-gray-400 uppercase tracking-widest">
                                        {summaryLoading ? 'Loading…' : 'No data'}
                                    </td>
                                </tr>
                            )}
                            {(summary?.topSellers || []).map((s) => (
                                <tr key={s.sellerId} className="border-b border-gray-100 hover:bg-gray-50/40">
                                    <td className="py-3">
                                        <Link
                                            to={`/admin/seller-details/${s.sellerId}`}
                                            className="text-xs font-bold text-gray-800 hover:underline"
                                        >
                                            {s.name}
                                        </Link>
                                    </td>
                                    <td className="py-3 text-right text-xs font-black text-emerald-700">{formatINR(s.confirmed)}</td>
                                    <td className="py-3 text-right text-xs font-bold text-amber-600">{formatINR(s.pending)}</td>
                                    <td className="py-3 text-right text-xs font-bold text-rose-600">{formatINR(s.reversed)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="w-4 h-4 text-[#3E2723]" />
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide">Filters</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Order ID</label>
                        <input
                            type="text"
                            value={filters.orderNumber}
                            onChange={(e) => setFilters({ ...filters, orderNumber: e.target.value })}
                            placeholder="ORD-..."
                            className="mt-1 w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#3E2723]/40"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Seller ID</label>
                        <input
                            type="text"
                            value={filters.sellerId}
                            onChange={(e) => setFilters({ ...filters, sellerId: e.target.value })}
                            placeholder="Mongo ObjectId"
                            className="mt-1 w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#3E2723]/40"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</label>
                        <select
                            value={filters.type}
                            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                            className="mt-1 w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#3E2723]/40"
                        >
                            <option value="">All</option>
                            <option value="accrual">Accrual</option>
                            <option value="reversal">Reversal</option>
                            <option value="backfill">Backfill</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</label>
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            className="mt-1 w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#3E2723]/40"
                        >
                            <option value="">All</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="reversed">Reversed</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">From</label>
                        <input
                            type="date"
                            value={filters.from}
                            onChange={(e) => setFilters({ ...filters, from: e.target.value })}
                            className="mt-1 w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#3E2723]/40"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">To</label>
                        <input
                            type="date"
                            value={filters.to}
                            onChange={(e) => setFilters({ ...filters, to: e.target.value })}
                            className="mt-1 w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#3E2723]/40"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                    <button
                        onClick={handleClearFilters}
                        className="px-3 py-2 rounded-lg border border-gray-200 text-[11px] font-black uppercase tracking-widest text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                        <RefreshCcw className="w-3.5 h-3.5" />
                        Clear
                    </button>
                    <button
                        onClick={handleApplyFilters}
                        className="px-4 py-2 rounded-lg bg-[#3E2723] text-white text-[11px] font-black uppercase tracking-widest flex items-center gap-2"
                    >
                        <Search className="w-3.5 h-3.5" />
                        Apply
                    </button>
                </div>
            </div>

            {/* Ledger table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide">Commission Ledger</h3>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mt-1">
                        Append-only history of every accrual, reversal, and backfill entry
                    </p>
                </div>
                <AdminTable
                    columns={columns}
                    data={ledger?.rows || []}
                    emptyMessage={ledgerLoading ? 'Loading…' : 'No commission entries match the current filters'}
                    pagination={pagination}
                />
            </div>
        </div>
    );
};

export default CommissionReportPage;
