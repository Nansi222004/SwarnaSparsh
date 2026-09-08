import React from 'react';
import featureImg from '@assets/hero/image.png';

const WomenFeatureBanner = () => {
    return (
        <section className="w-full flex justify-center items-center py-4 md:py-10 bg-white">
            <div className="w-[92%] md:w-[85%] max-w-6xl overflow-hidden rounded-2xl md:rounded-[2.5rem] shadow-xl border border-gray-100">
                <img 
                    src={featureImg} 
                    alt="Feature Style Guide" 
                    className="w-full h-full object-cover"
                />
            </div>
        </section>
    );
};

export default WomenFeatureBanner;

