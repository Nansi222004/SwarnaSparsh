import React from 'react';
import { CreditCard, ShieldCheck, Banknote } from 'lucide-react';

const PaymentsTab = () => {
    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex justify-center md:justify-between items-center mb-4 md:mb-6">
                <h2 className="text-xl md:text-2xl font-display font-bold text-black text-center md:text-left tracking-wide">Payment Methods</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="md:bg-white p-4 md:p-6 md:rounded-2xl md:border border-[#E8DFD0] hover:border-[#C59B27]/50 transition-all hover:shadow-md">
                    <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                        <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                            <CreditCard className="w-4 h-4 md:w-5 md:h-5" />
                        </div>
                        <h3 className="font-bold text-sm md:text-base text-black">Razorpay Secure</h3>
                    </div>
                    <p className="text-[10px] md:text-xs text-gray-500 mb-3 md:mb-4">Cards, UPI, NetBanking. 100% Secure.</p>
                    <div className="flex gap-2 opacity-50">
                        <CreditCard className="w-4 h-4" />
                        <ShieldCheck className="w-4 h-4" />
                    </div>
                </div>
                <div className="md:bg-white p-4 md:p-6 md:rounded-2xl md:border border-[#E8DFD0] hover:border-[#C59B27]/50 transition-all hover:shadow-md">
                    <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                        <div className="bg-green-50 p-2 rounded-lg text-green-600">
                            <Banknote className="w-4 h-4 md:w-5 md:h-5" />
                        </div>
                        <h3 className="font-bold text-sm md:text-base text-black">Cash on Delivery</h3>
                    </div>
                    <p className="text-[10px] md:text-xs text-gray-500 mb-3 md:mb-4">Pay in cash on delivery.</p>
                    <div className="flex gap-2 opacity-50">
                        <ShieldCheck className="w-4 h-4" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentsTab;
