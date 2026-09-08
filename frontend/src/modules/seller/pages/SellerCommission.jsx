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
import AdminTable from '../../admin/components/AdminTable';
import sellerCommissionService, { formatINR, commissionStatusTone } from '../services/sellerCommissionService';

const initialFilters = {
    orderNumber: '',
    type: '',
    status: '',
    from: '',
    to: '',
};

const Kpi = ({ label, value, icon: Icon, tone = 'text-gray-900', bg = 'bg-white' }) => (
    <div className={`${bg} rounded-[2rem] border border-gray-100 shadow-sm p-6`}>
        <div className="flex items-center justify-between">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
            {Icon && <Icon className="w-5 h-5 text-[#3E2723]" />}
        </div>
        <p className={`text-2xl font-black mt-3 tracking-tighter ${tone}`}>{value}</p>
    </div>
);

const TypePill = ({ value }) => {
    const map = {
        accrual:  'bg-blue-50 text-blue-700 border-blue-100',
        reversal: 'bg-rose-50 text-rose-700 border-rose-100',
        backfill: 'bg-violet-50 text-violet-700 border-violet-100',
    };
    return (
        <span className={`inline-block text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${map[value] || 'bg-gray-50 text-gray-600 border-gray-100'}`}>
            {value || '—'}
        </span>
    );
};

const StatusPill = ({ value }) => (
    <span className={`inline-block text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${commissionStatusTone(value)}`}>
        {value || 'none'}
    </span>
);

const SellerCommission = () => {
    const [summary, setSummary] = useState(null);
    const [summaryLoading, setSummaryLoading] = useState(true);

    const [filters, setFilters] = useState(initialFilters);
    const [appliedFilters, setAppliedFilters] = useState(initialFilters);
    const [page, setPage] = useState(1);
    const [limit] = useState(25);
    const [ledger, setLedger] = useState({ rows: [], pagination: { page: 1, pages: 1, total: 0 } });
    const [ledgerLoading, setLedgerLoading] = useState(true);

    const loadSummary = async () => {
        setSummaryLoading(true);
        const res = await sellerCommissionService.getSummary({
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
        if (appliedFilters.orderNumber) params.orderNumber = appliedFilters.orderNumber;
        if (appliedFilters.type)        params.type        = appliedFilters.type;
        if (appliedFilters.status)      params.status      = appliedFilters.status;
        if (appliedFilters.from)        params.from        = appliedFilters.from;
        if (appliedFilters.to)          params.to          = appliedFilters.to;

        const res = await sellerCommissionService.getLedger(params);
        if (res?.success) setLedger(res.data || { rows: [], pagination: {} });
        else toast.error(res?.message || 'Failed to load ledger');
        setLedgerLoading(false);
    };

    useEffect(() => { loadSummary(); /* eslint-disable-next-line */ }, [appliedFilters.from, appliedFilters.to]);
    useEffect(() => { loadLedger();  /* eslint-disable-next-line */ }, [appliedFilters, page]);

    const handleApplyFilters = () => {
        if (filters.from && filters.to && new Date(filters.from) > new Date(filters.to)) {
            toast.error("'To' Date cannot be before 'From' Date");
            return;
        }
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
                    <span className="text-[10px] font-black text-gray-900 uppercase">
                        {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—'}
                    </span>
                    <span className="text-[9px] font-bold text-gray-400 uppercase">
                        {row.createdAt ? new Date(row.createdAt).toLocaleTimeString() : ''}
                    </span>
                </div>
            ),
        },
        {
            header: 'ORDER',
            className: 'w-[18%]',
            render: (row) => (
                <Link
                    to={`/seller/order-details/${row.orderId}`}
                    className="text-[10px] font-black text-blue-600 hover:underline uppercase"
                >
                    {row.orderNumber || (row.orderId ? row.orderId.toString().slice(-8) : '—')}
                </Link>
            ),
        },
        {
            header: 'TIER',
            className: 'w-[18%]',
            render: (row) => <span className="text-[10px] font-bold text-gray-700">{row.tierLabel || '—'}</span>,
        },
        {
            header: 'SUBTOTAL',
            className: 'w-[12%]',
            render: (row) => <span className="text-[10px] font-bold text-gray-800">{formatINR(row.taxableAmount || row.sellerSubtotal)}</span>,
        },
        {
            header: 'AMOUNT',
            className: 'w-[12%]',
            render: (row) => (
                <span className={`text-[10px] font-black ${row.type === 'reversal' ? 'text-rose-600' : 'text-gray-900'}`}>
                    {row.type === 'reversal' ? '−' : ''}{formatINR(row.commissionAmount)}
                </span>
            ),
        },
        {
            header: 'TYPE',
            className: 'w-[12%]',
            render: (row) => <TypePill value={row.type} />,
        },
        {
            header: 'STATUS',
            className: 'w-[14%]',
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
        <div className="space-y-10 font-sans pb-20 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight text-left">Commission Statements</h1>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mt-1 text-left">
                        Every platform commission charged or reversed on your orders
                    </p>
                </div>
            </div>

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
                    label="Gross Charged"
                    value={summaryLoading ? '…' : formatINR(summary?.totals?.gross)}
                    icon={TrendingUp}
                    tone="text-blue-600"
                />
            </div>

            {/* Filters */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="w-4 h-4 text-[#3E2723]" />
                    <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-[0.2em]">Filters</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Order ID</label>
                        <input
                            type="text"
                            value={filters.orderNumber}
                            onChange={(e) => setFilters({ ...filters, orderNumber: e.target.value })}
                            placeholder="ORD-..."
                            className="mt-1 w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#3E2723]/40"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</label>
                        <select
                            value={filters.type}
                            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                            className="mt-1 w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#3E2723]/40"
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
                            className="mt-1 w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#3E2723]/40"
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
                            max={filters.to}
                            onChange={(e) => setFilters({ ...filters, from: e.target.value })}
                            className="mt-1 w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#3E2723]/40"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">To</label>
                        <input
                            type="date"
                            value={filters.to}
                            min={filters.from}
                            onChange={(e) => setFilters({ ...filters, to: e.target.value })}
                            className="mt-1 w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#3E2723]/40"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                    <button
                        onClick={handleClearFilters}
                        className="px-4 py-2 rounded-xl border border-gray-200 text-[10px] font-black uppercase tracking-widest text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                        <RefreshCcw className="w-3.5 h-3.5" />
                        Clear
                    </button>
                    <button
                        onClick={handleApplyFilters}
                        className="px-4 py-2 rounded-xl bg-[#3E2723] text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
                    >
                        <Search className="w-3.5 h-3.5" />
                        Apply
                    </button>
                </div>
            </div>

            {/* Ledger */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-[0.2em]">Commission Ledger</h3>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                        Append-only history of every charge and reversal on your account
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

export default SellerCommission;
