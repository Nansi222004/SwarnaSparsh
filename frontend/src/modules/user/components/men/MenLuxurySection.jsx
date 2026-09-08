import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { buildMenShopPath } from '../../utils/menNavigation';
import { resolveLegacyCmsAsset } from '../../utils/legacyCmsAssets';
import luxuryRing from '@assets/luxury_ring_men.png';
import luxuryGifts from '@assets/luxury_gifts_men.png';
import luxuryPendant from '@assets/luxury_pendant_men.png';

const luxuryOffers = [
    {
        title: 'Under INR 2999',
        image: luxuryRing,
        link: buildMenShopPath({ priceMax: 2999 })
    },
    {
        title: 'Premium GIFTS',
        image: luxuryGifts,
        link: buildMenShopPath()
    },
    {
        title: 'Under INR 4999',
        image: luxuryPendant,
        link: buildMenShopPath({ priceMax: 4999 })
    }
];

const MenLuxurySection = ({ sectionData }) => {
    const navigate = useNavigate();

    const resolvedSectionTitle = sectionData?.settings?.title || 'Luxury Within Reach';
    const resolvedOffers = useMemo(() => {
        const configuredItems = Array.isArray(sectionData?.items) ? sectionData.items : [];
        const normalizedConfigured = configuredItems
            .filter((item) => item?.image)
            .map((item, index) => {
                const fallbackOffer = luxuryOffers[index];
                const priceMax = Number(item.priceMax);
                const isPriceCard = Number.isFinite(priceMax) && priceMax > 0;
                const title = item.type === 'gifts'
                    ? 'Premium GIFTS'
                    : (isPriceCard ? `Under INR ${priceMax}` : (item.name || fallbackOffer?.title || ''));

                return {
                    title,
                    image: resolveLegacyCmsAsset(item.image, fallbackOffer?.image || ''),
                    link: (() => {
                        const categoryQuery = String(item.path || '').includes('category=')
                            ? String(item.path).split('category=')[1]?.split('&')[0]
                            : '';

                        if (isPriceCard && categoryQuery) {
                            return buildMenShopPath({ category: categoryQuery, priceMax });
                        }

                        if (isPriceCard) {
                            return buildMenShopPath({ priceMax });
                        }

                        return item.path || fallbackOffer?.link || buildMenShopPath();
                    })()
                };
            })
            .filter((item) => item.title && item.image && item.link);

        return normalizedConfigured.length > 0 ? normalizedConfigured : luxuryOffers;
    }, [sectionData]);

    return (
        <section className="pt-0 pb-2 md:pt-1 md:pb-6 bg-white overflow-hidden">
            <div className="container mx-auto px-4 max-w-[950px]">
                <h2 className="text-lg md:text-4xl font-bold text-[#101828] text-center mb-2 md:mb-10 tracking-tight font-serif">
                    {resolvedSectionTitle}
                </h2>

                <div className="flex flex-row overflow-x-auto md:grid md:grid-cols-3 gap-3 md:gap-8 items-center no-scrollbar pb-2 -mx-4 px-4 md:mx-0 md:px-0">
                    {resolvedOffers.map((offer, idx) => (
                        <motion.div
                            key={`${offer.title}-${idx}`}
                            initial={{ opacity: 0, y: 15, scale: 0.95 }}
                            whileInView={{
                                opacity: 1,
                                y: 0,
                                scale: 1
                            }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: idx * 0.1 }}
                            onClick={() => navigate(offer.link)}
                            className={`relative group shrink-0 w-[145px] md:w-auto md:flex-1 cursor-pointer overflow-hidden rounded-xl md:rounded-[40px] border border-[#D4AF37]/30 md:border-[1.5px] aspect-square md:aspect-[0.92/1] shadow-md md:shadow-lg hover:shadow-xl transition-all duration-500 ${idx === 1 ? 'md:z-10 md:shadow-xl' : 'z-0'}`}
                        >
                            <img
                                src={offer.image}
                                alt={offer.title}
                                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                            />

                            <div className="absolute bottom-0 left-0 w-full h-[30%] md:h-[24%] bg-black/80 flex flex-col md:flex-row items-center justify-center px-1 md:px-4">
                                <div className="text-white flex flex-col md:flex-row items-center md:items-baseline justify-center gap-0 md:gap-1 font-display">
                                    {offer.title.toLowerCase().startsWith('under inr ') ? (
                                        <>
                                            <span className="font-light uppercase text-[6px] md:text-xs tracking-[0.1em] md:tracking-[0.2em] opacity-80 mt-1 md:mt-0">Under</span>
                                            <span className="text-[10px] md:text-3xl font-bold tracking-tight">
                                                INR {offer.title.replace(/^Under INR\s+/i, '')}
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="font-light uppercase text-[6px] md:text-xs tracking-[0.1em] md:tracking-[0.2em] opacity-80 mt-1 md:mt-0">Premium</span>
                                            <span className="text-[10px] md:text-3xl font-bold uppercase tracking-widest">GIFTS</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default MenLuxurySection;

