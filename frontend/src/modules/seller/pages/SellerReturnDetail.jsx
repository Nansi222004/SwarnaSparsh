import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft,
    AlertCircle,
    Box,
    CheckCircle,
    Image as ImageIcon,
    PlayCircle,
    User,
    XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { sellerOrderService } from '../services/sellerOrderService';

const SellerReturnDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [returnReq, setReturnReq] = useState(null);
    const [loading, setLoading] = useState(true);
    const [voidTagStatus, setVoidTagStatus] = useState('Pending');
    const [voidTagNotes, setVoidTagNotes] = useState('');

    useEffect(() => {
        let active = true;
        const fetchReturn = async () => {
            try {
                const data = await sellerOrderService.getReturnDetails(id);
                if (!active) return;
                setReturnReq(data);
            } catch (err) {
                toast.error('Unable to load this seller return right now.');
            } finally {
                if (active) setLoading(false);
            }
        };
        fetchReturn();
        return () => { active = false; };
    }, [id]);

    useEffect(() => {
        if (returnReq?.voidTagVerification) {
            setVoidTagStatus(returnReq.voidTagVerification.status || 'Pending');
            setVoidTagNotes(returnReq.voidTagVerification.notes || '');
        }
    }, [returnReq]);

    const returnHasVoidTag = Boolean((returnReq?.items || []).some((item) => String(item?.voidTagId || '').trim()));
    const primaryVoidTagId = (returnReq?.items || []).find((item) => String(item?.voidTagId || '').trim())?.voidTagId || '';

    const handleAction = async (status) => {
        if (returnHasVoidTag && !['Intact', 'Tampered', 'Missing'].includes(voidTagStatus)) {
            toast.error('Choose a seal verification result before processing this return.');
            return;
        }

        const res = await sellerOrderService.processReturn(id, status, '', voidTagStatus, voidTagNotes);
        if (res.success && res.data) {
            setReturnReq(res.data);
            toast.success(res.message || `Return ${status.toLowerCase()} successfully.`);
        } else {
            toast.error(res.message || 'Unable to process this return right now.');
        }
    };

    if (loading) return <div className="p-20 text-center text-gray-400 font-black uppercase tracking-widest animate-pulse">Analyzing Claim Assets...</div>;
    if (!returnReq) return <div className="p-20 text-center text-gray-400 font-black uppercase tracking-widest">Return Request Not Found</div>;

    const cardClasses = "bg-white rounded-[2.5rem] border border-gray-100 p-10 shadow-sm h-full";
    const sectionTitleClasses = "text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2";
    const labelClasses = "text-[9px] font-black text-gray-400 uppercase tracking-widest";
    const valueClasses = "text-sm font-bold text-gray-900 mt-1 uppercase";

    const statusTone = returnReq.status === 'Approved'
        ? 'text-emerald-500'
        : returnReq.status === 'Rejected'
            ? 'text-red-500'
            : 'text-amber-500';

    return (
        <div className="space-y-8 animate-in fade-in duration-500 font-sans pb-20">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/seller/returns')}
                        className="p-3 hover:bg-white rounded-2xl border border-gray-100 shadow-sm transition-all bg-gray-50/50"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Return Authorization #{returnReq.id}</h1>
                        <p className="text-[10px] font-black text-[#8D6E63] uppercase tracking-[0.2em] mt-2">Display ID: {returnReq.returnDisplayId}</p>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                            STATUS: <span className={`font-black ${statusTone}`}>{returnReq.status}</span>
                        </p>
                    </div>
                </div>

                <div className="flex gap-4">
                    {returnReq.status === 'Pending' && (
                        <>
                            <button
                                onClick={() => handleAction('Rejected')}
                                className="px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] border border-red-100 text-red-600 hover:bg-red-50 transition-all flex items-center gap-3 backdrop-blur-sm"
                            >
                                <XCircle size={18} /> Reject Claim
                            </button>
                            <button
                                onClick={() => handleAction('Approved')}
                                className="px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] bg-[#3E2723] text-white shadow-2xl shadow-[#3E2723]/20 hover:bg-[#2D1B18] transition-all flex items-center gap-3"
                            >
                                <CheckCircle size={18} /> Approve Claim
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className={cardClasses}>
                        <h3 className={sectionTitleClasses}><Box size={14} className="text-[#3E2723]" /> Return Specifications</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 p-6 bg-gray-50/50 rounded-3xl border border-gray-100/50 mb-10">
                            <div>
                                <p className={labelClasses}>Original Order</p>
                                <p className="text-lg font-black text-gray-900 mt-1 tracking-tight">#{returnReq.orderDisplayId}</p>
                            </div>
                            <div>
                                <p className={labelClasses}>Request Date</p>
                                <p className={valueClasses}>{new Date(returnReq.createdAt).toLocaleDateString()} {new Date(returnReq.createdAt).toLocaleTimeString()}</p>
                            </div>
                            <div>
                                <p className={labelClasses}>Item for Return</p>
                                <p className={valueClasses}>{returnReq.product}</p>
                                <p className="text-[10px] font-black text-[#8D6E63] mt-1">SN: {returnReq.barcode}</p>
                            </div>
                            <div>
                                <p className={labelClasses}>Unit Count</p>
                                <p className={valueClasses}>{returnReq.quantity} UNIT</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className={sectionTitleClasses}><AlertCircle size={14} className="text-amber-500" /> Client Feedback</h3>
                            <div className="p-8 bg-amber-50/30 rounded-3xl border border-amber-100/50">
                                <p className="text-sm font-bold text-gray-700 leading-relaxed italic">"{returnReq.returnReason}"</p>
                                {returnReq.comment ? (
                                    <p className="text-xs font-bold text-gray-500 leading-relaxed mt-4 not-italic">Customer note: {returnReq.comment}</p>
                                ) : null}
                            </div>
                        </div>
                    </div>

                    <div className={cardClasses}>
                        <h3 className={sectionTitleClasses}><PlayCircle size={14} className="text-blue-500" /> Verification Assets</h3>
                        <div className="space-y-8">
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <p className={labelClasses}>Inspection Video</p>
                                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[8px] font-black uppercase tracking-widest border border-blue-100">
                                        {returnReq.video360 ? 'Verified Upload' : 'No Video Uploaded'}
                                    </span>
                                </div>
                                <div className="relative aspect-video bg-black rounded-3xl overflow-hidden group shadow-2xl">
                                    {returnReq.video360 ? (
                                        <video
                                            src={returnReq.video360}
                                            controls
                                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-center px-8">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">No inspection video uploaded yet</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <p className={labelClasses}>Condition Images</p>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total: {returnReq.images?.length || 0} Assets</span>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                    {(returnReq.images || []).length > 0 ? (
                                        returnReq.images.map((img, idx) => (
                                            <div key={idx} className="aspect-square bg-gray-50 rounded-3xl overflow-hidden border border-gray-100 group cursor-zoom-in relative">
                                                <img src={img} alt="Evidence" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-tighter">View #{idx + 1}</div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="col-span-full rounded-3xl border border-dashed border-gray-200 bg-gray-50 p-10 text-center">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">No condition images uploaded yet</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <p className={labelClasses}>Security Seal (Void Tag) Evidence</p>
                                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                                        returnReq.voidTagVerification?.status === 'Intact'
                                            ? 'bg-green-50 text-green-600 border-green-100'
                                            : returnReq.voidTagVerification?.status === 'Pending' || !returnHasVoidTag
                                                ? 'bg-amber-50 text-amber-700 border-amber-100'
                                                : 'bg-red-50 text-red-600 border-red-100'
                                    }`}>
                                        {returnReq.voidTagVerification?.status || 'Verification Pending'}
                                    </span>
                                </div>
                                {returnHasVoidTag && (
                                    <p className="text-xs font-black text-amber-800 uppercase tracking-widest mb-4">
                                        Expected Seal ID: {primaryVoidTagId}
                                    </p>
                                )}
                                <div className="grid grid-cols-2 gap-6">
                                    {(returnReq.evidence?.voidTagImages || []).length > 0 ? (
                                        returnReq.evidence.voidTagImages.map((img, idx) => (
                                            <div key={idx} className="aspect-square bg-gray-50 rounded-3xl overflow-hidden border-2 border-amber-100 group cursor-zoom-in relative">
                                                <img src={img} alt="Void Tag Evidence" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                                <div className="absolute bottom-4 left-4 bg-amber-600 text-white px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-tighter shadow-lg">Security View #{idx + 1}</div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="col-span-full rounded-3xl border-2 border-dashed border-amber-200 bg-amber-50/30 p-10 text-center">
                                            <AlertCircle className="mx-auto text-amber-400 mb-2" size={24} />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">
                                                {returnHasVoidTag ? 'No security seal images provided by customer' : 'No security seal evidence attached to this return'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    {returnReq.status === 'Pending' && (
                        <div className={`${cardClasses} border-amber-100 bg-amber-50/20`}>
                            <h3 className={sectionTitleClasses}><CheckCircle size={14} className="text-amber-600" /> Security Check</h3>
                            <div className="space-y-6">
                                <div>
                                    <label className={labelClasses}>Seal Status Inspection</label>
                                    <select
                                        value={voidTagStatus}
                                        onChange={(e) => setVoidTagStatus(e.target.value)}
                                        className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3.5 mt-2 focus:ring-2 focus:ring-amber-200 outline-none transition-all text-xs font-black text-gray-900 uppercase"
                                    >
                                        <option value="Pending">Pending Verification</option>
                                        <option value="Intact">Verified: Tag is Intact</option>
                                        <option value="Tampered">Rejected: Tag is Tampered</option>
                                        <option value="Missing">Rejected: Tag is Missing</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClasses}>Inspection Notes</label>
                                    <textarea
                                        value={voidTagNotes}
                                        onChange={(e) => setVoidTagNotes(e.target.value)}
                                        rows="3"
                                        placeholder="Add notes about the seal condition..."
                                        className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3.5 mt-2 focus:ring-2 focus:ring-amber-200 outline-none transition-all text-xs font-bold"
                                    />
                                </div>
                                <div className="p-4 bg-white/50 rounded-2xl border border-amber-100">
                                    <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest leading-relaxed">
                                        Verification is mandatory before approving or rejecting. Your findings will be logged as evidence.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className={cardClasses}>
                        <h3 className={sectionTitleClasses}><User size={14} className="text-[#3E2723]" /> Customer Snapshot</h3>
                        <div className="space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-[#3E2723]/5 rounded-2xl flex items-center justify-center border border-[#3E2723]/10">
                                    <User size={24} className="text-[#3E2723]" />
                                </div>
                                <div>
                                    <p className="text-lg font-black text-gray-900 tracking-tight">{returnReq.customerName}</p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{returnReq.customerEmail || 'Email not available'}</p>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-gray-50 space-y-6">
                                <div>
                                    <p className={labelClasses}>Data Privacy</p>
                                    <p className="text-[10px] font-black text-gray-400 mt-1 uppercase italic tracking-widest">Phone number and address remain hidden for sellers</p>
                                </div>
                                <div>
                                    <p className={labelClasses}>Transaction Value</p>
                                    <p className="text-xl font-black text-[#3E2723] mt-1 tracking-tighter">Rs. {Number(returnReq.order?.total || 0).toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className={labelClasses}>Current Payment Status</p>
                                    <p className="text-sm font-black text-[#3E2723] mt-1 uppercase tracking-tight">{returnReq.order?.paymentStatus || 'Unknown'}</p>
                                </div>
                                <div className="p-4 bg-red-50/50 rounded-2xl border border-red-100/30">
                                    <p className="text-[8px] font-black text-red-400 uppercase tracking-widest mb-1">Operational Note</p>
                                    <p className="text-[10px] font-bold text-red-600">Seller can review and triage the claim here. Final refund settlement still remains an admin-controlled flow.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#3E2723] rounded-[2.5rem] p-10 text-white shadow-2xl shadow-[#3E2723]/20">
                        <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <ImageIcon size={14} className="text-white/60" /> Operational Protocol
                        </h3>
                        <p className="text-xs font-bold leading-relaxed opacity-80 mb-8">
                            Review the seller-relevant evidence first, then approve or reject the claim. Refund and final closure continue through the admin return workflow.
                        </p>
                        <ul className="space-y-4">
                            {[
                                'Review return reason',
                                'Verify uploaded evidence',
                                'Validate returned SKU',
                                'Approve or reject the claim'
                            ].map((text, i) => (
                                <li key={i} className="flex gap-3 text-[10px] font-black uppercase tracking-widest items-center">
                                    <div className="w-1.5 h-1.5 bg-white/20 rounded-full" /> {text}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SellerReturnDetail;
