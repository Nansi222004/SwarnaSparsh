import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RefreshCw, Loader2 } from 'lucide-react';

const ImageLightbox = ({ images, currentIndex, isOpen, onClose, onPrev, onNext }) => {
    const [zoom, setZoom] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const containerRef = useRef(null);

    // Reset zoom and loading state when image changes
    useEffect(() => {
        setZoom(1);
        setIsLoading(true);
    }, [currentIndex]);

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.5, 4));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.5, 1));
    const handleReset = () => setZoom(1);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl touch-none"
                onClick={onClose}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 z-[110] p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all border border-white/10 backdrop-blur"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Main Image Container */}
                <div 
                    ref={containerRef}
                    className="relative w-full h-full flex items-center justify-center overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Placeholder (Low-res blurred) */}
                    <motion.img
                        key={`placeholder-${currentIndex}`}
                        src={images[currentIndex]}
                        className="absolute inset-0 w-full h-full object-contain blur-2xl opacity-30 scale-110 pointer-events-none"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.3 }}
                    />

                    {/* Loading Spinner */}
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                            <Loader2 className="w-10 h-10 text-white/40 animate-spin" />
                        </div>
                    )}

                    {/* High-res Image */}
                    <motion.div
                        className="w-full h-full flex items-center justify-center"
                        style={{ scale: zoom }}
                        drag={zoom > 1}
                        dragConstraints={containerRef}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ 
                            scale: zoom, 
                            opacity: isLoading ? 0 : 1,
                            transition: { duration: 0.4, ease: "easeOut" }
                        }}
                    >
                        <img
                            src={images[currentIndex]}
                            alt="Product view"
                            className="max-w-[90%] max-h-[90vh] object-contain select-none shadow-2xl"
                            onLoad={() => setIsLoading(false)}
                            draggable={false}
                        />
                    </motion.div>

                    {/* Navigation Buttons (Desktop) */}
                    <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none">
                        <button
                            onClick={onPrev}
                            className="p-4 rounded-full bg-black/40 hover:bg-black/60 text-white transition-all backdrop-blur-md pointer-events-auto border border-white/10 group"
                        >
                            <ChevronLeft className="w-8 h-8 group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <button
                            onClick={() => onNext()}
                            className="p-4 rounded-full bg-black/40 hover:bg-black/60 text-white transition-all backdrop-blur-md pointer-events-auto border border-white/10 group"
                        >
                            <ChevronRight className="w-8 h-8 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>

                    {/* Zoom Controls */}
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 p-2 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 z-[120]">
                        <button onClick={handleZoomOut} className="p-3 text-white/80 hover:text-white transition-colors hover:bg-white/10 rounded-xl"><ZoomOut className="w-5 h-5" /></button>
                        <div className="w-[1px] h-4 bg-white/20" />
                        <button onClick={handleReset} className="px-4 py-2 text-xs font-bold text-white/80 hover:text-white transition-colors flex items-center gap-2 hover:bg-white/10 rounded-xl uppercase tracking-widest">
                            <RefreshCw className="w-4 h-4" /> {Math.round(zoom * 100)}%
                        </button>
                        <div className="w-[1px] h-4 bg-white/20" />
                        <button onClick={handleZoomIn} className="p-3 text-white/80 hover:text-white transition-colors hover:bg-white/10 rounded-xl"><ZoomIn className="w-5 h-5" /></button>
                    </div>
                </div>

                {/* Thumbnails Row */}
                <div className="absolute bottom-32 left-0 right-0 flex justify-center gap-3 px-4 z-[120]">
                    {images.map((img, idx) => (
                        <button
                            key={idx}
                            onClick={() => onNext(idx)}
                            className={`relative w-14 h-14 rounded-lg overflow-hidden border-2 transition-all shadow-lg ${currentIndex === idx ? 'border-[#C59B27] scale-110 shadow-[0_0_12px_rgba(197,155,39,0.4)]' : 'border-white/10 opacity-50 hover:opacity-100 hover:border-white/40'}`}
                        >
                            <img src={img} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ImageLightbox;
