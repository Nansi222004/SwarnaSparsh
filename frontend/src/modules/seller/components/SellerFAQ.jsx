import React, { useState } from 'react';
import { Plus, Minus, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SellerFAQ = () => {
    const [activeFaq, setActiveFaq] = useState(null);

    const faqs = [
        {
            question: "How long does it take for a payment to be verified?",
            answer: "Payment verification typically happens within 2-4 hours for online transactions. For bank transfers, it may take up to 24-48 business hours."
        },
        {
            question: "What is the policy for return shipping costs?",
            answer: "Return shipping costs are generally borne by the seller if the product is defective or incorrect. For 'Customer Choice' returns, the cost may be shared or borne by the customer depending on the specific return reason."
        },
        {
            question: "How do I update the tracking information?",
            answer: "Once you mark an order as 'Accepted', you can generate a manifest or manually input the tracking ID provided by your logistics partner in the order lifecycle section."
        },
        {
            question: "When will the funds be settled in my account?",
            answer: "Settlements are processed on a weekly cycle every Tuesday for orders delivered and completed in the previous week."
        }
    ];

    const toggleFaq = (index) => {
        setActiveFaq(activeFaq === index ? null : index);
    };

    return (
        <section className="py-12 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-8 mb-8 flex items-center gap-3">
                <div className="p-2 bg-[#FAF8F5] rounded-lg">
                    <MessageSquare size={20} className="text-[#C59B27]" />
                </div>
                <div>
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Merchant Operational Support</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Frequently Asked Questions</p>
                </div>
            </div>

            <div className="px-8 space-y-3">
                {faqs.map((faq, index) => (
                    <div
                        key={index}
                        className={`rounded-xl border transition-all duration-300 ${activeFaq === index
                            ? 'border-[#3E2723] bg-[#FDFBF7]'
                            : 'border-gray-50 bg-gray-50/30 hover:bg-gray-50'
                            }`}
                    >
                        <button
                            onClick={() => toggleFaq(index)}
                            className="w-full text-left px-6 py-4 flex justify-between items-center gap-4"
                        >
                            <span className={`text-sm font-bold ${activeFaq === index ? 'text-[#3E2723]' : 'text-gray-700'}`}>
                                {faq.question}
                            </span>
                            <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-300 ${activeFaq === index ? 'bg-[#3E2723] text-white' : 'bg-white text-gray-400 border border-gray-100'
                                }`}>
                                {activeFaq === index ? <Minus size={12} /> : <Plus size={12} />}
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
                                    <div className="px-6 pb-6 pt-0">
                                        <p className="text-xs font-medium text-gray-500 leading-relaxed uppercase">
                                            {faq.answer}
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default SellerFAQ;
