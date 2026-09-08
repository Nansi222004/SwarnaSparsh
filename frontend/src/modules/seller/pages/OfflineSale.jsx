import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScanLine, Search, AlertCircle, CheckCircle2, Box, ArrowLeft } from 'lucide-react';
import { sellerDirectSaleService } from '../services/sellerDirectSaleService';

const OfflineSale = () => {
    const navigate = useNavigate();
    const [scannedCode, setScannedCode] = useState('');
    const [result, setResult] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [confirming, setConfirming] = useState(false);

    const handleScan = (e) => {
        if (e) e.preventDefault();
        if (!scannedCode) return;

        setLoading(true);
        setResult(null);
        setPreview(null);

        sellerDirectSaleService.preview({ serialCode: scannedCode.toUpperCase() }).then(res => {
            setLoading(false);
            if (res?.success) {
                setPreview(res.data || res);
            } else {
                setResult(res);
            }
        });
    };

    const startScanner = () => {
        // Use the real camera scanner page (barcode/QR) instead of simulation.
        navigate('/seller/qr-scanner');
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/seller/dashboard')}
                    className="p-2.5 hover:bg-white rounded-xl border border-gray-100 shadow-sm transition-all"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-1">DIRECT CLIENT ACQUISITIONS</p>
                    <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">TERMINAL INTERFACE</h1>
                </div>
            </div>

            <div className="max-w-xl mx-auto">
                <div className="bg-[#0F172A] rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden transition-all duration-500 border border-white/5">
                    <div className="relative z-10 flex flex-col items-center text-center space-y-8">

                        {/* Scanner Icon/Feed Area */}
                        <div className="relative group">
                            <div className="w-24 h-24 rounded-full flex items-center justify-center border-2 transition-all duration-500 bg-blue-500/10 border-blue-500/20 group-hover:bg-blue-500/20 group-hover:border-blue-500/40">
                                <ScanLine className="w-12 h-12 transition-all duration-500 text-blue-500" />
                            </div>

                            <button
                                onClick={startScanner}
                                className="absolute -bottom-2 -right-2 bg-blue-600 p-2.5 rounded-xl shadow-lg hover:bg-blue-700 transition-all border border-blue-400/30"
                            >
                                <ScanLine className="w-4 h-4 text-white" />
                            </button>
                        </div>

                        <div>
                            <h2 className="text-white text-xl font-black uppercase tracking-[0.2em]">Inventory Reconciliation</h2>
                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-2 opacity-60">Scan or enter a serialized unit code for direct fulfillment</p>
                        </div>

                        <form onSubmit={handleScan} className="w-full space-y-6">
                            <div className="relative group">
                                <input
                                    value={scannedCode}
                                    onChange={(e) => setScannedCode(e.target.value)}
                                    placeholder="SERIAL CODE (e.g. ITEM010001234)"
                                    className="w-full bg-[#1E293B]/50 border border-white/10 rounded-2xl py-6 px-14 text-white text-xl font-mono focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-center tracking-widest shadow-inner placeholder:text-gray-600"
                                />
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-[1.25rem] font-black uppercase tracking-[0.3em] text-xs transition-all shadow-xl shadow-blue-500/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 group"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        Processing Transaction...
                                    </>
                                ) : (
                                    <>Register Fulfillment <CheckCircle2 className="w-4 h-4 group-hover:scale-110 transition-transform" /></>
                                )}
                            </button>
                        </form>

                        {preview && (
                            <div className="w-full p-4 rounded-2xl flex items-center gap-4 border animate-in zoom-in-95 duration-300 bg-white/5 border-white/10 text-white">
                                <Box className="w-6 h-6 shrink-0 text-blue-300" />
                                <div className="text-left flex-1">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300">
                                        {preview.available ? 'READY TO CONFIRM' : 'NOT AVAILABLE'}
                                    </p>
                                    <p className="text-xs font-bold">
                                        {preview.product?.name} ({preview.variant?.name || 'Standard'}) • ₹{preview.variant?.price || 0}
                                    </p>
                                    <p className="text-[10px] font-bold text-gray-400 italic">
                                        Serial: {preview.serialCode} • Stock: {preview.variant?.stock ?? 0}
                                    </p>
                                </div>
                                <button
                                    onClick={async () => {
                                        setConfirming(true);
                                        try {
                                            const res = await sellerDirectSaleService.confirm({ serialCode: preview.serialCode, paymentMethod: 'cash' });
                                            setResult(res);
                                            setPreview(null);
                                            if (res?.success) setScannedCode('');
                                        } finally {
                                            setConfirming(false);
                                        }
                                    }}
                                    disabled={confirming || preview.available === false}
                                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {confirming ? 'Saving...' : (preview.available ? 'Confirm' : 'N/A')}
                                </button>
                            </div>
                        )}

                        {result && (
                            <div className={`w-full p-4 rounded-2xl flex items-center gap-4 border animate-in zoom-in-95 duration-300 ${result.success ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                                {result.success ? <CheckCircle2 className="w-6 h-6 shrink-0" /> : <AlertCircle className="w-6 h-6 shrink-0" />}
                                <div className="text-left">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">{result.success ? 'SUCCESS' : 'ERROR'}</p>
                                    <p className="text-xs font-bold">{result.success ? 'Direct sale recorded. Stock updated.' : result.message}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
                </div>

                <div className="mt-8 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">How it works</h3>
                    <ul className="space-y-3">
                        <li className="flex gap-3 text-xs font-semibold text-gray-600">
                            <div className="w-5 h-5 bg-gray-50 rounded flex items-center justify-center shrink-0 text-[10px] border border-gray-100 italic">1</div>
                            <span>Enter a serialized unit code from a variant's unique code list.</span>
                        </li>
                        <li className="flex gap-3 text-xs font-semibold text-gray-600">
                            <div className="w-5 h-5 bg-gray-50 rounded flex items-center justify-center shrink-0 text-[10px] border border-gray-100 italic">2</div>
                            <span>The system checks whether that serialized unit is still AVAILABLE.</span>
                        </li>
                        <li className="flex gap-3 text-xs font-semibold text-gray-600">
                            <div className="w-5 h-5 bg-gray-50 rounded flex items-center justify-center shrink-0 text-[10px] border border-gray-100 italic">3</div>
                            <span>If valid, that unit becomes SOLD_OFFLINE and the variant stock decreases automatically.</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default OfflineSale;
