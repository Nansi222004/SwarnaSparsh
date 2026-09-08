import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { useShop } from '../../../context/ShopContext';
import FAQSection from '../components/FAQSection';

const OrderSuccess = () => {
    // We might want to clear the cart here, but typically that should happen upon successful order placement logic.
    // For now, let's just assume the cart clearing happens elsewhere or let the user do it manually if it's a mock.

    // Confetti effect removed due to installation issues.
    useEffect(() => {
        
    }, []);

    return (
        <div className="bg-white min-h-screen">
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 animate-in fade-in duration-700 pt-20">
                <div className="w-20 h-20 md:w-24 md:h-24 bg-[#FAF8F5] border border-[#C59B27]/40 rounded-full flex items-center justify-center mb-6 md:mb-8 animate-in zoom-in duration-500 shadow-md">
                    <CheckCircle className="w-10 h-10 md:w-12 md:h-12 text-[#C59B27]" strokeWidth={1.5} />
                </div>

                <h1 className="text-3xl md:text-5xl font-serif font-bold text-[#141211] mb-4 tracking-wide">Order Placed Successfully!</h1>
                <p className="text-stone-500 mb-8 md:mb-10 max-w-lg text-sm md:text-base leading-relaxed">
                    Thank you for your purchase. Your order has been received and is being processed. You will receive an email confirmation shortly.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 mb-20">
                    <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                        <Link to="/shop" className="flex-1 bg-[#141211] text-[#E8D198] border border-[#C59B27]/40 px-8 py-4 rounded-xl hover:bg-[#1C1917] transition-all font-bold uppercase tracking-widest text-xs md:text-sm flex items-center justify-center gap-2 shadow-lg shadow-black/10 active:scale-95">
                            Continue Shopping <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link to="/profile/orders" className="flex-1 bg-white border border-stone-300 text-[#141211] px-8 py-4 rounded-xl hover:border-[#C59B27] hover:text-[#C59B27] hover:bg-stone-50 transition-all font-bold uppercase tracking-widest text-xs md:text-sm flex items-center justify-center active:scale-95">
                            View My Orders
                        </Link>
                    </div>
                </div>
            </div>

            <div className="border-t border-gray-100">
                <FAQSection />
            </div>
        </div>
    );
};

export default OrderSuccess;
