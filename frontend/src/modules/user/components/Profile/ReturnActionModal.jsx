import React, { useState } from 'react';
import { ChevronRight, X, Check } from 'lucide-react';
import { useShop } from '../../../../context/ShopContext';
import api from '../../../../services/api';
import toast from 'react-hot-toast';
import { ProductThumb } from './ProductThumb';
import { formatCurrency } from '../../utils/price';

const ReturnActionModal = ({ isOpen, onClose, type, order, onSuccess }) => {
    const { showNotification } = useShop();
    const [selectedItems, setSelectedItems] = useState([]);
    const [reason, setReason] = useState('');
    const [resolution, setResolution] = useState(type === 'return' ? 'refund' : 'exchange');
    const [comment, setComment] = useState('');

    if (!isOpen) return null;

    const handleToggleItem = (itemId) => {
        if (selectedItems.includes(itemId)) {
            setSelectedItems(selectedItems.filter(id => id !== itemId));
        } else {
            setSelectedItems([...selectedItems, itemId]);
        }
    };

    const orderDisplayId = order?.displayId || order?.orderId || order?.id || order?._id;
    const orderDisplayShort = String(orderDisplayId || '').replace('ORD-', '');
    const safeItems = Array.isArray(order?.items) ? order.items : [];

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (selectedItems.length === 0) {
            toast.error(`Please select at least one item to ${type}`);
            return;
        }

        try {
            for (const itemId of selectedItems) {
                const payload = {
                    orderId: order?.id || order?._id,
                    itemId,
                    reason,
                    description: comment
                };
                if (type === 'return') {
                    await api.post('user/returns', payload);
                } else {
                    await api.post('user/replacements', payload);
                }
            }
            if (showNotification) {
                showNotification(`${type === 'return' ? 'Return' : 'Exchange'} request initiated for ${selectedItems.length} items.`);
            } else {
                toast.success(`${type === 'return' ? 'Return' : 'Exchange'} request initiated.`);
            }
            onSuccess?.();
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Request failed');
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
            {/* Backdrop (Desktop Only) */}
            <div className="hidden md:block absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

            {/* Modal Content - Mobile: Fullscreen Page, Desktop: Centered Card */}
            <div onClick={(e) => e.stopPropagation()} className="bg-white relative z-10 w-full h-full md:h-auto md:w-[600px] md:rounded-[2rem] shadow-none md:shadow-2xl flex flex-col animate-in slide-in-from-right md:zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-3 md:p-5 border-b border-gray-100 flex items-center gap-3 bg-white md:bg-white md:rounded-t-[2rem]">
                    {/* Mobile Back Button */}
                    <button onClick={onClose} className="md:hidden text-[#5D4037]">
                        <ChevronRight className="w-5 h-5 rotate-180" />
                    </button>

                    <div className="flex-1">
                        <h3 className="text-lg font-serif font-bold text-black capitalize">Request {type}</h3>
                        <p className="text-[10px] text-gray-400 mt-0.5">Order #{orderDisplayShort}</p>
                    </div>

                    {/* Desktop Close Button */}
                    <button onClick={onClose} className="hidden md:block p-2 hover:bg-[#EFEBE9] rounded-full transition-colors text-[#5D4037]">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 md:p-6 overflow-y-auto flex-1 space-y-4 md:space-y-5">
                    {/* Step 1: Select Items */}
                    <div>
                        <h4 className="text-xs font-bold text-[#141211] uppercase tracking-wider mb-2 flex items-center gap-2">
                            <span className="w-4 h-4 bg-[#141211] text-[#E8D198] rounded-full flex items-center justify-center text-[9px]">1</span>
                            Select Items
                        </h4>
                        <div className="space-y-2">
                        {safeItems.map((item) => (
                            <div key={item._id || item.id} onClick={() => handleToggleItem(item._id || item.id)} className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-all ${selectedItems.includes(item._id || item.id) ? 'border-[#C59B27] bg-[#FAF8F5]' : 'border-gray-100 hover:border-gray-200'}`}>
                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedItems.includes(item._id || item.id) ? 'bg-[#141211] border-[#141211]' : 'border-gray-300'}`}>
                                    {selectedItems.includes(item._id || item.id) && <Check className="w-2.5 h-2.5 text-[#E8D198]" />}
                                </div>
                                    <ProductThumb
                                        src={item.image}
                                        alt={item.name}
                                        className="w-10 h-10 rounded-md object-cover"
                                        fallbackClassName="border border-gray-100"
                                        fallbackIconClassName="w-3 h-3"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-black line-clamp-1">{item.name}</p>
                                        <p className="text-[10px] text-gray-500">{formatCurrency(item.price)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Step 2: Reason */}
                    <div>
                        <h4 className="text-xs font-bold text-[#141211] uppercase tracking-wider mb-2 flex items-center gap-2">
                            <span className="w-4 h-4 bg-[#141211] text-[#E8D198] rounded-full flex items-center justify-center text-[9px]">2</span>
                            Reason
                        </h4>
                        <select
                            className="w-full p-2.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-[#C59B27] bg-white font-medium text-gray-700"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        >
                            <option value="">Select a reason</option>
                            <option>Size doesn't fit</option>
                            <option>Product damaged</option>
                            <option>Incorrect item received</option>
                            <option>Quality not as expected</option>
                            <option>Changed my mind</option>
                        </select>
                    </div>

                    {/* Step 3: Resolution (Conditional) */}
                    {type === 'return' && (
                        <div>
                            <h4 className="text-xs font-bold text-[#141211] uppercase tracking-wider mb-2 flex items-center gap-2">
                                <span className="w-4 h-4 bg-[#141211] text-[#E8D198] rounded-full flex items-center justify-center text-[9px]">3</span>
                                Refund Method
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                                <button type="button" onClick={() => setResolution('refund')} className={`p-3 rounded-lg border text-left text-xs font-bold transition-all ${resolution === 'refund' ? 'border-[#141211] bg-[#141211] text-white' : 'border-gray-200 text-gray-700'}`}>
                                    Original Payment
                                    <div className="text-[9px] font-normal opacity-70 mt-0.5">5-7 Business Days</div>
                                </button>
                                <button type="button" onClick={() => setResolution('wallet')} className={`p-3 rounded-lg border text-left text-xs font-bold transition-all ${resolution === 'wallet' ? 'border-[#141211] bg-[#141211] text-white' : 'border-gray-200 text-gray-700'}`}>
                                    Swarna Sparsh Wallet
                                    <div className="text-[9px] font-normal opacity-70 mt-0.5">Instant Refund</div>
                                </button>
                            </div>
                        </div>
                    )}

                    {type === 'exchange' && (
                        <div>
                            <h4 className="text-xs font-bold text-[#141211] uppercase tracking-wider mb-2 flex items-center gap-2">
                                <span className="w-4 h-4 bg-[#141211] text-[#E8D198] rounded-full flex items-center justify-center text-[9px]">3</span>
                                Exchange For
                            </h4>
                            <div className="space-y-2">
                                <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E8DFD0] text-[10px] text-[#141211] leading-relaxed mb-2">
                                    We will arrange a pickup. Please specify what you want in exchange (e.g., Different Size).
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-700 uppercase tracking-widest mb-1 block">New Size / Variant Required</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Size 7, Rose Gold Chain"
                                        className="w-full p-2.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-[#C59B27]"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Comments */}
                    <div>
                        <label className="text-[10px] font-bold text-[#5D4037] uppercase tracking-widest mb-1.5 block">Additional Comments</label>
                        <textarea
                            rows="2"
                            className="w-full p-3 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-[#3E2723] resize-none"
                            placeholder="Tell us more about the issue..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        ></textarea>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 md:p-6 border-t border-gray-100 bg-white md:rounded-b-[2rem]">
                    <button
                        onClick={handleSubmit}
                        disabled={selectedItems.length === 0 || !reason}
                        className="w-full bg-[#141211] text-white py-3 rounded-xl font-bold uppercase tracking-widest shadow-lg shadow-black/20 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#1C1917] hover:text-[#E8D198] transition-all text-xs"
                    >
                        Confirm {type} Request
                    </button>
                    <button onClick={onClose} className="w-full text-gray-500 font-bold text-[10px] uppercase tracking-widest mt-3 hover:text-[#141211] transition-colors">Cancel</button>
                </div>
            </div>
        </div>
    );
};

export default ReturnActionModal;
