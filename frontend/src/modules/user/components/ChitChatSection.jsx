import React, { useState } from 'react';
import { Send } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../services/api';
import defaultLogo from '@assets/logo.webp';
import { useSettings } from '../../../context/SettingsContext';

const ChitChatSection = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const { settings } = useSettings();
    const logo = settings?.logo || defaultLogo;
    const title = "We're Here for You";
    const subtitle = "Questions or styling advice? We'd love to hear from you.";
    const responseText = 'Replies within 2 hours';
    const submitLabel = 'Send Message';
    const successMessage = "Thanks for chatting with us! We'll get back to you shortly.";

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (submitting) return;

        // Front-end email validation regex matching the backend pattern
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test((formData.email || "").trim())) {
            toast.error('Please enter a valid email address.');
            return;
        }

        setSubmitting(true);
        try {
            const res = await api.post('public/contact', {
                ...formData,
                source: 'Homepage Chit Chat Form'
            });

            if (res.data?.success) {
                toast.success(res.data.message || successMessage);
                setFormData({ name: '', email: '', message: '' });
            } else {
                toast.error(res.data?.message || 'Failed to send message.');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send message.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section className="py-10 md:py-14 bg-[#141211] relative overflow-hidden">
            {/* Subtle Background Lighting */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#1C1917] rounded-full blur-[100px] opacity-40 translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#C59B27] rounded-full blur-[120px] opacity-10 -translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

            <div className="container mx-auto px-4 md:px-6 relative z-10 max-w-[1000px]">
                <div className="mx-auto bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
                    <div className="flex flex-col md:flex-row">

                        {/* Text Content Side (Slimmer & Elegant) */}
                        <div className="w-full md:w-5/12 p-6 md:p-10 bg-[#1C1917] relative flex flex-col justify-center">
                            <div className="mb-4">
                                <img 
                                    src={logo} 
                                    alt="Swarna Sparsh" 
                                    className="w-12 md:w-14 h-auto mb-4 object-contain drop-shadow-md" 
                                />
                                <h2 className="font-serif text-2xl md:text-3xl text-white mb-2 leading-tight tracking-wide">
                                    {title}
                                </h2>
                                <p className="text-white/70 font-sans text-sm leading-relaxed md:max-w-[280px]">
                                    {subtitle}
                                </p>
                            </div>
                            
                            <div className="flex items-center gap-3 mt-auto pt-4 md:pt-0">
                                <div className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#34D399] opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#34D399]"></span>
                                </div>
                                <span className="text-[11px] text-white/80 tracking-widest font-semibold uppercase">
                                    {responseText}
                                </span>
                            </div>
                        </div>

                        {/* Form Side (Compact & Professional) */}
                        <div className="w-full md:w-7/12 p-6 md:p-10 bg-white shadow-inner flex flex-col justify-center">
                            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
                                {/* Name & Email side-by-side to save height */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
                                    <div>
                                        <label htmlFor="name" className="block text-[10px] font-bold text-[#C59B27] uppercase tracking-[0.2em] mb-1.5">Name</label>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-gray-200 rounded-md focus:bg-white focus:border-[#C59B27] focus:ring-1 focus:ring-[#C59B27]/20 transition-all outline-none text-[#111] placeholder-gray-400 text-sm"
                                            placeholder="Your Name"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="email" className="block text-[10px] font-bold text-[#C59B27] uppercase tracking-[0.2em] mb-1.5">Email</label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-gray-200 rounded-md focus:bg-white focus:border-[#C59B27] focus:ring-1 focus:ring-[#C59B27]/20 transition-all outline-none text-[#111] placeholder-gray-400 text-sm"
                                            placeholder="your@email.com"
                                            required
                                        />
                                    </div>
                                </div>
                                
                                <div>
                                    <label htmlFor="message" className="block text-[10px] font-bold text-[#C59B27] uppercase tracking-[0.2em] mb-1.5">Message</label>
                                    <textarea
                                        id="message"
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        rows="2"
                                        className="w-full px-4 py-3 bg-[#FAF8F5] border border-gray-200 rounded-md focus:bg-white focus:border-[#C59B27] focus:ring-1 focus:ring-[#C59B27]/20 transition-all outline-none text-[#111] placeholder-gray-400 resize-none text-sm leading-relaxed"
                                        placeholder="How can we help you today?"
                                        required
                                    ></textarea>
                                </div>
                                
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-[#141211] text-white font-semibold tracking-wider text-sm py-3 rounded-md hover:bg-[#1C1917] hover:text-[#E8D198] transition-all flex items-center justify-center gap-2 group mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    <span>{submitting ? 'Sending...' : submitLabel}</span>
                                    <Send className="w-3.5 h-3.5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform text-[#C59B27]" />
                                </button>
                            </form>
                        </div>

                    </div>
                </div>
            </div>
        </section>
    );
};

export default ChitChatSection;

