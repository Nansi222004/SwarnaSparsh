import React from 'react';
import { Lock } from 'lucide-react';

const CheckoutAuth = ({
    loginStep,
    setLoginStep,
    phoneNumber,
    setPhoneNumber,
    otp,
    handleOtpChange,
    handleSendOtp,
    handleVerifyOtp
}) => {
    return (
        <div className="container mx-auto px-4 py-12 md:py-24 flex justify-center items-center min-h-[70vh] bg-white animate-in fade-in duration-700">
            <div className="w-full max-w-md">
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-100">
                        <Lock className="w-6 h-6 text-black" strokeWidth={1.5} />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-display font-bold text-black mb-2">
                        {loginStep === 1 ? 'Login to Checkout' : 'Verify Phone Number'}
                    </h2>
                    <p className="text-gray-500 text-sm font-serif">
                        {loginStep === 1
                            ? 'Please enter your phone number to proceed with your order'
                            : `Enter the 4-digit code sent to +91 ${phoneNumber}`
                        }
                    </p>
                </div>

                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl shadow-black/5 border border-gray-100">
                    {loginStep === 1 ? (
                        <form onSubmit={handleSendOtp} className="space-y-6">
                            <div className="flex border border-gray-200 rounded-xl overflow-hidden transition-all focus-within:ring-1 focus-within:ring-black focus-within:border-black bg-gray-50/50">
                                <div className="bg-gray-50 px-5 flex items-center border-r border-gray-200">
                                    <span className="text-gray-500 font-bold text-sm">+91</span>
                                </div>
                                <input
                                    type="tel"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                    className="flex-1 py-4 px-4 text-base outline-none bg-transparent placeholder-gray-400 font-medium"
                                    placeholder="Enter Phone Number"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-[#141211] text-[#E8D198] border border-[#C59B27]/50 hover:bg-[#1C1917] hover:border-[#C59B27] py-4 rounded-xl font-bold tracking-widest uppercase text-sm transition-all shadow-lg shadow-black/10 active:scale-95 transform"
                            >
                                Send OTP
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOtp} className="space-y-6">
                            <div className="flex justify-center gap-3">
                                {otp.map((data, index) => (
                                    <input
                                        key={index}
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        maxLength="1"
                                        value={data}
                                        onChange={(e) => handleOtpChange(e.target, index)}
                                        onFocus={(e) => e.target.select()}
                                        className="w-14 h-14 border border-gray-200 rounded-xl text-center text-xl font-bold focus:ring-[#C59B27] focus:border-[#C59B27] outline-none bg-gray-50/50 transition-all font-display"
                                    />
                                ))}
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-[#141211] text-[#E8D198] border border-[#C59B27]/50 hover:bg-[#1C1917] hover:border-[#C59B27] py-4 rounded-xl font-bold tracking-widest uppercase text-sm transition-all shadow-lg shadow-black/10 active:scale-95 transform"
                            >
                                Verify & Proceed
                            </button>
                            <button
                                type="button"
                                onClick={() => setLoginStep(1)}
                                className="text-xs text-gray-400 hover:text-black font-bold uppercase tracking-wider block mx-auto transition-colors"
                            >
                                Change Phone Number
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CheckoutAuth;
