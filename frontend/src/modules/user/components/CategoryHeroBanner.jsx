import React from 'react';

const CategoryHeroBanner = ({ category }) => {
    if (!category) return null;

    const title = (category.bannerTitle || category.name || '').trim();
    const subtitle = (category.bannerSubtitle || category.description || '').trim();
    const image = category.bannerImage || category.image || '';

    return (
        <section className="mb-6 md:mb-10">
            <div className="relative overflow-hidden rounded-3xl border border-[#E8DFD0] bg-[#FAF8F5] shadow-sm">
                {image ? (
                    <div className="relative h-[170px] md:h-[260px]">
                        <img
                            src={image}
                            alt={title || category.name || 'Category banner'}
                            className="absolute inset-0 h-full w-full object-cover"
                            loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/35 to-black/10" />
                        <div className="absolute inset-0 flex items-end">
                            <div className="w-full p-5 md:p-10">
                                {title && (
                                    <h2 className="text-white text-2xl md:text-4xl font-serif font-medium tracking-tight drop-shadow-sm">
                                        {title}
                                    </h2>
                                )}
                                {subtitle && (
                                    <p className="mt-2 max-w-2xl text-white/85 text-xs md:text-base font-medium leading-relaxed drop-shadow-sm">
                                        {subtitle}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="px-5 py-6 md:px-10 md:py-10">
                        {title && (
                            <h2 className="text-black text-2xl md:text-4xl font-serif font-medium tracking-tight">
                                {title}
                            </h2>
                        )}
                        {subtitle && (
                            <p className="mt-2 max-w-2xl text-gray-600 text-xs md:text-base font-medium leading-relaxed">
                                {subtitle}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
};

export default CategoryHeroBanner;

