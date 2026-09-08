import React, { useState } from 'react';
import { Mail, Sparkles, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSettings } from '../../../context/SettingsContext';

const Newsletter = () => {
    const { settings } = useSettings();
    const [email, setEmail] = useState('');

    const storeEmail = settings?.email || 'support@swarnasparsh.com';
    const storeName = settings?.storeName || 'Swarna Sparsh';

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!email.trim()) {
            toast.error('Please enter your email address');
            return;
        }

        // As per architecture guidelines: Newsletter subscription backend is not yet connected.
        // We provide a transparent informative notice and facilitate direct contact via store email.
        toast(`Atelier newsletter is currently in preview. For private inquiries, contact ${storeEmail}`, {
            icon: '✉️',
            duration: 4000
        });
        setEmail('');
    };

    return (
        <section className="w-full bg-[#FAF8F5] py-16 md:py-24 border-t border-[#E8DFD0]/70 relative overflow-hidden">
            {/* Subtle decorative geometric corner motifs */}
            <div className="absolute top-0 left-0 w-32 h-32 border-r border-b border-[#C59B27]/15 rounded-br-[60px] pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-32 h-32 border-l border-t border-[#C59B27]/15 rounded-tl-[60px] pointer-events-none" />

            <div className="container mx-auto px-4 md:px-8 max-w-[860px] relative z-10 text-center">
                <div className="inline-flex items-center gap-2 mb-3 text-[#C59B27] text-[10px] uppercase font-bold tracking-[0.3em]">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>The Atelier Circle</span>
                </div>

                <h2 className="font-serif text-3xl md:text-5xl text-[#141211] font-normal tracking-tight mb-4">
                    Join the {storeName} Circle
                </h2>

                <div className="w-12 h-[1px] bg-[#C59B27] mx-auto mb-6" />

                <p className="font-sans text-stone-600 text-sm md:text-base font-light leading-relaxed max-w-xl mx-auto mb-8">
                    Receive private previews, bespoke bridal styling invitations, and seasonal jewellery drops directly to your inbox.
                </p>

                {/* Subscription Form */}
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-3 max-w-lg mx-auto">
                    <div className="relative w-full">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[#C59B27]">
                            <Mail className="w-4 h-4" />
                        </div>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email address"
                            className="w-full pl-11 pr-4 py-3.5 bg-white rounded-full border border-[#E8DFD0] focus:border-[#C59B27] focus:ring-2 focus:ring-[#C59B27]/10 outline-none text-stone-900 placeholder:text-stone-400 text-sm transition-all shadow-xs"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 bg-[#141211] hover:bg-[#C59B27] text-[#FAF8F5] hover:text-[#141211] font-sans font-bold text-xs uppercase tracking-[0.16em] px-8 py-3.5 rounded-full transition-all duration-300 shadow-sm border border-[#141211] hover:border-[#C59B27]"
                    >
                        <span>Join The Circle</span>
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </form>

                <p className="text-[11px] text-stone-400 mt-4 tracking-wide font-light">
                    We respect your privacy. Inquiries: <a href={`mailto:${storeEmail}`} className="underline hover:text-[#C59B27] transition-colors">{storeEmail}</a>
                </p>
            </div>
        </section>
    );
};

export default Newsletter;
