import React from "react";
import { motion } from "framer-motion";
import { useHomepageCms } from "../hooks/useHomepageCms";
import { resolveLegacyCmsAsset } from "../utils/legacyCmsAssets";

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
          name: item.name || TESTIMONIALS[index]?.name || "Customer Story",
          image: resolveLegacyCmsAsset(
            item.image,
            TESTIMONIALS[index]?.image || customer1,
          ),
          text: item.description || TESTIMONIALS[index]?.text || "",
          location: item.location || TESTIMONIALS[index]?.location || "",
        }))
      : TESTIMONIALS;

  return (
    <section className="w-full py-16 md:py-24 bg-white overflow-hidden select-none border-t border-[#E8DFD0]/50">
      <div className="container mx-auto px-4 md:px-12 max-w-[1500px]">
        {/* Heading Section */}
        <div className="text-center mb-10 md:mb-16">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[10px] uppercase tracking-[0.35em] text-[#C59B27] font-bold mb-3 block"
          >
            Our Patrons
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl font-serif text-stone-900 tracking-tight"
          >
            {sectionData?.label || "Customer Stories"}
          </motion.h2>
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="w-12 h-[2px] bg-[#C59B27] mx-auto mt-6 origin-left"
          />
        </div>

        {/* Horizontal Scroll Containers */}
        <div className="flex overflow-x-auto gap-4 md:gap-6 px-4 md:px-0 pb-12 scrollbar-hide snap-x snap-mandatory justify-start lg:justify-center relative z-10">
          {displayItems.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex-shrink-0 w-[280px] md:w-[360px] snap-center bg-[#FAF8F5] rounded-2xl p-6 md:p-8 border border-[#E8DFD0] hover:border-[#C59B27]/60 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Stars Rating */}
                <div className="flex gap-1 mb-5">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className="w-4 h-4 text-[#C59B27]"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>

                {/* Testimonial Text */}
                <p className="text-stone-700 font-sans text-sm md:text-[15px] leading-relaxed mb-8 italic">
                  "{testimonial.text}"
                </p>
              </div>

              {/* Customer Profile Layout */}
              <div className="flex items-center gap-4 mt-auto">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden border-2 border-white shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-stone-900 font-bold text-sm md:text-base tracking-wide">
                    {testimonial.name}
                  </h3>
                  <p className="text-[#C59B27] text-[9px] md:text-[10px] font-bold uppercase tracking-widest mt-0.5">
                    {testimonial.location || "Verified Buyer"}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `,
        }}
      />
    </section>
  );
};

export default Testimonials;
