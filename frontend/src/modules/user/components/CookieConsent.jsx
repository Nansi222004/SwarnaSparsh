import React, { useState, useEffect } from 'react';
import { Shield, X, Check } from 'lucide-react';

const CookieConsent = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('cookie_consent');
        if (!consent) {
            const timer = setTimeout(() => setIsVisible(true), 2000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('cookie_consent', 'accepted');
        setIsVisible(false);
    };

    const handleDecline = () => {
        localStorage.setItem('cookie_consent', 'declined');
        // In a real app, you would disable analytics tracking here
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-[400px] z-[2000] animate-in slide-in-from-bottom-10 duration-700">
            <div className="bg-white rounded-[2rem] p-6 shadow-2xl border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#3E2723]" />
                
                <div className="flex gap-4">
                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center shrink-0">
                        <Shield size={24} className="text-[#3E2723]" />
                    </div>
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Privacy & Cookies</h3>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1 leading-relaxed">
                                We use cookies to enhance your experience and analyze our traffic. By clicking "Accept", you consent to our use of cookies.
                            </p>
                        </div>
                        
                        <div className="flex gap-2">
                            <button 
                                onClick={handleAccept}
                                className="flex-1 py-3 bg-black text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#3E2723] transition-all flex items-center justify-center gap-2"
                            >
                                <Check size={12} /> Accept All
                            </button>
                            <button 
                                onClick={handleDecline}
                                className="px-4 py-3 bg-gray-50 text-gray-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all"
                            >
                                Decline
                            </button>
                        </div>
                    </div>
                </div>

                <button 
                    onClick={() => setIsVisible(false)}
                    className="absolute top-4 right-4 p-1 text-gray-300 hover:text-gray-900 transition-colors"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
};

export default CookieConsent;
