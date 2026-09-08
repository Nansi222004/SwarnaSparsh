import React from 'react';

const Loader = ({ fullPage = true }) => {
  return (
    <div className={`${fullPage ? 'fixed inset-0 z-[9999] bg-[#FAF8F5]/90' : 'w-full py-12'} flex items-center justify-center backdrop-blur-md`}>
      <div className="relative">
        {/* Single Outer Ring - Hugging the logo closely */}
        <div className="absolute inset-4 md:inset-6 border-2 border-[#C59B27]/20 rounded-full"></div>
        <div className="absolute inset-4 md:inset-6 border-2 border-t-[#C59B27] border-r-[#E8D198] border-b-transparent border-l-transparent rounded-full animate-[spin_1.2s_linear_infinite]"></div>
        
        {/* Central Logo - Enlarged */}
        <div className="relative w-36 h-36 md:w-56 md:h-56 flex items-center justify-center">
          <img 
            src="/loader.png" 
            alt="Loading..." 
            className="w-full h-full object-contain animate-[loader-pulse_2s_ease-in-out_infinite]"
          />
        </div>
        
        {/* Loading Text */}
        <div className="absolute -bottom-16 md:-bottom-20 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <span className="font-serif text-[#141211] font-bold text-xs tracking-[0.35em] uppercase animate-pulse">
            Swarna Sparsh
          </span>
        </div>
      </div>
    </div>
  );
};

export default Loader;
