import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Clock, RefreshCw, AlertCircle } from 'lucide-react';
import { useShop } from '../../../context/ShopContext';

const formatDate = (value) => {
    if (!value) return 'Pending';
    return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const ReplacementsPage = () => {
    const navigate = useNavigate();
    const { replacements } = useShop();
    const safeReplacements = Array.isArray(replacements) ? replacements : [];

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending':
            case 'Requested':
                return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'Approved':
                return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Pickup Scheduled':
            case 'Pickup Completed':
                return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'Replacement Shipped':
            case 'Delivered':
            case 'Closed':
                return 'bg-green-100 text-green-700 border-green-200';
            case 'Rejected':
                return 'bg-red-100 text-red-700 border-red-200';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    if (safeReplacements.length === 0) {
        return (
            <div className="bg-[#FAF8F5] min-h-screen py-12 flex flex-col items-center justify-center text-center px-4">
                <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mb-6 text-stone-400">
                    <RefreshCw size={32} />
                </div>
                <h2 className="text-2xl font-black text-[#141211] mb-2">No Replacements Yet</h2>
                <p className="text-stone-500 mb-8 max-w-sm">
                    You have not raised any replacement requests yet.
                </p>
                <Link to="/profile/orders" className="bg-[#141211] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#1C1917] hover:text-[#E8D198] transition-all shadow-lg hover:shadow-xl active:scale-95">
                    Go To My Orders
                </Link>
            </div>
        );
    }

    return (
        <div className="bg-[#FAF8F5] min-h-screen py-4 md:py-12">
            <div className="container mx-auto px-3 md:px-12">
                <div className="flex items-center gap-2 md:gap-4 mb-6 md:mb-10">
                    <button onClick={() => navigate('/profile/orders')} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors text-footerBg/70">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl md:text-3xl font-black text-footerBg uppercase tracking-tighter md:tracking-tight leading-none">Replacements</h1>
                        <p className="text-[8px] md:text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Manage Your Exchange Requests</p>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
                    {safeReplacements.map((request, index) => (
                        <div
                            key={request.id}
                            className="bg-white rounded-xl md:rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className="p-3 md:p-6">
                                <div className="flex flex-col gap-3">
                                    <div className="flex justify-between items-start gap-3">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono font-black text-footerBg text-sm md:text-lg tracking-tight">{request.displayId}</span>
                                                <span className={`text-[8px] md:text-[9px] font-black uppercase px-2 py-0.5 rounded-full border transition-all ${getStatusColor(request.status)}`}>
                                                    {request.status}
                                                </span>
                                            </div>
                                            <div className="text-[9px] md:text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                                                <Clock size={10} className="shrink-0" />
                                                {formatDate(request.requestDate)}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[8px] text-slate-300 font-black uppercase tracking-widest leading-none mb-1">Reason</p>
                                            <p className="text-[10px] md:text-xs font-bold text-slate-500 max-w-[140px] md:max-w-[220px] leading-tight">
                                                {request.reason || 'Reason shared with support'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="pt-1 flex flex-col gap-3">
                                        <button
                                            onClick={() => navigate(`/replacement/${request.id}`)}
                                            className="w-full md:w-fit md:ml-auto md:px-10 bg-slate-50 border border-slate-100 text-footerBg py-2.5 md:py-3 rounded-xl text-[9px] md:text-xs font-black uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 group hover:bg-footerBg hover:text-white"
                                        >
                                            View Status
                                            <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
                                        </button>

                                        {request.status === 'Pending' && (
                                            <div className="flex gap-2 items-center text-[8px] md:text-[10px] text-slate-300 font-bold uppercase tracking-tight justify-center md:justify-end">
                                                <AlertCircle size={10} className="text-blue-400 shrink-0" />
                                                Reviewing your request shortly.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ReplacementsPage;
