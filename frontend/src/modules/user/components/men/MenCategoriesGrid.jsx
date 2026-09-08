import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { buildMenShopPath } from '../../utils/menNavigation';

import ringsImg from '@assets/images/men-categories/rings.png';
import cufflinksImg from '@assets/images/men-categories/cufflinks.png';
import chainsImg from '@assets/images/men-categories/chains.png';
import spiritualImg from '@assets/images/men-categories/spiritual.png';
import pendantsImg from '@assets/images/men-categories/pendants.png';
import braceletsImg from '@assets/images/men-categories/bracelets.png';
import setsImg from '@assets/images/men-categories/sets.png';
import customImg from '@assets/images/men-categories/custom.png';

const categories = [
    { title: 'Rings', image: ringsImg, link: buildMenShopPath({ category: 'rings' }) },
    { title: 'Cufflinks', image: cufflinksImg, link: buildMenShopPath({ category: 'cufflinks' }) },
    { title: 'Chains', image: chainsImg, link: buildMenShopPath({ category: 'chains' }) },
    { title: 'Spiritual Picks', image: spiritualImg, link: buildMenShopPath({ search: 'spiritual' }) },
    { title: 'Pendants', image: pendantsImg, link: buildMenShopPath({ category: 'pendants' }) },
    { title: 'Bracelets', image: braceletsImg, link: buildMenShopPath({ category: 'bracelets' }) },
    { title: 'Sets', image: setsImg, link: buildMenShopPath({ category: 'sets' }) },
    { title: 'Personalised', image: customImg, link: buildMenShopPath({ category: 'personalised' }) }
];

const normalizeCategorySlug = (value) =>
    String(value || '')
        .trim()
        .toLowerCase()
        .replace(/^\/category\//, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

const buildMenCategoryLink = (path, fallbackTitle) => {
    const sourcePath = String(path || '').trim();
    if (!sourcePath) return buildMenShopPath({ category: normalizeCategorySlug(fallbackTitle) });

    if (sourcePath.startsWith('/shop?')) {
        return sourcePath;
    }

    if (sourcePath.startsWith('/category/')) {
        return buildMenShopPath({ category: normalizeCategorySlug(sourcePath) });
    }

    if (sourcePath.includes('category=')) {
        const categoryValue = sourcePath.split('category=')[1]?.split('&')[0];
        return buildMenShopPath({ category: normalizeCategorySlug(categoryValue || fallbackTitle) });
    }

    return buildMenShopPath({ category: normalizeCategorySlug(fallbackTitle) });
};

const MenCategoriesGrid = ({ sectionData }) => {
    const navigate = useNavigate();

    const resolvedCategories = useMemo(() => {
        const configuredItems = Array.isArray(sectionData?.items) ? sectionData.items : [];
        const normalizedConfigured = configuredItems
            .filter((item) => item?.image)
            .map((item, index) => ({
                id: item.itemId || item.id || `men-category-${index}`,
                title: item.label || item.name || categories[index]?.title || '',
                image: item.image,
                link: buildMenCategoryLink(item.path, item.label || item.name || categories[index]?.title || '')
            }))
            .filter((item) => item.title && item.image && item.link);

        return normalizedConfigured.length > 0 ? normalizedConfigured : categories;
    }, [sectionData]);

    return (
        <section className="pt-2 pb-2 md:pt-8 md:pb-4 bg-white">
            <div className="container mx-auto px-4 max-w-[1200px]">
                {/* Header matching Screenshot 1 */}
                <div className="text-center mb-3 md:mb-8 flex flex-col items-center">
                    <h2 className="text-xl md:text-3xl font-bold tracking-tight text-black mb-0">
                        Discover by
                    </h2>
                    <h1 className="text-3xl md:text-6xl font-black uppercase tracking-wider text-black mt-[-2px]">
                        Category
                    </h1>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
                    {resolvedCategories.map((cat, idx) => (
                        <motion.div
                            key={cat.id || cat.title}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: idx * 0.05 }}
                            className="group relative cursor-pointer overflow-hidden rounded-[14px] md:rounded-[20px] aspect-[1/1.05] md:aspect-[0.9/1] shadow-md hover:shadow-xl transition-all"
                            onClick={() => navigate(cat.link)}
                        >
                            <img
                                src={cat.image}
                                alt={cat.title}
                                loading="lazy"
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />

                            {/* Dark gradient overlay for text readability */}
                            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-90 transition-opacity duration-500 group-hover:opacity-100" />

                            {/* Text label at bottom center */}
                            <div className="absolute bottom-3 md:bottom-4 left-0 w-full text-center px-2">
                                <h3 className="text-white font-bold tracking-[0.22em] uppercase text-[9px] md:text-[13px]">
                                    {cat.title}
                                </h3>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default MenCategoriesGrid;
