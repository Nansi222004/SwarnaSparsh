import React from 'react';
import { Truck, RotateCcw, ShieldCheck, Sparkles, Sun } from 'lucide-react';

const WhyChooseUs = () => {
    const commitments = [
        { 
            icon: Sparkles, 
            title: "Pure 925", 
            subtitle: "SILVER", 
            text: "Certified Authenticity" 
        },
        { 
            icon: RotateCcw, 
            title: "30-Day Easy", 
            subtitle: "RETURN", 
            text: "Hassle-free Refund" 
        },
        { 
            icon: Truck, 
            title: "Free Delivery", 
            subtitle: "ABOVE ₹999", 
            text: "Reliable Shipping" 
        },
        { 
            icon: ShieldCheck, 
            title: "T&C Apply", 
            subtitle: "SECURE SHOP", 
            text: "Safe & Protected" 
        }
    ];

    return (
        <section className="py-20 bg-white overflow-hidden">
            <div className="container mx-auto px-4 md:px-6">
                {/* Section Header */}
                <div className="text-center mb-20 relative animate-in fade-in slide-in-from-bottom-10 duration-1000">
                    <span className="text-[10px] md:text-[11px] font-bold text-[#C59B27] uppercase tracking-[0.4em] mb-4 block">Our Commitments</span>
                    <h2 className="text-4xl md:text-5xl font-display text-[#141211] relative inline-block">
                        Why Choose Us
                        <div className="absolute -bottom-2 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#C59B27] to-transparent opacity-50" />
                    </h2>
                </div>

                {/* Arched Commitments Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
                    {commitments.map((item, index) => (
                        <div key={index} className="flex flex-col items-center group relative pt-12 pb-8 px-6 animate-in fade-in slide-in-from-bottom-12 duration-700" style={{ animationDelay: `${index * 150}ms` }}>
                            
                            {/* Decorative Arch Border */}
                            <div className="absolute inset-x-0 inset-y-0 border border-[#C59B27]/25 rounded-t-full rounded-b-2xl group-hover:border-[#C59B27]/60 transition-colors duration-500 shadow-sm" />
                            
                            {/* Corner Sunburst Accents */}
                            <div className="absolute top-8 left-6 text-[#C59B27]/40 group-hover:text-[#C59B27]/80 transition-all group-hover:rotate-45 duration-700">
                                <Sun className="w-4 h-4" />
                            </div>
                            <div className="absolute top-8 right-6 text-[#C59B27]/40 group-hover:text-[#C59B27]/80 transition-all group-hover:-rotate-45 duration-700">
                                <Sun className="w-4 h-4" />
                            </div>
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[#C59B27]/30">
                                <Sun className="w-2.5 h-2.5" />
                            </div>

                            {/* Center Content */}
                            <div className="relative z-10 flex flex-col items-center text-center">
                                {/* Icon with floating effect */}
                                <div className="mb-8 p-4 rounded-full bg-[#FAF8F5] text-[#C59B27] border border-[#E8DFD0] group-hover:scale-110 group-hover:bg-[#141211] group-hover:text-[#E8D198] group-hover:border-[#C59B27] transition-all duration-500 shadow-sm">
                                    <item.icon className="w-7 h-7" />
                                </div>

                                {/* Title with Brush Stroke Effect */}
                                <div className="relative mb-3 inline-block px-4">
                                    <div className="absolute inset-0 bg-[#C59B27]/15 blur-xl rounded-full scale-150 -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                    <h3 className="font-serif italic text-2xl text-[#141211] transition-colors duration-300">
                                        {item.title}
                                    </h3>
                                </div>

                                {/* Subtitle & Description */}
                                <div className="space-y-1">
                                    <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#C59B27] group-hover:text-[#141211] transition-colors">{item.subtitle}</h4>
                                    <p className="text-[11px] text-stone-500 font-medium tracking-wide opacity-80 group-hover:opacity-100 transition-opacity">{item.text}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default WhyChooseUs;
