import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useShop } from '../../../context/ShopContext';
import Loader from '../../shared/components/Loader';

import fallbackCategoryImage from '@assets/cat_all_premium.png';

const toSlug = (value) => String(value || '').trim();

const JewelleryCollectionsPage = () => {
  const { categories = [], isLoading } = useShop();

  const visibleCategories = useMemo(() => {
    return (categories || [])
      .filter((cat) => cat?.isActive !== false && cat?.showInCollection !== false)
      .sort((a, b) => Number(a?.sortOrder ?? 0) - Number(b?.sortOrder ?? 0)
        || String(a?.name || '').localeCompare(String(b?.name || '')));
  }, [categories]);

  if (isLoading) return <Loader />;

  return (
    <div className="min-h-screen bg-[#FAF8F5] pt-10 pb-20 px-4 md:px-8 font-sans">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12 md:mb-16">
          <h1 className="font-serif text-3xl md:text-5xl text-[#141211] mb-4 tracking-tight">
            Shop by Category
          </h1>
          <p className="text-stone-500 text-sm md:text-base max-w-2xl mx-auto font-light leading-relaxed">
            Explore our catalogue by category. Each card takes you to the filtered shop page.
          </p>
          <div className="w-12 h-[1px] bg-[#C59B27] mx-auto mt-6 opacity-60" />
        </div>

        {visibleCategories.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center shadow-sm">
            <h2 className="text-xl font-serif text-gray-900 mb-2">No categories available</h2>
            <p className="text-sm text-gray-500">
              Please check back later.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 md:gap-8">
            {visibleCategories.map((cat, idx) => {
              let slug = toSlug(cat?.slug || cat?.path);
              slug = slug.replace(/^\/+/, '');
              if (slug.toLowerCase().startsWith('category/')) {
                slug = slug.slice('category/'.length);
              }
              const href = slug
                ? `/category/${slug}`
                : (cat?._id ? `/shop?category=${encodeURIComponent(String(cat._id))}` : '/shop');
              const image = cat?.image || fallbackCategoryImage;

              return (
                <motion.div
                  key={cat?._id || cat?.id || slug || cat?.name || idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.05 }}
                >
                  <Link to={href} className="group block text-center">
                    <div className="relative aspect-square mb-4 transition-all duration-700">
                      <div className="w-full h-full rounded-[2rem] overflow-hidden border border-[#E8DFD0] shadow-sm relative group-hover:shadow-[0_20px_40px_rgba(197,155,39,0.2)] group-hover:-translate-y-2 transition-all duration-500">
                        <img
                          src={image}
                          alt={cat?.name || 'Category'}
                          className="w-full h-full object-cover transition-transform duration-[1200ms] group-hover:scale-110"
                        />

                        <div className="absolute inset-0 bg-gradient-to-t from-[#141211]/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        <div className="absolute inset-0 border-0 group-hover:border-[8px] border-[#C59B27]/20 transition-all duration-500 rounded-[2rem] pointer-events-none" />
                      </div>

                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500 z-20">
                        <span className="bg-white text-[#141211] border border-[#C59B27]/30 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-xl whitespace-nowrap group-hover:text-[#C59B27]">
                          Explore
                        </span>
                      </div>
                    </div>

                    <h3 className="font-serif text-base md:text-lg text-[#111] group-hover:text-[#C59B27] transition-colors duration-300 tracking-wide font-medium">
                      {cat?.name || 'Category'}
                    </h3>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default JewelleryCollectionsPage;
