import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Heart, Star, Smile, Shield } from 'lucide-react';
import { buildFamilyShopPath } from '../utils/familyNavigation';

const FamilyMegaMenu = ({ resetMenu }) => {
    const familyLinks = [
        { name: "FOR MOTHER", icon: <Heart className="w-5 h-5 text-pink-400" />, path: buildFamilyShopPath({ recipient: 'mother' }), desc: "Elegant & Graceful" },
        { name: "FOR FATHER", icon: <Shield className="w-5 h-5 text-blue-400" />, path: buildFamilyShopPath({ recipient: 'father' }), desc: "Classic & Timeless" },
        { name: "FOR SISTER", icon: <Star className="w-5 h-5 text-purple-400" />, path: buildFamilyShopPath({ recipient: 'sister' }), desc: "Trendy & Sparkly" },
        { name: "FOR BROTHER", icon: <Users className="w-5 h-5 text-green-400" />, path: buildFamilyShopPath({ recipient: 'brother' }), desc: "Bold & Minimal" },
        { name: "FOR HUSBAND", icon: <Smile className="w-5 h-5 text-amber-500" />, path: buildFamilyShopPath({ recipient: 'husband' }), desc: "Sophisticated" },
        { name: "FOR WIFE", icon: <Heart className="w-5 h-5 text-red-400" />, path: buildFamilyShopPath({ recipient: 'wife' }), desc: "Romantic & Precious" },
    ];

    return (
        <div className="bg-white p-6 md:p-8 min-w-[300px] md:min-w-[500px] shadow-2xl border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 mb-2 md:mb-4">
                <h3 className="text-[#C59B27] text-[11px] font-black uppercase tracking-[0.3em]">
                    Shop for Family
                </h3>
            </div>
            
            {familyLinks.map((link) => (
                <Link
                    key={link.name}
                    to={link.path}
                    onClick={resetMenu}
                    className="flex items-center gap-4 px-4 py-3 md:px-5 md:py-4 rounded-xl hover:bg-[#FAF8F5] group transition-all duration-300 border border-transparent hover:border-[#C59B27]/20"
                >
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-50 group-hover:bg-white flex items-center justify-center transition-colors shadow-sm">
                        {link.icon}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[13px] md:text-[14px] font-black text-gray-800 tracking-wider group-hover:text-[#141211]">
                            {link.name}
                        </span>
                        <span className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                            {link.desc}
                        </span>
                    </div>
                </Link>
            ))}

            <div className="md:col-span-2 mt-4 pt-4 border-t border-gray-50 text-center">
                <Link 
                    to={buildFamilyShopPath()}
                    onClick={resetMenu}
                    className="inline-block text-[#C59B27] font-black text-[11px] uppercase tracking-widest hover:underline"
                >
                    View All Family Collections
                </Link>
            </div>
        </div>
    );
};

export default FamilyMegaMenu;
