import React from 'react';
import { CreditCard, Banknote } from 'lucide-react';

const CheckoutPayment = ({ paymentMethod, setPaymentMethod, hasGiftCard = false }) => {
    return (
        <div className="bg-white p-0 md:p-6 rounded-2xl md:border md:border-gray-100 md:shadow-sm">
            <h2 className="text-lg md:text-xl font-bold text-black mb-6 flex items-center gap-3 font-display uppercase tracking-wide">
                <span className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-sm font-bold">2</span>
                Payment Method
            </h2>

            <div className="space-y-4">
                <label className={`flex items-center gap-4 border p-4 rounded-xl cursor-pointer transition-all ${paymentMethod === 'online' ? 'border-black bg-gray-50' : 'border-gray-100 hover:border-gray-300'}`}>
                    <div className="relative flex items-center">
                        <input
                            type="radio"
                            name="payment"
                            value="online"
                            checked={paymentMethod === 'online'}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="peer h-4 w-4 cursor-pointer appearance-none rounded-full border border-gray-300 checked:border-black checked:bg-black focus:outline-none"
                        />
                        <div className="pointer-events-none absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white opacity-0 peer-checked:opacity-100"></div>
                    </div>
                    <div className="flex items-center gap-4 flex-1">
                        <div className="bg-[#141211] border border-[#C59B27]/40 p-2.5 rounded-full text-[#E8D198]">
                            <CreditCard size={20} />
                        </div>
                        <div>
                            <p className="font-bold text-sm md:text-base text-black font-display uppercase tracking-wide">Prepaid (Cards / UPI)</p>
                            <p className="text-xs text-gray-500 font-serif">Fast and secure online payment</p>
                        </div>
                    </div>
                </label>

                <label className={`flex items-center gap-4 border p-4 rounded-xl transition-all ${hasGiftCard ? 'opacity-50 cursor-not-allowed bg-gray-100 border-gray-200' : paymentMethod === 'cod' ? 'border-black bg-gray-50 cursor-pointer' : 'border-gray-100 hover:border-gray-300 cursor-pointer'}`}>
                    <div className="relative flex items-center">
                        <input
                            type="radio"
                            name="payment"
                            value="cod"
                            disabled={hasGiftCard}
                            checked={paymentMethod === 'cod'}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="peer h-4 w-4 cursor-pointer appearance-none rounded-full border border-gray-300 checked:border-black checked:bg-black focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-250"
                        />
                        <div className="pointer-events-none absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white opacity-0 peer-checked:opacity-100"></div>
                    </div>
                    <div className="flex items-center gap-4 flex-1">
                        <div className="bg-[#141211] border border-[#C59B27]/40 p-2.5 rounded-full text-[#E8D198]">
                            <Banknote size={20} />
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-sm md:text-base text-black font-display uppercase tracking-wide">Cash on Delivery</p>
                            <p className="text-xs text-gray-500 font-serif">Pay when you receive your order</p>
                            {hasGiftCard && (
                                <p className="text-[10px] text-red-600 font-bold mt-1 uppercase tracking-wider">
                                    Not available for orders containing Gift Cards
                                </p>
                            )}
                        </div>
                    </div>
                </label>
            </div>
        </div>
    );
};

export default CheckoutPayment;
