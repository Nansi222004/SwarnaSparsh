import React, { useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, AlertCircle, CheckCircle, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { useShop } from '../../../context/ShopContext';
import api from '../../../services/api';

const resolveImageSrc = (...values) => values.find((value) => typeof value === 'string' && value.trim()) || null;

const ProductThumb = ({ src, alt = '', className }) => {
    const imageSrc = resolveImageSrc(src);

    if (!imageSrc) {
        return (
            <div className={`${className} bg-[#FDFDFD] border border-gray-100 flex items-center justify-center text-gray-400`}>
                <Package size={18} />
            </div>
        );
    }

    return <img src={imageSrc} alt={alt} className={className} />;
};

const ReplacementRequestPage = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const { user, orders, replacements, refreshReplacements } = useShop();
    const safeOrders = Array.isArray(orders) ? orders : [];
    const safeReplacements = Array.isArray(replacements) ? replacements : [];
    const order = user ? safeOrders.find((item) => String(item.id || item._id) === String(orderId)) : null;
    const fileInputRef = useRef(null);

    const existingReplacementVariantIds = useMemo(() => {
        const ids = new Set();
        safeReplacements
            .filter((request) => String(request.orderId?._id || request.orderId) === String(order?.id || order?._id))
            .forEach((request) => {
                (request.items || request.originalItems || []).forEach((item) => {
                    ids.add(String(item.variantId || ''));
                });
            });
        return ids;
    }, [safeReplacements, order]);

    const [selectedItemId, setSelectedItemId] = useState('');
    const [reason, setReason] = useState('');
    const [comments, setComments] = useState('');
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files || []).slice(0, 5);
        setSelectedFiles(files);
    };

    if (!order) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    const reasons = [
        'Damaged / Defective Product',
        'Wrong Item Delivered',
        'Size Issue',
        'Quality Issues',
        'Item Not As Described',
        'Changed Mind'
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedItemId) {
            toast.error('Please select one item for replacement');
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('orderId', order.id || order._id);
            formData.append('itemId', selectedItemId);
            formData.append('reason', reason);
            formData.append('description', comments);
            selectedFiles.forEach((file) => formData.append('evidence', file));

            await api.post('user/replacements', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            await refreshReplacements();
            toast.success('Replacement request submitted');
            navigate('/replacements');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to submit replacement request');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-[#fcfcfc] min-h-screen py-12">
            <div className="container mx-auto px-4 md:px-12 max-w-3xl">
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-footerBg uppercase tracking-tight">Request Replacement</h1>
                        <p className="text-gray-500 text-sm mt-1">Order #{order.displayId || order.orderId || order.id}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
                        <h3 className="font-bold text-footerBg mb-4 flex items-center gap-2">
                            <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black">1</span>
                            SELECT ITEM
                        </h3>
                        <div className="space-y-4">
                            {(order.items || []).map((item) => {
                                const itemId = item._id || item.id;
                                const alreadyRequested = existingReplacementVariantIds.has(String(item.variantId || ''));
                                const checked = selectedItemId === itemId;

                                return (
                                    <label
                                        key={itemId}
                                        className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all ${alreadyRequested ? 'bg-gray-50 border-gray-100 grayscale opacity-60 cursor-not-allowed' : checked ? 'border-primary bg-primary/5 cursor-pointer ring-2 ring-primary/10' : 'border-gray-100 hover:border-gray-200 cursor-pointer'}`}
                                    >
                                        <input
                                            type="radio"
                                            name="replacement-item"
                                            className="mt-1 w-5 h-5 accent-primary border-gray-300"
                                            checked={checked || alreadyRequested}
                                            disabled={alreadyRequested}
                                            onChange={() => !alreadyRequested && setSelectedItemId(itemId)}
                                        />
                                        <ProductThumb
                                            src={item.image}
                                            alt={item.name}
                                            className="w-16 h-16 rounded-lg object-contain mix-blend-multiply"
                                        />
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start gap-3">
                                                <p className="font-bold text-footerBg text-sm leading-tight max-w-[200px]">{item.name}</p>
                                                {alreadyRequested && (
                                                    <span className="text-[9px] bg-gray-200 text-gray-500 px-2 py-0.5 rounded font-black uppercase tracking-wider">Requested</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1 font-medium">
                                                Qty: {item.quantity || 1}
                                            </p>
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
                        <h3 className="font-bold text-footerBg mb-4 flex items-center gap-2">
                            <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black">2</span>
                            REASON & EVIDENCE
                        </h3>

                        <div className="space-y-6">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block tracking-widest">Reason For Replacement</label>
                                <select
                                    required
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-bold text-footerBg appearance-none"
                                >
                                    <option value="">Select a reason</option>
                                    {reasons.map((itemReason) => <option key={itemReason} value={itemReason}>{itemReason}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Additional Comments</label>
                                <textarea
                                    value={comments}
                                    onChange={(e) => setComments(e.target.value)}
                                    rows="3"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                                    placeholder="Please describe the issue in detail..."
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Upload Photos / Video (Optional)</label>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImageChange}
                                    multiple
                                    accept="image/*,video/*"
                                    className="hidden"
                                />
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                                >
                                    <Upload size={24} className="mx-auto text-gray-400 mb-2" />
                                    <p className="text-xs text-gray-500">Click to select up to 5 files</p>
                                </div>

                                {selectedFiles.length > 0 && (
                                    <div className="grid grid-cols-4 gap-4 mt-4">
                                        {selectedFiles.map((file, idx) => (
                                            <div key={`${file.name}-${idx}`} className="relative aspect-square rounded-lg overflow-hidden border border-gray-100 group">
                                                {String(file.type || '').startsWith('video/') ? (
                                                    <video src={URL.createObjectURL(file)} className="w-full h-full object-cover" controls muted />
                                                ) : (
                                                    <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-xl flex gap-3 items-start border border-blue-100">
                        <AlertCircle size={18} className="text-blue-600 mt-0.5 shrink-0" />
                        <p className="text-xs text-blue-800 leading-relaxed">
                            <strong>Note:</strong> Items must be in original condition with tags and packaging intact.
                            Pickup will be scheduled after approval, and replacement progress will appear in your account.
                        </p>
                    </div>

                    <div className="flex justify-end gap-4">
                        <button type="button" onClick={() => navigate(-1)} className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-all">Cancel</button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-footerBg text-white px-8 py-3 rounded-xl font-bold hover:bg-opacity-90 transition-all shadow-lg flex items-center gap-2"
                        >
                            {loading ? 'Submitting...' : 'Submit Request'}
                            {!loading && <CheckCircle size={18} />}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReplacementRequestPage;
