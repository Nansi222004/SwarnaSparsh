import React, { useEffect, useMemo, useState } from 'react';
import { Clock, Eye, IndianRupee, RotateCcw, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AdminStatsCard from '../components/AdminStatsCard';
import { adminService } from '../services/adminService';

const STATUS_STYLES = {
    Pending: 'bg-amber-50 text-amber-600 border border-amber-100',
    Approved: 'bg-blue-50 text-blue-600 border border-blue-100',
    Rejected: 'bg-red-50 text-red-600 border border-red-100',
    'Pickup Scheduled': 'bg-sky-50 text-sky-600 border border-sky-100',
    'Pickup Completed': 'bg-indigo-50 text-indigo-600 border border-indigo-100',
    'Refund Initiated': 'bg-violet-50 text-violet-600 border border-violet-100',
    Refunded: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
    Closed: 'bg-gray-100 text-gray-700 border border-gray-200'
};

const formatCurrency = (value) => `INR ${Number(value || 0).toLocaleString()}`;

const ReturnsPage = () => {
    const navigate = useNavigate();
    const [returns, setReturns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    useEffect(() => {
        const fetchReturns = async () => {
            try {
                const data = await adminService.getReturns();
                setReturns(data);
            } catch (err) {
                toast.error('Unable to load returns right now.');
            } finally {
                setLoading(false);
            }
        };

        fetchReturns();
    }, []);

    const filteredReturns = useMemo(() => {
        return returns.filter((ret) => {
            const search = searchTerm.trim().toLowerCase();
            const matchesSearch =
                !search ||
                String(ret.returnDisplayId || '').toLowerCase().includes(search) ||
                String(ret.orderDisplayId || '').toLowerCase().includes(search) ||
                String(ret.customerName || '').toLowerCase().includes(search) ||
                String(ret.reason || '').toLowerCase().includes(search);

            const matchesStatus = statusFilter === 'ALL' || ret.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [returns, searchTerm, statusFilter]);

    const stats = useMemo(() => ({
        total: returns.length,
        pending: returns.filter((ret) => ret.status === 'Pending').length,
        refunded: returns.filter((ret) => ret.status === 'Refunded').length
    }), [returns]);

    return (
        <div className="space-y-8 font-sans animate-in fade-in duration-500">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-tight">Return Management</h1>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mt-1">Manage return requests, pickup progress and refunds</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <AdminStatsCard
                    label="Total Requests"
                    value={stats.total}
                    icon={RotateCcw}
                    color="text-blue-600"
                    bgColor="bg-blue-50"
                />
                <AdminStatsCard
                    label="Pending"
                    value={stats.pending}
                    icon={Clock}
                    color="text-amber-600"
                    bgColor="bg-amber-50"
                />
                <AdminStatsCard
                    label="Refunded"
                    value={stats.refunded}
                    icon={IndianRupee}
                    color="text-emerald-600"
                    bgColor="bg-emerald-50"
                />
            </div>

            <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md w-full ml-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                    <input
                        type="text"
                        placeholder="Search by return ID, order ID, customer or reason..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-xl border-none text-xs font-bold text-gray-900 focus:ring-0 placeholder:text-gray-400"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-1 p-1 bg-gray-50 rounded-xl overflow-x-auto max-w-full">
                    {['ALL', 'Pending', 'Approved', 'Refund Initiated', 'Refunded', 'Rejected', 'Closed'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${statusFilter === status
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-400 hover:text-gray-600'
                            }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-[10px] md:text-xs font-bold text-gray-800 uppercase tracking-widest">Return ID</th>
                                <th className="px-6 py-4 text-[10px] md:text-xs font-bold text-gray-800 uppercase tracking-widest">Order ID</th>
                                <th className="px-6 py-4 text-[10px] md:text-xs font-bold text-gray-800 uppercase tracking-widest">Customer</th>
                                <th className="px-6 py-4 text-[10px] md:text-xs font-bold text-gray-800 uppercase tracking-widest">Reason</th>
                                <th className="px-6 py-4 text-[10px] md:text-xs font-bold text-gray-800 uppercase tracking-widest">Date</th>
                                <th className="px-6 py-4 text-[10px] md:text-xs font-bold text-gray-800 uppercase tracking-widest">Refund</th>
                                <th className="px-6 py-4 text-[10px] md:text-xs font-bold text-gray-800 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-[10px] md:text-xs font-bold text-gray-800 uppercase tracking-widest text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 uppercase tracking-tighter text-[10px] md:text-[11px] text-gray-900">
                            {loading && (
                                <tr>
                                    <td colSpan="8" className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center justify-center opacity-60">
                                            <RotateCcw size={40} className="text-gray-300 mb-4 animate-spin" />
                                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Loading return requests...</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {!loading && filteredReturns.map((ret) => (
                                <tr key={ret.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4 text-xs font-bold text-black">{ret.returnDisplayId}</td>
                                    <td className="px-6 py-4 text-xs font-bold text-gray-500">{ret.orderDisplayId}</td>
                                    <td className="px-6 py-4">
                                        <div className="text-xs font-bold text-black">{ret.customerName}</div>
                                        <div className="text-[10px] font-bold text-gray-400 mt-1">{ret.customerPhone || ret.customerEmail || 'No contact saved'}</div>
                                    </td>
                                    <td className="px-6 py-4 text-xs font-medium text-gray-500">{ret.reason}</td>
                                    <td className="px-6 py-4 text-xs font-bold text-gray-500">
                                        {new Date(ret.createdAt || ret.requestDate || ret.updatedAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-bold text-black">{formatCurrency(ret.refundAmount)}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${STATUS_STYLES[ret.status] || 'bg-gray-50 text-gray-600 border border-gray-100'}`}>
                                            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                            {ret.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => navigate(`/admin/returns/${ret.id}`)}
                                            className="inline-flex items-center gap-2 bg-[#0f172a] text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-gray-200 active:scale-95"
                                        >
                                            <Eye size={14} /> View
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {!loading && filteredReturns.length === 0 && (
                                <tr>
                                    <td colSpan="8" className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center justify-center opacity-50">
                                            <RotateCcw size={48} className="text-gray-300 mb-4" />
                                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No return requests found</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ReturnsPage;
