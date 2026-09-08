import React, { useEffect, useMemo, useState } from 'react';
import {
    Star, Search, CheckCircle2,
    XCircle, Trash2, Eye, EyeOff,
    MessageSquare, Clock
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import AdminStatsCard from '../components/AdminStatsCard';
import { adminService } from '../services/adminService';
import toast from 'react-hot-toast';

const STATUS_LABELS = {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected'
};

const ReviewModeration = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');

    const loadReviews = async () => {
        setLoading(true);
        try {
            const status = filterStatus === 'All' ? undefined : filterStatus.toLowerCase();
            const data = await adminService.getReviews({
                status,
                search: searchTerm || undefined
            });
            setReviews(data || []);
        } catch (err) {
            toast.error("Failed to load reviews");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeout = setTimeout(() => {
            loadReviews();
        }, 250);
        return () => clearTimeout(timeout);
    }, [filterStatus, searchTerm]);

    const handleStatusMove = async (id, action) => {
        const response = await adminService.updateReviewStatus(id, action);
        if (response?.success) {
            toast.success(response.message || "Review updated");
            loadReviews();
        } else {
            toast.error(response?.message || "Failed to update review");
        }
    };

    const deleteReview = async (id) => {
        if (!window.confirm('Are you sure you want to permanently delete this review?')) return;
        const response = await adminService.deleteReview(id);
        if (response?.success) {
            toast.success(response.message || "Review deleted");
            loadReviews();
        } else {
            toast.error(response?.message || "Failed to delete review");
        }
    };

    const filteredReviews = useMemo(() => reviews, [reviews]);

    const stats = useMemo(() => ({
        total: reviews.length,
        pending: reviews.filter((review) => review.status === 'pending').length,
        approved: reviews.filter((review) => review.status === 'approved').length
    }), [reviews]);

    const statusStyles = {
        approved: 'bg-green-50 text-green-700 border-green-100',
        rejected: 'bg-red-50 text-red-700 border-red-100',
        pending: 'bg-blue-50 text-blue-700 border-blue-100'
    };

    return (
        <div className="max-w-[1400px] mx-auto space-y-3 md:space-y-4 animate-in fade-in duration-500 pb-20 font-sans">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-1 px-1">
                <PageHeader
                    title="Reviews"
                    subtitle="Moderate product feedback"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <AdminStatsCard
                    label="All Reviews"
                    value={stats.total}
                    icon={MessageSquare}
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
                    label="Approved"
                    value={stats.approved}
                    icon={CheckCircle2}
                    color="text-emerald-600"
                    bgColor="bg-emerald-50"
                />
            </div>

            <div className="bg-white p-3 md:p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-3 md:gap-4 items-center justify-between">
                <div className="flex flex-col md:flex-row flex-1 gap-3 w-full">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search reviews..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs md:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#3E2723]/10 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200 overflow-x-auto scrollbar-hide">
                        {['All', 'Pending', 'Approved', 'Rejected'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-3 md:px-4 py-1.5 text-[10px] md:text-xs font-bold rounded-md transition-all whitespace-nowrap ${filterStatus === status
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white border-b border-gray-200">
                            <tr>
                                <th className="px-4 md:px-6 py-4 text-gray-800 font-bold uppercase tracking-widest text-[10px] md:text-xs">Review</th>
                                <th className="px-4 md:px-6 py-4 text-gray-800 font-bold uppercase tracking-widest text-[10px] md:text-xs">Customer</th>
                                <th className="px-4 md:px-6 py-4 text-gray-800 font-bold uppercase tracking-widest text-[10px] md:text-xs">Product</th>
                                <th className="px-4 md:px-6 py-4 text-gray-800 font-bold uppercase tracking-widest text-[10px] md:text-xs w-[40%]">Comment</th>
                                <th className="px-4 md:px-6 py-4 text-gray-800 font-bold uppercase tracking-widest text-[10px] md:text-xs text-center">Status</th>
                                <th className="px-4 md:px-6 py-4 text-gray-800 font-bold uppercase tracking-widest text-[10px] md:text-xs text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 uppercase tracking-tighter text-[10px] md:text-[11px] text-gray-900">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                                        Loading reviews...
                                    </td>
                                </tr>
                            ) : filteredReviews.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                                        No reviews found
                                    </td>
                                </tr>
                            ) : filteredReviews.map((review) => (
                                <tr key={review._id} className="hover:bg-gray-50/30 transition-colors group">
                                    <td className="px-4 md:px-6 py-3 md:py-4">
                                        <div className="space-y-1">
                                            <div className="flex gap-0.5">
                                                {[...Array(5)].map((_, index) => (
                                                    <Star
                                                        key={index}
                                                        className={`w-2.5 h-2.5 md:w-3 md:h-3 ${index < review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
                                                    />
                                                ))}
                                            </div>
                                            <p className="text-[8px] md:text-[10px] font-bold text-gray-400">
                                                {new Date(review.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-4 md:px-6 py-3 md:py-4">
                                        <div className="flex items-center gap-2 md:gap-3">
                                            <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-[#F5F0EB] flex items-center justify-center text-[#8D6E63] font-bold text-[10px] md:text-xs border border-[#EFEBE9] shrink-0">
                                                {(review.userId?.name || 'U').charAt(0)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-gray-900 truncate">{review.userId?.name || 'Unknown user'}</p>
                                                <p className="text-[9px] md:text-[10px] font-bold text-gray-400 lowercase truncate">{review.userId?.email || review.userId?.phone || ''}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 md:px-6 py-3 md:py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 p-1 shrink-0">
                                                {review.productId?.images?.[0] ? (
                                                    <img src={review.productId.images[0]} alt="" className="w-full h-full object-contain mix-blend-multiply" />
                                                ) : null}
                                            </div>
                                            <p className="font-bold text-gray-600 truncate max-w-[160px]">{review.productId?.name || 'Unknown product'}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 md:px-6 py-3 md:py-4">
                                        <p className="text-xs text-gray-600 font-bold leading-relaxed line-clamp-2 md:line-clamp-none normal-case">
                                            {review.body}
                                        </p>
                                    </td>
                                    <td className="px-4 md:px-6 py-3 md:py-4 text-center">
                                        <div className="flex flex-col items-center gap-1">
                                            <span className={`px-2 py-0.5 rounded text-[8px] md:text-[10px] font-bold border ${statusStyles[review.status] || statusStyles.pending}`}>
                                                {STATUS_LABELS[review.status] || 'Pending'}
                                            </span>
                                            <span className={`text-[8px] md:text-[9px] font-bold uppercase tracking-tight ${review.status === 'approved' ? 'text-green-600' : 'text-gray-400'}`}>
                                                {review.status === 'approved' ? 'Public' : 'Hidden'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 md:px-6 py-3 md:py-4">
                                        <div className="flex items-center justify-end gap-1 md:gap-2">
                                            {review.status !== 'approved' && (
                                                <button
                                                    onClick={() => handleStatusMove(review._id, 'approve')}
                                                    className="p-1.5 md:p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-all active:scale-95 shadow-sm"
                                                    title="Approve"
                                                >
                                                    <CheckCircle2 className="w-4 h-4" />
                                                </button>
                                            )}
                                            {review.status !== 'rejected' && (
                                                <button
                                                    onClick={() => handleStatusMove(review._id, 'reject')}
                                                    className="p-1.5 md:p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all active:scale-95 shadow-sm"
                                                    title="Reject"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                </button>
                                            )}
                                            {review.status !== 'pending' && (
                                                <button
                                                    onClick={() => handleStatusMove(review._id, 'pending')}
                                                    className={`p-1.5 md:p-2 rounded-lg transition-all active:scale-95 shadow-sm ${review.status === 'approved'
                                                        ? 'bg-gray-100 text-gray-500'
                                                        : 'bg-[#3E2723]/10 text-[#3E2723]'
                                                        }`}
                                                    title="Move to Pending"
                                                >
                                                    {review.status === 'approved' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            )}
                                            <button
                                                onClick={() => deleteReview(review._id)}
                                                className="p-1.5 md:p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all active:scale-95"
                                                title="Delete review"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ReviewModeration;
