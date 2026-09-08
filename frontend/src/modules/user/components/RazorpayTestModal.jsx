import React, { useState } from 'react';
import { X, ShieldCheck, CreditCard, Smartphone, Building2, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const RazorpayTestModal = ({ isOpen, rpOrder, orderData, onSuccess, onCancel }) => {
    const [selectedMethod, setSelectedMethod] = useState('upi'); // 'upi' | 'card' | 'netbanking'
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [upiId, setUpiId] = useState('customer@okhdfcbank');
    const [selectedBank, setSelectedBank] = useState('HDFC');

    if (!isOpen || !rpOrder) return null;

    const amountInRupees = Math.round((rpOrder.amount || 0) / 100);
    const formattedAmount = `₹${amountInRupees.toLocaleString('en-IN')}`;
    const orderId = orderData?.orderId || rpOrder.receipt || rpOrder.id;

    const handlePaySuccess = async () => {
        setIsSubmitting(true);
        try {
            await onSuccess({
                paymentId: `pay_test_${Date.now()}`,
                method: selectedMethod,
            });
        } catch (err) {
            setIsSubmitting(false);
        }
    };

    const handlePayFailure = () => {
        onCancel('Payment simulation declined / cancelled by user');
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.94, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.94, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-amber-500/30 flex flex-col max-h-[92vh]"
                >
                    {/* Razorpay Test Mode Header */}
                    <div className="bg-[#0C2340] text-white p-4 sm:p-5 relative">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 bg-[#3395FF] rounded-lg flex items-center justify-center font-black text-sm text-white tracking-wider shadow-inner">
                                    R
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-base tracking-wide">Razorpay</span>
                                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-400 text-stone-900 tracking-wider">
                                            Test Mode
                                        </span>
                                    </div>
                                    <p className="text-xs text-stone-300 truncate max-w-[200px]">
                                        Swarna Sparsh Luxury Jewellery
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handlePayFailure}
                                disabled={isSubmitting}
                                className="p-1.5 text-stone-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                                aria-label="Close"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Amount Banner */}
                        <div className="mt-4 pt-3 border-t border-white/10 flex items-baseline justify-between">
                            <div>
                                <span className="text-[11px] uppercase tracking-wider text-stone-300">Amount to Pay</span>
                                <div className="text-2xl sm:text-3xl font-black text-amber-300">
                                    {formattedAmount}
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] uppercase text-stone-400">Order ID</span>
                                <div className="text-xs font-mono font-semibold text-stone-200">
                                    {orderId}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Customer Info Strip */}
                    <div className="bg-amber-50 px-4 py-2.5 border-b border-amber-200/60 flex items-center justify-between text-xs text-stone-700">
                        <div className="flex items-center gap-1.5 truncate">
                            <span className="font-semibold text-stone-900">{orderData?.customerName || 'Customer'}</span>
                            <span className="text-stone-400">•</span>
                            <span className="text-stone-600 truncate">{orderData?.customerPhone || orderData?.customerEmail}</span>
                        </div>
                        <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider shrink-0 bg-amber-200/60 px-2 py-0.5 rounded">
                            Sandbox
                        </span>
                    </div>

                    {/* Body / Payment Methods */}
                    <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
                        <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                            Choose Test Payment Method
                        </p>

                        {/* Method Tabs */}
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => setSelectedMethod('upi')}
                                className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                                    selectedMethod === 'upi'
                                        ? 'border-[#0C2340] bg-[#0C2340]/5 text-[#0C2340] font-bold shadow-sm'
                                        : 'border-stone-200 hover:border-stone-300 text-stone-600'
                                }`}
                            >
                                <Smartphone size={18} className={selectedMethod === 'upi' ? 'text-[#3395FF]' : 'text-stone-400'} />
                                <span className="text-xs">UPI / QR</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setSelectedMethod('card')}
                                className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                                    selectedMethod === 'card'
                                        ? 'border-[#0C2340] bg-[#0C2340]/5 text-[#0C2340] font-bold shadow-sm'
                                        : 'border-stone-200 hover:border-stone-300 text-stone-600'
                                }`}
                            >
                                <CreditCard size={18} className={selectedMethod === 'card' ? 'text-[#3395FF]' : 'text-stone-400'} />
                                <span className="text-xs">Test Card</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setSelectedMethod('netbanking')}
                                className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                                    selectedMethod === 'netbanking'
                                        ? 'border-[#0C2340] bg-[#0C2340]/5 text-[#0C2340] font-bold shadow-sm'
                                        : 'border-stone-200 hover:border-stone-300 text-stone-600'
                                }`}
                            >
                                <Building2 size={18} className={selectedMethod === 'netbanking' ? 'text-[#3395FF]' : 'text-stone-400'} />
                                <span className="text-xs">Netbanking</span>
                            </button>
                        </div>

                        {/* UPI Tab View */}
                        {selectedMethod === 'upi' && (
                            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold text-stone-700">Simulated UPI Apps</span>
                                    <span className="text-[11px] text-green-600 font-bold flex items-center gap-1">
                                        <CheckCircle2 size={12} /> Auto-Approved
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                    <div className="py-2 px-1 bg-white border border-stone-200 rounded-lg font-bold text-stone-700 shadow-2xs">
                                        Google Pay
                                    </div>
                                    <div className="py-2 px-1 bg-white border border-stone-200 rounded-lg font-bold text-stone-700 shadow-2xs">
                                        PhonePe
                                    </div>
                                    <div className="py-2 px-1 bg-white border border-stone-200 rounded-lg font-bold text-stone-700 shadow-2xs">
                                        Paytm
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[11px] text-stone-500 block mb-1">Test UPI ID</label>
                                    <input
                                        type="text"
                                        value={upiId}
                                        onChange={(e) => setUpiId(e.target.value)}
                                        className="w-full text-xs font-mono px-3 py-2 bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-[#0C2340]"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Card Tab View */}
                        {selectedMethod === 'card' && (
                            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                                <div className="p-3 bg-gradient-to-r from-stone-800 to-stone-900 text-white rounded-xl shadow">
                                    <div className="flex justify-between items-center text-[10px] text-stone-400 mb-2">
                                        <span>TEST VISA CARD</span>
                                        <span className="font-bold text-amber-300">SWARNA SPARSH</span>
                                    </div>
                                    <div className="font-mono text-sm tracking-widest text-stone-100 font-semibold mb-2">
                                        4111 •••• •••• 1111
                                    </div>
                                    <div className="flex justify-between text-[10px] text-stone-300 font-mono">
                                        <span>EXP: 12/28</span>
                                        <span>CVV: 123</span>
                                    </div>
                                </div>
                                <p className="text-[11px] text-stone-500 text-center">
                                    Standard Razorpay sandbox test card pre-configured.
                                </p>
                            </div>
                        )}

                        {/* Netbanking Tab View */}
                        {selectedMethod === 'netbanking' && (
                            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                                <span className="text-xs font-semibold text-stone-700 block">Select Test Bank:</span>
                                <div className="grid grid-cols-2 gap-2">
                                    {['HDFC', 'SBI', 'ICICI', 'AXIS'].map((bank) => (
                                        <button
                                            key={bank}
                                            type="button"
                                            onClick={() => setSelectedBank(bank)}
                                            className={`py-2 px-3 rounded-lg border text-xs font-bold text-left transition-all ${
                                                selectedBank === bank
                                                    ? 'border-[#0C2340] bg-[#0C2340] text-white'
                                                    : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'
                                            }`}
                                        >
                                            {bank} Bank
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Notice */}
                        <div className="flex items-start gap-2 p-2.5 bg-stone-100 rounded-xl text-[11px] text-stone-600">
                            <AlertCircle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                            <span>
                                This simulated Razorpay screen allows you to complete testing. Real cards will not be charged.
                            </span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="p-4 sm:p-5 bg-stone-50 border-t border-stone-200 space-y-2">
                        <button
                            type="button"
                            onClick={handlePaySuccess}
                            disabled={isSubmitting}
                            className="w-full py-3.5 px-4 bg-[#0C2340] hover:bg-[#14335c] text-white font-bold text-sm rounded-xl shadow-lg shadow-[#0C2340]/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-75 disabled:pointer-events-none cursor-pointer"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    <span>Authorizing Payment...</span>
                                </>
                            ) : (
                                <>
                                    <ShieldCheck size={16} className="text-amber-400" />
                                    <span>Pay {formattedAmount} (Simulate Success)</span>
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={handlePayFailure}
                            disabled={isSubmitting}
                            className="w-full py-2.5 px-4 text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors"
                        >
                            Cancel Payment Simulation
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default RazorpayTestModal;
