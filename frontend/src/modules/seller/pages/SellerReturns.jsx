import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCcw, CheckCircle, XCircle, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminTable from '../../admin/components/AdminTable';
import { sellerOrderService } from '../services/sellerOrderService';

const SellerReturns = () => {
    const [returns, setReturns] = useState([]);
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('all');
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, totalItems: 0, totalPages: 1 });
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(t);
    }, [search]);

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, status]);

    useEffect(() => {
        const fetchReturns = async () => {
            try {
                const params = { page, limit };
                if (debouncedSearch) params.search = debouncedSearch;
                if (status !== 'all') params.status = status;
                const result = await sellerOrderService.getReturnsPaged(params);
                setReturns(result.returns || []);
                setPagination(result.pagination || { page, limit, totalItems: (result.returns || []).length, totalPages: 1 });
            } catch (err) {
                toast.error('Unable to load seller returns right now.');
            } finally {
                setLoading(false);
            }
        };
        fetchReturns();
    }, [page, limit, debouncedSearch, status]);

    const handleAction = async (id, status) => {
        if (isUpdating) return;
        setIsUpdating(true);
        const res = await sellerOrderService.processReturn(id, status);
        if (res.success) {
            const params = { page, limit };
            if (debouncedSearch) params.search = debouncedSearch;
            if (status !== 'all') params.status = status;
            const result = await sellerOrderService.getReturnsPaged(params);
            setReturns(result.returns || []);
            setPagination(result.pagination || { page, limit, totalItems: (result.returns || []).length, totalPages: 1 });
            toast.success(res.message || `Return ${status.toLowerCase()} successfully.`);
        } else {
            toast.error(res.message || 'Unable to process return right now.');
        }
        setIsUpdating(false);
    };

    const columns = [
        {
            header: 'ORDER ID',
            className: 'w-[15%]',
            render: (row) => (
                <span className="text-[10px] font-black text-gray-900 tracking-tight">{row.orderDisplayId}</span>
            )
        },
        {
            header: 'PRODUCT',
            className: 'w-[20%]',
            render: (row) => (
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-gray-900 uppercase truncate max-w-[180px]">{row.product}</span>
                    <span className="text-[9px] text-gray-400 font-bold uppercase">Barcode: {row.barcode}</span>
                </div>
            )
        },
        {
            header: 'CUSTOMER',
            accessor: 'customerName',
            className: 'w-[15%] text-[10px] font-black text-gray-900 uppercase'
        },
        {
            header: 'RETURN REASON',
            accessor: 'returnReason',
            className: 'w-[20%] text-[10px] text-gray-500 font-medium italic'
        },
        {
            header: 'STATUS',
            className: 'w-[15%]',
            render: (row) => (
                <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest border ${
                    row.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                    row.status === 'Rejected' ? 'bg-red-50 text-red-600 border-red-100' :
                    row.status === 'Refunded' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                    'bg-amber-50 text-amber-600 border-amber-100'
                }`}>
                    {String(row.status || '')}
                </span>
            )
        },
        {
            header: 'ACTIONS',
            className: 'w-[15%] text-right',
            render: (row) => (
                <div className="flex justify-end gap-2">
                    <button 
                        onClick={() => navigate(`/seller/return-details/${row.id}`)}
                        className="p-2 hover:bg-[#3E2723]/5 rounded-lg text-[#3E2723] transition-all border border-[#3E2723]/10 flex items-center gap-2 text-[8px] font-black uppercase tracking-widest"
                        title="View Full Case"
                    >
                        <Eye size={14} /> Full Detail
                    </button>
                    {row.status === 'Pending' && (
                        <>
                            <button 
                                onClick={() => handleAction(row.id, 'Approved')}
                                className="p-2 hover:bg-emerald-50 rounded-lg text-emerald-600 transition-all border border-emerald-100 flex items-center gap-2 text-[8px] font-black uppercase tracking-widest"
                                title="Approve"
                            >
                                <CheckCircle size={14} />
                            </button>
                            <button 
                                onClick={() => handleAction(row.id, 'Rejected')}
                                className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-all border border-red-100 flex items-center gap-2 text-[8px] font-black uppercase tracking-widest"
                                title="Reject"
                            >
                                    <XCircle size={14} />
                            </button>
                        </>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500 font-sans">
            <div>
                <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight text-left">CLAIM RESOLUTION</h1>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mt-1 text-left">Process and resolve customer return requests</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 md:p-6 border-b border-gray-100 bg-white flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
                    <div className="flex-1">
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by Return ID..."
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#8D6E63]/20"
                        />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-xs font-black uppercase tracking-widest text-gray-700"
                        >
                            <option value="all">All Status</option>
                            <option value="Pending">Pending</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                            <option value="Pickup Scheduled">Pickup Scheduled</option>
                            <option value="Refunded">Refunded</option>
                            <option value="Closed">Closed</option>
                        </select>
                    </div>
                </div>
                {loading ? (
                    <div className="px-6 py-20 text-center text-sm font-black uppercase tracking-widest text-gray-400">Loading return requests...</div>
                ) : (
                    <AdminTable
                        columns={columns}
                        data={returns}
                        emptyMessage="No return requests found"
                        pagination={{
                            ...pagination,
                            onPageChange: (next) => setPage(next)
                        }}
                    />
                )}
            </div>
        </div>
    );
};

export default SellerReturns;
