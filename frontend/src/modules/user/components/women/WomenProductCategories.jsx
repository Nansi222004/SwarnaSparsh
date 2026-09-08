import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { buildWomenShopPath } from '../../utils/womenNavigation';
import { resolveLegacyCmsAsset } from '../../utils/legacyCmsAssets';

// Import images from assets
import RingsImg from '@assets/women-categories/Rings.png';
import EarringsImg from '@assets/women-categories/Earrings.png';
import BraceletsImg from '@assets/women-categories/Bracelets.png';
import PendantsImg from '@assets/women-categories/Pendants.png';
import ChainsImg from '@assets/women-categories/Chains.png';
import BanglesImg from '@assets/women-categories/Bangles.png';
import SetsImg from '@assets/women-categories/Sets.png';
import PersonalisedImg from '@assets/women-categories/Personalised.png';

const defaultCategories = [
    { id: 'women-rings', title: 'RINGS', image: RingsImg, path: buildWomenShopPath({ category: 'rings' }) },
    { id: 'women-earrings', title: 'EARRINGS', image: EarringsImg, path: buildWomenShopPath({ category: 'earrings' }) },
    { id: 'women-bracelets', title: 'BRACELETS', image: BraceletsImg, path: buildWomenShopPath({ category: 'bracelets' }) },
    { id: 'women-pendants', title: 'PENDANTS', image: PendantsImg, path: buildWomenShopPath({ category: 'pendants' }) },
    { id: 'women-chains', title: 'CHAINS', image: ChainsImg, path: buildWomenShopPath({ category: 'chains' }) },
    { id: 'women-bangles', title: 'BANGLES', image: BanglesImg, path: buildWomenShopPath({ category: 'bangles' }) },
    { id: 'women-sets', title: 'SETS', image: SetsImg, path: buildWomenShopPath({ category: 'sets' }) },
    { id: 'women-personalised', title: 'PERSONALISED', image: PersonalisedImg, path: buildWomenShopPath({ category: 'personalised' }) }
];

const normalizeCategoryKey = (value = '') => (
    String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
);

const WomenProductCategories = ({ sectionData }) => {
    const categories = useMemo(() => {
        const configuredItems = Array.isArray(sectionData?.items) ? sectionData.items : [];
        const normalized = configuredItems
            .map((item, index) => {
                const title = String(item?.name || item?.label || '').trim();
                const image = item?.image
                    ? resolveLegacyCmsAsset(item.image, defaultCategories[index]?.image || defaultCategories[0].image)
                    : (defaultCategories[index]?.image || defaultCategories[0].image);
                const fallbackCategory = normalizeCategoryKey(title) || normalizeCategoryKey(defaultCategories[index]?.title);

                if (!title || !image) return null;

                return {
                    id: item.itemId || item.id || `women-category-${index + 1}`,
                    title: title.toUpperCase(),
                    image,
                    path: item.path || buildWomenShopPath({ category: fallbackCategory || 'women' })
                };
            })
            .filter(Boolean);

        // Keep the exact original 8-card UI when CMS payload is incomplete.
        if (normalized.length < defaultCategories.length) {
            return defaultCategories;
        }

        return normalized.length > 0 ? normalized : defaultCategories;
    }, [sectionData]);

    const resolvedTitle = sectionData?.settings?.title || 'Shop by Category';
    const resolvedSubtitle = sectionData?.settings?.subtitle
        || 'Handcrafted silver masterpieces, each piece telling a unique story of elegance.';

    return (
        <section className="py-6 md:py-8 px-4 md:px-12 bg-white">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-6 md:mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="flex flex-col items-center space-y-2"
                    >
                        <h2 className="text-2xl md:text-3xl font-serif text-[#7A2E3A] tracking-tight">
                            {resolvedTitle}
                        </h2>
                        <p className="text-zinc-500 font-light text-xs md:text-sm max-w-xl mx-auto px-4 leading-relaxed">
                            {resolvedSubtitle}
                        </p>
                    </motion.div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3 md:gap-6">
                    {categories.map((category, index) => (
                        <motion.div
                            key={category.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: index * 0.05 }}
                            viewport={{ once: true }}
                            className="flex flex-col items-center group cursor-pointer"
                        >
                            <Link 
                                to={category.path}
                                className="relative block w-full aspect-square rounded-xl overflow-hidden bg-zinc-50 shadow-sm border border-zinc-100 transition-all duration-500 hover:shadow-md hover:-translate-y-1"
                            >
                                <img 
                                    src={category.image} 
                                    alt={category.title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    onError={(event) => {
                                        event.currentTarget.src = defaultCategories[index]?.image || defaultCategories[0].image;
                                    }}
                                />
                            </Link>

                            <div className="mt-2 text-center">
                                <h3 className="text-[#333333] font-serif text-sm md:text-base transition-colors duration-300 group-hover:text-[#7A2E3A]">
                                    {category.title.charAt(0) + category.title.slice(1).toLowerCase()}
                                </h3>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default WomenProductCategories;

