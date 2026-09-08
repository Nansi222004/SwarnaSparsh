import React from 'react';
import { ChevronDown } from 'lucide-react';

export const AccordionItem = ({ title, children, isOpen, onClick }) => (
    <div className="border-b border-[#E8DFD0]/80">
        <button
            className="w-full py-5 flex items-center justify-center md:justify-between text-center md:text-left focus:outline-none group relative"
            onClick={onClick}
        >
            <span className={`font-sans text-lg font-semibold transition-colors ${isOpen ? 'text-[#141211]' : 'text-stone-700 group-hover:text-[#141211]'}`}>
                {title}
            </span>
            <span className={`md:static absolute right-0 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                <ChevronDown className={`w-5 h-5 ${isOpen ? 'text-[#C59B27]' : 'text-stone-400 group-hover:text-[#C59B27]'}`} />
            </span>
        </button>
        <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[1000px] opacity-100 pb-4' : 'max-h-0 opacity-0'}`}
        >
            <div className="text-sm text-black leading-relaxed font-sans text-center md:text-left">
                {children}
            </div>
        </div>
    </div>
);
