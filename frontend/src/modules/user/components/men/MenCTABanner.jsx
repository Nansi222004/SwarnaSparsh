import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const MenCTABanner = () => {
    const navigate = useNavigate();

    return (
        <section className="py-10 md:py-24 bg-gradient-to-r from-[#0A1F44] via-[#0F2A5F] to-[#1C3D8F] relative overflow-hidden">
            {/* Background design elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none mix-blend-overlay opacity-30">
                <div className="absolute top-1/2 left-1/4 w-[600px] h-[600px] bg-[#3B82F6] rounded-full blur-[150px] -translate-y-1/2" />
                <div className="absolute top-1/2 right-1/4 w-[600px] h-[600px] bg-[#1C3D8F] rounded-full blur-[150px] -translate-y-1/2" />
            </div>

            <div className="container mx-auto px-6 relative z-10">
                <div className="max-w-4xl mx-auto rounded-3xl p-1 bg-gradient-to-r from-transparent via-[#3B82F6]/50 to-transparent shadow-[0_0_60px_rgba(59,130,246,0.2)]">
                    <div className="bg-white/5 backdrop-blur-2xl rounded-3xl p-10 md:p-16 text-center border border-white/10">
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="font-serif text-4xl md:text-6xl font-bold text-white mb-6"
                            style={{ fontFamily: "'Poppins', sans-serif" }}
                        >
                            Flat <span className="text-[#3B82F6]">40% OFF</span> on Men's Collection
                        </motion.h2>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="inline-block bg-white/10 border border-dashed border-[#3B82F6] rounded-lg px-8 py-4 mb-10"
                        >
                            <p className="text-[#94A3B8] text-sm uppercase tracking-widest mb-1">Use Code</p>
                            <p className="text-white text-3xl font-black tracking-widest">PAYDAY</p>
                        </motion.div>

                        <div>
                            <motion.button
                                whileHover={{ scale: 1.05, backgroundColor: "#fff", color: "#0A1F44" }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate('/shop?category=men')}
                                className="px-10 py-4 bg-[#3B82F6] text-white font-bold tracking-widest uppercase rounded flex items-center justify-center gap-3 mx-auto transition-colors"
                            >
                                Explore Now
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M5 12h14"></path>
                                    <path d="m12 5 7 7-7 7"></path>
                                </svg>
                            </motion.button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default MenCTABanner;
