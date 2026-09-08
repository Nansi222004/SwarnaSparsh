import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { buildWomenShopPath } from '../../utils/womenNavigation';
import { resolveLegacyCmsAsset } from '../../utils/legacyCmsAssets';

import CoupleRingsImg from '@assets/promos/DarkCoupleRings.png';
import PremiumGiftsImg from '@assets/promos/DarkPremiumGifts.png';

const fallbackBanners = [
    {
        id: 'women-promo-1',
        title: "Couple Rings",
        subtitle: "Eternal Bonds in Silver",
        image: CoupleRingsImg,
        link: buildWomenShopPath({ category: 'rings' }),
        badge: 'Exclusive',
        ctaLabel: 'Shop Now'
    },
    {
        id: 'women-promo-2',
        title: "Premium Gifts",
        subtitle: "Luxury for your Loved Ones",
        image: PremiumGiftsImg,
        link: buildWomenShopPath({ filter: 'womens', category: 'pendants' }),
        badge: 'Exclusive',
        ctaLabel: 'Shop Now'
    }
];

const WomenPromoBanners = ({ sectionData }) => {
    const navigate = useNavigate();
    const banners = useMemo(() => {
        const configuredItems = Array.isArray(sectionData?.items) ? sectionData.items : [];
        const normalized = configuredItems
            .map((item, index) => ({
                id: item.itemId || item.id || `women-promo-${index + 1}`,
                title: item.name || item.label || `Banner ${index + 1}`,
                subtitle: item.subtitle || item.description || fallbackBanners[index]?.subtitle || '',
                image: resolveLegacyCmsAsset(item.image, fallbackBanners[index]?.image || ''),
                link: item.path || fallbackBanners[index]?.link || buildWomenShopPath({ filter: 'womens' }),
                badge: item.tag || fallbackBanners[index]?.badge || 'Exclusive',
                ctaLabel: item.ctaLabel || fallbackBanners[index]?.ctaLabel || 'Shop Now'
            }))
            .filter((item) => Boolean(item.title) && Boolean(item.subtitle) && Boolean(item.image) && Boolean(item.link))
            .slice(0, 2);

        return normalized.length === 2 ? normalized : fallbackBanners;
    }, [sectionData]);

    return (
        <section className="pt-0 pb-6 md:pb-10 bg-white px-4 sm:px-6">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-10">
                {banners.map((banner, index) => (
                    <motion.div
                        key={banner.id}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: index * 0.2 }}
                        viewport={{ once: true }}
                        onClick={() => navigate(banner.link)}
                        className="relative h-[140px] sm:h-[160px] md:h-[200px] rounded-[2rem] md:rounded-[3rem] overflow-hidden cursor-pointer group shadow-2xl bg-zinc-900"
                    >
                        {/* High-Resolution Imagery */}
                        <img 
                            src={banner.image} 
                            alt={banner.title}
                            className="absolute inset-0 w-full h-full object-cover opacity-80 transition-transform duration-[4s] group-hover:scale-110 group-hover:rotate-1"
                        />
                        
                        {/* Elegant Glass Overlays */}
                        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent group-hover:from-black/95 transition-colors duration-700" />
                        
                        {/* Text Content */}
                        <div className="absolute inset-0 flex flex-col justify-center px-7 sm:px-10 md:px-14 transform transition-transform duration-700 group-hover:translate-x-2">
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 }}
                            >
                                <span className="inline-block px-2.5 py-0.5 md:px-3 md:py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-white mb-2 md:mb-3 shadow-sm">
                                    {banner.badge}
                                </span>
                                <h3 className="text-xl sm:text-2xl md:text-4xl font-serif text-white tracking-tight leading-none mb-1 md:mb-2 transition-colors">
                                    {banner.title}
                                </h3>
                                <p className="text-zinc-300 text-[10px] sm:text-xs md:text-sm font-medium tracking-wide mb-3 md:mb-5">
                                    {banner.subtitle}
                                </p>
                                
                                {/* Refined Interactive CTA */}
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full bg-white text-black shadow-lg group-hover:w-28 transition-all duration-500 overflow-hidden relative">
                                        <div className="absolute left-1/2 -translate-x-1/2 group-hover:left-4 group-hover:translate-x-0 transition-all duration-500">
                                            <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                        </div>
                                        <span className="opacity-0 group-hover:opacity-100 ml-5 text-[10px] font-bold uppercase tracking-widest transition-opacity duration-300">
                                            {banner.ctaLabel}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Subtle Border Glow */}
                        <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-[2rem] md:rounded-[3rem]" />
                    </motion.div>
                ))}
            </div>
        </section>
    );
};

export default WomenPromoBanners;

