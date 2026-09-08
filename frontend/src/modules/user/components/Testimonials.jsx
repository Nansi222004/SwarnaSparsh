import React from "react";
import { motion } from "framer-motion";
import { Star, Sparkles, Quote } from "lucide-react";
import { useHomepageCms } from "../hooks/useHomepageCms";
import { resolveLegacyCmsAsset } from "../utils/legacyCmsAssets";
import { handleImageError } from "../../../utils/imageFallbacks";

// Import local high-end customer portraits
import customer1 from "@assets/testimonial_customer_1.png";
import customer2 from "@assets/testimonial_customer_2.png";
import customer3 from "@assets/testimonial_customer_3.png";

const TESTIMONIALS = [
  {
    id: 1,
    name: "Ananya Sharma",
    image: customer1,
    text: "A big shout out to you guys for improving my hubby's gifting tastes. Completely in love with my ring!",
    location: "Mumbai",
  },
  {
    id: 2,
    name: "Rahul Verma",
    image: customer2,
    text: "Never thought buying jewellery would be this easy, thanks for helping make my mom's birthday special.",
    location: "Delhi",
  },
  {
    id: 3,
    name: "Priya Patel",
    image: customer3,
    text: "Gifted these earrings to my sister on her wedding and she loved them! I am obsessed with buying gifts from Swarna Sparsh.",
    location: "Bangalore",
  },
];

const Testimonials = () => {
  const { data: homepageSections = {} } = useHomepageCms();
  const sectionData = homepageSections?.testimonials;
  const configuredItems = Array.isArray(sectionData?.items)
    ? sectionData.items
    : [];

  const displayItems =
    configuredItems.length > 0
      ? configuredItems.map((item, index) => ({
          id: item.itemId || item._id || item.id || `testimonial-${index + 1}`,
          name: item.name || TESTIMONIALS[index]?.name || "Patron Story",
          image: item.image ? resolveLegacyCmsAsset(item.image, item.image) : (TESTIMONIALS[index]?.image || null),
          text: item.description || TESTIMONIALS[index]?.text || "",
          location: item.location || TESTIMONIALS[index]?.location || "",
          rating: Number(item.rating || 5)
        }))
      : TESTIMONIALS.map(t => ({ ...t, rating: 5 }));

  if (displayItems.length === 0) return null;

  const prominentItem = displayItems[0];
  const supportingItems = displayItems.slice(1);

  return (
    <section className="w-full py-12 md:py-24 bg-white overflow-hidden border-t border-[#E8DFD0]/60">
      <div className="container mx-auto px-4 md:px-8 max-w-[1440px]">
        {/* Header */}
        <div className="text-center mb-10 md:mb-16">
          <div className="inline-flex items-center gap-2 mb-2 text-[#C59B27] text-[10px] uppercase font-bold tracking-[0.3em]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Cherished Words</span>
          </div>
          <h2 className="font-serif text-2xl md:text-4xl text-[#141211] font-normal tracking-tight">
            {sectionData?.label || "Customer Stories"}
          </h2>
          <div className="w-12 h-[1px] bg-[#C59B27] mx-auto mt-4" />
        </div>

        {/* ── EDITORIAL ASYMMETRIC TESTIMONIAL LAYOUT (Desktop md+) ── */}
        <div className="hidden md:grid md:grid-cols-12 gap-8 items-stretch">
          {/* Featured Prominent Testimonial (7 cols) */}
          {prominentItem && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="md:col-span-7 bg-[#FAF8F5] rounded-3xl p-8 lg:p-12 border border-[#E8DFD0] relative flex flex-col justify-between shadow-xs"
            >
              <div>
                {/* Large Decorative Quote Icon */}
                <div className="w-12 h-12 rounded-full bg-[#141211] text-[#E8D198] flex items-center justify-center mb-6 shadow-sm">
                  <Quote className="w-5 h-5 text-[#C59B27]" />
                </div>

                {/* Stars Rating */}
                <div className="flex gap-1 mb-6">
                  {[...Array(prominentItem.rating || 5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-[#C59B27] text-[#C59B27]"
                    />
                  ))}
                </div>

                {/* Quotation Text in Luxury Serif */}
                <p className="font-serif text-lg lg:text-2xl text-[#141211] font-normal italic leading-relaxed mb-8">
                  "{prominentItem.text}"
                </p>
              </div>

              {/* Author Info */}
              <div className="flex items-center gap-4 pt-6 border-t border-[#E8DFD0]">
                {prominentItem.image ? (
                  <img
                    src={prominentItem.image}
                    alt={prominentItem.name}
                    onError={(e) => handleImageError(e, customer1)}
                    className="w-14 h-14 rounded-full object-cover border-2 border-[#C59B27]/40 shadow-xs"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-[#141211] text-[#E8D198] font-serif font-bold text-lg flex items-center justify-center border border-[#C59B27]/40">
                    {prominentItem.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h4 className="font-serif text-base font-semibold text-[#141211]">
                    {prominentItem.name}
                  </h4>
                  {prominentItem.location && (
                    <p className="text-xs font-sans text-stone-500 tracking-wide uppercase">
                      {prominentItem.location}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Supporting Testimonials Column (5 cols) */}
          <div className="md:col-span-5 flex flex-col gap-6 justify-between">
            {supportingItems.slice(0, 2).map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="flex-1 bg-white rounded-3xl p-6 lg:p-8 border border-[#E8DFD0] hover:border-[#C59B27]/60 shadow-xs flex flex-col justify-between transition-all duration-300"
              >
                <div>
                  <div className="flex gap-1 mb-3">
                    {[...Array(item.rating || 5)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-3.5 h-3.5 fill-[#C59B27] text-[#C59B27]"
                      />
                    ))}
                  </div>
                  <p className="font-serif text-sm lg:text-base text-stone-800 font-normal italic leading-relaxed mb-4">
                    "{item.text}"
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-stone-100">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      onError={(e) => handleImageError(e, customer2)}
                      className="w-10 h-10 rounded-full object-cover border border-[#C59B27]/30"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-stone-100 text-stone-700 font-serif font-bold text-sm flex items-center justify-center border border-stone-200">
                      {item.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h5 className="font-serif text-xs font-semibold text-[#141211]">
                      {item.name}
                    </h5>
                    {item.location && (
                      <span className="text-[10px] text-stone-500 uppercase tracking-wider block">
                        {item.location}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── MOBILE SWIPE FLOW (< md) ── */}
        <div className="flex md:hidden overflow-x-auto gap-4 pb-4 px-1 scrollbar-hide snap-x snap-mandatory">
          {displayItems.map((item, index) => (
            <div
              key={item.id}
              className="flex-shrink-0 w-[85%] snap-center bg-[#FAF8F5] rounded-2xl p-6 border border-[#E8DFD0] shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex gap-1 mb-3">
                  {[...Array(item.rating || 5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-3.5 h-3.5 fill-[#C59B27] text-[#C59B27]"
                    />
                  ))}
                </div>
                <p className="font-serif text-sm text-[#141211] italic leading-relaxed mb-4">
                  "{item.text}"
                </p>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-[#E8DFD0]/60">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    onError={(e) => handleImageError(e, customer1)}
                    className="w-10 h-10 rounded-full object-cover border border-[#C59B27]/40"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#141211] text-[#E8D198] font-serif font-bold text-xs flex items-center justify-center">
                    {item.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h4 className="font-serif text-xs font-bold text-[#141211]">
                    {item.name}
                  </h4>
                  {item.location && (
                    <p className="text-[10px] text-stone-500 uppercase tracking-wider">
                      {item.location}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
