import React from 'react';
import { MessageCircle, Sparkles, Phone, ShieldCheck, ArrowRight } from 'lucide-react';

const DiamondConsultationBanner = ({ sectionData }) => {
    const settings = sectionData?.settings || {};
    const title = settings.title || 'Looking for a Bespoke Diamond Design?';
    const subtitle = settings.subtitle || 'Speak with our dedicated jewellery consultants to curate custom settings, solitaire rings, and personalised anniversary gifts crafted to your exact preferences.';
    const badge = settings.badge || 'Private Atelier Consultation';
    const rawNumber = String(settings.whatsappNumber || '919876543210').replace(/[^0-9]/g, '');
    const whatsappUrl = settings.ctaPath || `https://wa.me/${rawNumber}?text=${encodeURIComponent("Hello Alankar Jewellers, I'm interested in curating a bespoke diamond design.")}`;
    const ctaLabel = settings.ctaLabel || 'Consult on WhatsApp';

    return (
        <section className="py-16 md:py-24 bg-[#0E1217] text-white relative overflow-hidden">
            {/* Subtle luxury ambient glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#C6A04A]/10 blur-[120px] rounded-full pointer-events-none" />

            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#C6A04A]/30 bg-[#171E26] text-[#C6A04A] text-[10px] md:text-[11px] font-bold uppercase tracking-[0.25em] mb-6 shadow-sm">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{badge}</span>
                </div>

                {/* Title */}
                <h2 className="font-serif text-2xl sm:text-4xl md:text-5xl text-[#FAF8F5] font-normal tracking-tight max-w-3xl mx-auto leading-tight mb-4">
                    {title}
                </h2>

                {/* Subtitle */}
                <p className="text-xs sm:text-sm md:text-base text-stone-300 font-light max-w-2xl mx-auto leading-relaxed mb-8 sm:mb-10">
                    {subtitle}
                </p>

                {/* Trust Points */}
                <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-stone-400 font-medium mb-10">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-[#C6A04A]" />
                        <span>Certified Solitaire Sourcing</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-[#C6A04A]" />
                        <span>Custom 3D CAD Mockup</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-[#C6A04A]" />
                        <span>Complimentary Laser Engraving</span>
                    </div>
                </div>

                {/* Action CTAs */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white px-8 py-3.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all shadow-lg hover:shadow-xl hover:scale-102"
                    >
                        <MessageCircle className="w-4 h-4" />
                        <span>{ctaLabel}</span>
                    </a>

                    <a
                        href={`tel:+${rawNumber}`}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 px-8 py-3.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all"
                    >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Call Atelier Specialist</span>
                    </a>
                </div>
            </div>
        </section>
    );
};

export default DiamondConsultationBanner;
