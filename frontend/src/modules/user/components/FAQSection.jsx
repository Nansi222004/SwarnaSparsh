import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHomepageCms } from '../hooks/useHomepageCms';

const FAQSection = () => {
    const { data: homepageSections = {} } = useHomepageCms();
    const [activeFaq, setActiveFaq] = useState(null);

    const FALLBACK_FAQS = [
        {
            question: "Is your jewellery made of real silver?",
            answer: "Yes, all our jewellery is crafted from high-quality 925 Sterling Silver. Each piece comes with a hallmark stamp of authenticity so you can shop with confidence."
        },
        {
            question: "How do I take care of my silver jewellery?",
            answer: "To keep your silver shining, store it in the provided zip-lock bag when not in use. Avoid direct contact with perfumes, lotions, and harsh chemicals. You can gently clean it with a soft cloth."
        },
        {
            question: "Do you offer a warranty on the plating?",
            answer: "Absolutely! We offer a 6-month warranty on the gold and rose gold plating of our silver jewellery. If you face any issues, just reach out to us."
        },
        {
            question: "What is your return and exchange policy?",
            answer: "We offer a hassle-free 7-day return and exchange policy. If you are not completely satisfied with your purchase, you can return it in its original condition within 7 days."
        }
    ];
    const sectionData = homepageSections?.faqs;
    const configuredItems = Array.isArray(sectionData?.items) ? sectionData.items : [];
    const faqs = configuredItems.length > 0
        ? configuredItems
            .map((item, index) => ({
                question: item.name || item.label || FALLBACK_FAQS[index]?.question || '',
                answer: item.description || FALLBACK_FAQS[index]?.answer || ''
            }))
            .filter((item) => item.question && item.answer)
        : FALLBACK_FAQS;

    const toggleFaq = (index) => {
        setActiveFaq(activeFaq === index ? null : index);
    };

    return (
        <section className="py-8 md:py-20 bg-[#FAF8F5] relative overflow-hidden">
            <div className="container mx-auto px-4 md:px-6 max-w-4xl relative z-10">
                <div className="text-center mb-8 md:mb-16">
                    <span className="text-[#C59B27] text-[10px] md:text-sm font-bold tracking-[0.2em] uppercase mb-2 block">Common Questions</span>
                    <h2 className="font-display text-2xl md:text-5xl text-[#141211]">{sectionData?.label || 'Frequently Asked Questions'}</h2>
                </div>

                <div className="space-y-3 md:space-y-4">
                    {faqs.map((faq, index) => (
                        <div
                            key={index}
                            className={`bg-white rounded-xl md:rounded-2xl border transition-all duration-300 ${activeFaq === index
                                ? 'border-[#C59B27] shadow-[0_10px_30px_rgba(197,155,39,0.1)]'
                                : 'border-stone-200/60 shadow-sm hover:shadow-md'
                                }`}
                        >
                            <button
                                onClick={() => toggleFaq(index)}
                                className="w-full text-left px-4 py-4 md:px-8 md:py-6 flex justify-between items-center gap-4"
                            >
                                <span className={`font-display text-sm md:text-xl font-medium ${activeFaq === index ? 'text-[#C59B27]' : 'text-[#141211]'}`}>
                                    {faq.question}
                                </span>
                                <span className={`flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center transition-colors duration-300 ${activeFaq === index ? 'bg-[#141211] text-[#E8D198]' : 'bg-[#FAF8F5] text-stone-600'
                                    }`}>
                                    {activeFaq === index ? <Minus size={14} className="md:w-4 md:h-4" /> : <Plus size={14} className="md:w-4 md:h-4" />}
                                </span>
                            </button>
                            <AnimatePresence>
                                {activeFaq === index && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="px-4 pb-4 md:px-8 md:pb-8 pt-0">
                                            <p className="text-gray-600 font-serif leading-relaxed text-sm md:text-base">
                                                {faq.answer}
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FAQSection;
