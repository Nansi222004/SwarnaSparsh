import React from 'react';
import { Truck, ShieldCheck, Gift } from 'lucide-react';
import toast from 'react-hot-toast';

const DeliveryOptions = ({ product, localPincode, setLocalPincode, pincode, updatePincode }) => {
    return (
        <div className="container mx-auto px-4 mt-4 mb-10 max-w-4xl">
            <div className="bg-white border border-gray-100 rounded-xl p-3 flex flex-col md:flex-row items-center gap-4 shadow-sm relative overflow-hidden group">
                {/* Progress Bar (Purely Aesthetic) */}
                <div className="absolute top-0 left-0 h-[2px] bg-[#C59B27]/20 w-full" />
                <div className="absolute top-0 left-0 h-[2px] bg-[#C59B27] w-0 group-hover:w-full transition-all duration-1000" />

                <div className="flex items-center gap-2 pl-2">
                    <Truck className="w-4 h-4 text-[#C59B27]" />
                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-stone-500 hidden lg:block whitespace-nowrap">Deliver To</span>
                </div>

                <div className="flex w-full md:max-w-xs gap-1.5 bg-stone-50 rounded-lg p-1 border border-stone-200 focus-within:border-[#C59B27] focus-within:bg-white transition-all">
                    <input
                        type="text"
                        placeholder="Enter Pincode"
                        value={localPincode}
                        onChange={(e) => setLocalPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="flex-1 bg-transparent border-none px-3 py-1 text-xs focus:ring-0 transition-all placeholder:text-stone-400 font-semibold"
                    />
                    <button
                        onClick={() => {
                            if (localPincode.length === 6) {
                                updatePincode(localPincode);
                                toast.success("Checking availability...");
                            } else {
                                toast.error("Please enter a 6-digit pincode");
                            }
                        }}
                        className="bg-[#141211] text-[#E8D198] hover:bg-[#1C1917] border border-[#C59B27]/50 px-4 py-1.5 rounded-md font-bold text-[9px] uppercase tracking-wider transition-all shadow-xs active:scale-95"
                    >
                        Check
                    </button>
                </div>

                {pincode ? (
                    <div className="flex flex-col md:flex-row items-center gap-3 md:ml-auto md:border-l md:border-stone-100 md:pl-6 animate-in fade-in slide-in-from-left-2 duration-500">
                        <div className="flex items-center gap-2 text-emerald-600">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Available</span>
                        </div>
                        <div className="h-4 w-[1px] bg-stone-100 hidden md:block" />
                        <p className="text-[10px] font-bold text-stone-900 uppercase tracking-widest">
                            Get it by <span className="text-[#C59B27]">
                                {(() => {
                                    const days = product?.logistics?.estimatedShippingDays || 3;
                                    const date = new Date();
                                    date.setDate(date.getDate() + days + 2); // 2 days buffer for delivery
                                    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', weekday: 'short' });
                                })()}
                            </span>
                        </p>
                    </div>
                ) : (
                    <div className="flex items-center gap-6 md:ml-auto md:border-l md:border-gray-100 md:pl-6 pr-2 opacity-60">
                        {[
                            { icon: <Truck className="w-3.5 h-3.5" />, label: "Express" },
                            { icon: <ShieldCheck className="w-3.5 h-3.5" />, label: "Insured" },
                            { icon: <Gift className="w-3.5 h-3.5" />, label: "Luxury Box" }
                        ].map((badge, i) => (
                            <div key={i} className="flex items-center gap-2 text-gray-400">
                                {badge.icon}
                                <span className="text-[8px] font-black uppercase tracking-widest whitespace-nowrap">{badge.label}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DeliveryOptions;
