import React, { useState } from 'react';
import { X, MapPin, Search, Navigation, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useShop } from '../../../context/ShopContext';
import toast from 'react-hot-toast';

const PincodeModal = () => {
    const { isPincodeModalOpen, setIsPincodeModalOpen, pincode: currentPincode, updatePincode } = useShop();
    const [tempPincode, setTempPincode] = useState(currentPincode || '');
    const [isValidating, setIsValidating] = useState(false);

    if (!isPincodeModalOpen) return null;

    const handleApply = async () => {
        if (tempPincode.length !== 6 || !/^\d+$/.test(tempPincode)) {
            toast.error("Please enter a valid 6-digit pincode");
            return;
        }

        setIsValidating(true);
        // Simulate API check for serviceability
        setTimeout(() => {
            updatePincode(tempPincode);
            setIsValidating(false);
            setIsPincodeModalOpen(false);
            toast.success(`Delivery pincode updated to ${tempPincode}`);
        }, 800);
    };

    const handleUseCurrentLocation = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser");
            return;
        }

        toast.loading("Fetching your location...");
        navigator.geolocation.getCurrentPosition(
            (position) => {
                toast.dismiss();
                // Production-safe behavior: we don't guess a pincode without reverse geocoding.
                // If/when we add a real geocode provider, we can auto-fill.
                console.log('Geolocation detected:', position?.coords);
                toast.success("Location detected. Please enter your pincode.");
            },
            (error) => {
                toast.dismiss();
                toast.error("Unable to retrieve your location");
                console.error(error);
            }
        );
    };

    const popularCities = [
        { name: 'Mumbai', code: '400001' },
        { name: 'Delhi', code: '110001' },
        { name: 'Bangalore', code: '560001' },
        { name: 'Pune', code: '411001' },
        { name: 'Kolkata', code: '700001' },
        { name: 'Chennai', code: '600001' }
    ];

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsPincodeModalOpen(false)}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="bg-[#141211] border-b border-[#C59B27]/30 px-8 py-10 text-white relative">
                        <button 
                            onClick={() => setIsPincodeModalOpen(false)}
                            className="absolute top-6 right-6 p-2 hover:bg-white/10 text-stone-400 hover:text-white rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        
                        <div className="flex items-center gap-4 mb-2">
                            <div className="bg-[#C59B27]/15 border border-[#C59B27]/40 p-3 rounded-2xl text-[#E8D198]">
                                <MapPin className="w-8 h-8" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-serif font-bold text-[#FAF8F5]">Set Delivery Location</h2>
                                <p className="text-[#C59B27]/80 text-xs tracking-wider uppercase">Enter your pincode to check serviceability</p>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-8">
                        <div className="space-y-6">
                            {/* Pincode Input */}
                            <div className="relative">
                                <label className="text-[10px] uppercase font-bold tracking-widest text-stone-500 mb-2 block">Enter Pin Code</label>
                                <div className="relative group">
                                    <input
                                        type="text"
                                        maxLength={6}
                                        value={tempPincode}
                                        onChange={(e) => setTempPincode(e.target.value.replace(/\D/g, ''))}
                                        className="w-full bg-stone-50 border-2 border-stone-200 rounded-2xl py-4 px-6 text-lg font-bold tracking-widest text-[#141211] focus:outline-none focus:border-[#C59B27] focus:bg-white transition-all"
                                        placeholder="000000"
                                    />
                                    <button 
                                        onClick={handleApply}
                                        disabled={tempPincode.length !== 6 || isValidating}
                                        className={`absolute right-2 top-2 bottom-2 px-6 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
                                            tempPincode.length === 6 && !isValidating
                                            ? 'bg-[#141211] text-[#E8D198] border border-[#C59B27]/50 shadow-md hover:bg-[#1C1917] active:translate-y-0'
                                            : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                                        }`}
                                    >
                                        {isValidating ? 'Checking...' : 'Apply'}
                                    </button>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="flex items-center gap-4 py-2">
                                <div className="h-px bg-stone-200 flex-1" />
                                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">OR</span>
                                <div className="h-px bg-stone-200 flex-1" />
                            </div>

                            {/* Use Current Location */}
                            <button
                                onClick={handleUseCurrentLocation}
                                className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl border border-[#C59B27]/40 text-[#141211] bg-amber-500/5 font-bold hover:bg-[#C59B27]/10 transition-all active:scale-95"
                            >
                                <Navigation className="w-4 h-4 text-[#C59B27]" />
                                <span className="text-sm font-semibold tracking-wide">Use Current Location</span>
                            </button>

                            {/* Quick Select */}
                            <div>
                                <label className="text-[10px] uppercase font-bold tracking-widest text-stone-400 mb-4 block">Popular Cities</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {popularCities.map(city => (
                                        <button
                                            key={city.code}
                                            onClick={() => {
                                                setTempPincode(city.code);
                                                updatePincode(city.code);
                                                setIsPincodeModalOpen(false);
                                                toast.success(`Welcome to ${city.name}!`);
                                            }}
                                            className="px-3 py-2 rounded-xl border border-stone-200 text-[11px] font-semibold text-stone-700 hover:border-[#C59B27] hover:text-[#C59B27] hover:bg-amber-50/50 transition-all text-center"
                                        >
                                            {city.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Footer Warning */}
                    <div className="px-8 py-5 bg-stone-50 border-t border-stone-100 flex items-center gap-3">
                        <AlertCircle className="w-4 h-4 text-[#C59B27]" />
                        <p className="text-[10px] text-stone-500 font-medium">Delivery times and availability may vary based on your selected location.</p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default PincodeModal;
