import React from 'react';
import { Gift, ArrowRight, Tag, ShieldCheck, Lock, X } from 'lucide-react';

const CheckoutCartSummary = ({
    cart,
    currencyText,
    cartItemKey,
    subtotal,
    giftWrapCharge,
    shipping,
    discount,
    total,
    appliedCoupon,
    setShowCouponModal,
    removeCoupon,
    appliedGiftCards,
    giftCardDiscount,
    giftCardInput,
    setGiftCardInput,
    handleApplyGiftCard,
    giftCardLoading,
    removeGiftCard,
    loading,
    paymentMethod,
    showCouponModal,
    couponCode,
    setCouponCode,
    handleApplyCouponValidated,
    availableCoupons,
    couponSummary,
    gstIncluded
}) => {
    return (
        <div className="lg:col-span-1">
            <div className="bg-[#FDFBF7] p-6 md:p-8 rounded-2xl border border-[#E8DFD0] sticky top-24 shadow-sm">
                <h2 className="font-display font-bold text-xl text-black mb-6 uppercase tracking-widest border-b border-[#E8DFD0] pb-4">Order Summary</h2>

                {/* Mini Cart in Summary */}
                <div className="max-h-60 overflow-y-auto mb-6 pr-2 space-y-5 custom-scrollbar">
                    {cart.map((item) => (
                        <div key={cartItemKey(item)} className="flex gap-4">
                            <div className="w-16 h-16 bg-white rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                                {item.image ? (
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-[#FAF8F5] text-[#A8A29E] text-[8px] font-bold uppercase tracking-[0.2em] text-center px-1">
                                        No Image
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-black line-clamp-2 font-display uppercase tracking-wide text-[11px]">{item.name}</p>
                                <p className="text-xs text-gray-500 mt-1 font-serif">Qty: {item.quantity || 1}</p>
                                <p className="text-sm font-bold text-black mt-1">{currencyText(item.price * (item.quantity || 1))}</p>
                                {item.giftWrap && (
                                    <p className="text-[10px] text-[#C59B27] mt-1 flex items-center gap-1 font-sans">
                                        🎁 Gift wrapped {item.giftMessage ? `("${item.giftMessage}")` : ''}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mb-6">
                    {!appliedCoupon ? (
                        <div
                            onClick={() => setShowCouponModal(true)}
                            className="bg-gray-50 border-2 border-dashed border-[#E8DFD0] p-4 rounded-xl flex items-center justify-between group cursor-pointer hover:border-[#C59B27] transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <Gift className="w-4 h-4 text-[#C59B27]" />
                                <span className="text-xs font-bold text-black uppercase tracking-wider">Apply Coupon</span>
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:translate-x-1 transition-transform" />
                        </div>
                    ) : (
                        <div className="bg-[#E8DFD0]/20 border border-[#E8DFD0] p-4 rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-[#C59B27] p-1.5 rounded text-white">
                                    <Tag className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-black uppercase tracking-wider">{appliedCoupon.code}</p>
                                    <p className="text-[10px] text-gray-500">{currencyText(parseFloat(discount).toFixed(0))} saved</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={removeCoupon}
                                className="text-xs font-bold text-red-500 hover:text-red-600 uppercase tracking-wider"
                            >
                                Remove
                            </button>
                        </div>
                    )}
                </div>

                {/* Gift Card */}
                <div className="mb-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Gift className="w-3.5 h-3.5 text-[#C59B27]" />
                        Gift Card
                    </p>

                    {appliedGiftCards.map(gc => (
                        <div key={gc.code} className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <div className="bg-emerald-500 p-1.5 rounded text-white">
                                    <Gift className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-emerald-800 tracking-wider font-mono">{gc.code}</p>
                                    <p className="text-[10px] text-emerald-600">{currencyText(gc.amountUsed)} applied</p>
                                </div>
                            </div>
                            <button type="button" onClick={() => removeGiftCard(gc.code)} className="text-xs font-bold text-red-400 hover:text-red-600">Remove</button>
                        </div>
                    ))}

                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="SWARNA-XXXX-XXXX-XXXX"
                            value={giftCardInput}
                            onChange={(e) => setGiftCardInput(e.target.value.toUpperCase())}
                            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleApplyGiftCard(); } }}
                            className="flex-1 border border-gray-200 rounded-lg px-4 py-2 outline-none focus:border-black font-mono text-xs uppercase placeholder:normal-case placeholder:font-sans placeholder:text-gray-400"
                        />
                        <button
                            type="button"
                            onClick={handleApplyGiftCard}
                            disabled={giftCardLoading || !giftCardInput.trim()}
                            className="bg-black text-white px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-[#C59B27] transition-colors disabled:opacity-50"
                        >
                            {giftCardLoading ? "..." : "Apply"}
                        </button>
                    </div>
                </div>

                <div className="space-y-3 text-sm text-gray-600 mb-6 pt-4 border-t border-[#E8DFD0]">
                    <div className="flex justify-between items-center">
                        <span className="font-serif">Subtotal</span>
                        <span className="text-black font-bold font-sans">{currencyText(subtotal)}</span>
                    </div>
                    {giftWrapCharge > 0 && (
                        <div className="flex justify-between items-center text-[#C59B27]">
                            <span className="font-serif">Gift Wrapping</span>
                            <span className="font-bold font-sans">{currencyText(giftWrapCharge)}</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center">
                        <span className="font-serif">Shipping</span>
                        <span className="font-sans font-bold">{shipping === 0 ? <span className="text-emerald-600">Free</span> : currencyText(shipping)}</span>
                    </div>
                    {gstIncluded > 0 && (
                        <div className="flex justify-between items-center text-gray-500 text-xs">
                            <span className="font-serif">GST (Included)</span>
                            <span className="font-sans font-medium">{currencyText(gstIncluded)}</span>
                        </div>
                    )}
                    {appliedCoupon && (
                        <div className="flex justify-between items-center text-[#C59B27]">
                            <span className="font-serif">Coupon Discount</span>
                            <span className="font-bold font-sans">- {currencyText(parseFloat(discount).toFixed(0))}</span>
                        </div>
                    )}
                    {appliedGiftCards.length > 0 && (
                        <div className="flex justify-between items-center text-emerald-600">
                            <span className="font-serif">Gift Card</span>
                            <span className="font-bold font-sans">- {currencyText(giftCardDiscount)}</span>
                        </div>
                    )}
                </div>

                <div className="border-t border-[#E8DFD0] pt-6 mb-6">
                    <div className="flex justify-between items-end">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-gray-400 font-black uppercase tracking-[0.15em] mb-1">Final Amount</span>
                            <span className="font-black text-3xl text-gray-900 tracking-tight">{currencyText(total)}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                            <Lock size={12} className="text-emerald-600" />
                            <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">Secure</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl text-xs text-gray-500 mb-6 flex gap-3 border border-gray-100 shadow-sm">
                    <ShieldCheck className="w-5 h-5 text-[#C59B27] flex-shrink-0" />
                    <p className="font-serif leading-relaxed">Your personal data will be used to process your order, support your experience throughout this website, and for other purposes described in our privacy policy.</p>
                </div>

                <button
                    form="checkout-form"
                    type="submit"
                    disabled={loading}
                    className={`w-full bg-[#E8DFD0] text-black py-4 rounded-xl font-bold hover:bg-[#C59B27] hover:text-white transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-lg uppercase tracking-widest text-sm ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
                >
                    {loading ? (
                        <span className="flex items-center gap-2">
                            {paymentMethod === 'online' ? 'Redirecting...' : 'Processing...'}
                        </span>
                    ) : (
                        <span>{paymentMethod === 'online' ? 'Pay Now' : 'Place Order'}</span>
                    )}
                </button>
            </div>

            {/* Coupon Modal */}
            {showCouponModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                            <h3 className="font-bold text-lg font-display uppercase tracking-wide">Available Coupons</h3>
                            <button
                                type="button"
                                onClick={() => setShowCouponModal(false)}
                                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                            {/* Manual Input */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Enter Coupon Code"
                                    value={couponCode}
                                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                    className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:border-black font-medium uppercase placeholder:normal-case text-xs"
                                />
                                <button
                                    type="button"
                                    onClick={() => handleApplyCouponValidated({ code: couponCode })}
                                    className="bg-black text-white px-4 sm:px-6 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-[#C59B27] transition-colors"
                                >
                                    Apply
                                </button>
                            </div>

                            {/* List */}
                            <div className="space-y-3">
                                <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest">Best Offers For You</p>
                                <div className="space-y-3 max-h-[250px] sm:max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                                    {availableCoupons.map((coupon, idx) => (
                                        <div
                                            key={idx}
                                            className="border border-gray-200 rounded-xl p-3 sm:p-4 hover:border-[#C59B27] transition-all group relative overflow-hidden"
                                        >
                                            <div className="flex justify-between items-center gap-2 mb-2">
                                                <div className="bg-[#E8DFD0]/30 px-2 sm:px-3 py-1 rounded border border-[#E8DFD0] text-[#C59B27] font-bold text-[10px] sm:text-xs uppercase tracking-wider truncate max-w-[140px] sm:max-w-none">
                                                    {coupon.code}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleApplyCouponValidated(coupon)}
                                                    className="text-black font-bold text-[11px] sm:text-xs uppercase tracking-wider hover:text-[#C59B27] transition-colors shrink-0 py-1 px-2 hover:bg-gray-50 rounded"
                                                >
                                                    Apply
                                                </button>
                                            </div>
                                            <p className="text-xs sm:text-sm font-bold text-black mb-0.5">Save {currencyText(typeof coupon.amount === 'number' ? coupon.amount.toFixed(0) : coupon.amount || coupon.value || 0)}</p>
                                            <p className="text-[10px] sm:text-xs text-gray-500 font-serif">{couponSummary(coupon)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default CheckoutCartSummary;
