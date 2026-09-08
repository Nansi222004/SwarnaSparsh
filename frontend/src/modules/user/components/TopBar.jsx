
import React from 'react';
import { Phone, Truck, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

const TopBar = () => {
    return (
        <div className="bg-[#141211] text-[#FAF8F5] border-b border-[#C59B27]/20 text-[11px] py-1.5 px-4 md:px-12 flex justify-between items-center tracking-wide z-50 relative">
            <div className="flex items-center gap-2">
                <Truck size={14} className="text-[#E8D198]" />
                <span className="font-medium text-[#FAF8F5]">Free Shipping On Orders Above ₹1499/-</span>
            </div>

            <div className="hidden md:flex items-center gap-6 text-[#FAF8F5]/80">
                <Link to="/about-us" className="hover:text-[#E8D198] transition-colors">About Us</Link>
                <Link to="/privacy-policy" className="hover:text-[#E8D198] transition-colors">Privacy Policy</Link>
                <Link to="/contact-us" className="flex items-center gap-1 hover:text-[#E8D198] transition-colors">
                    <Phone size={13} className="text-[#E8D198]" />
                    Contact Us
                </Link>
            </div>
        </div>
    );
};

export default TopBar;
