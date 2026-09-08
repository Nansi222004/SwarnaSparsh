import React from "react";
import { Truck, ThumbsUp, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import logoIcon from "@assets/logo.webp";
import aboutHero1 from "@assets/cat_wedding_choker.png";
import aboutHero2 from "@assets/cat_wedding_bangles.png";
import aboutHero3 from "@assets/cat_wedding_diamond.png";

import insta1 from "@assets/men_hero_style.png";
import insta2 from "@assets/women_hero_radiance.png";
import insta3 from "@assets/family_astra.png";
import insta4 from "@assets/men_hero_bold.png";

const AboutUs = () => {
  return (
    <div className="bg-white min-h-screen text-[#5D4037] font-sans pb-20 relative overflow-hidden">
      {/* Hero Section */}
      <section className="container mx-auto px-10 pt-20 pb-0 relative mt-10 mb-12 overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row items-center gap-16">
          {/* Left: Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-full lg:w-1/2 space-y-6 flex flex-col items-center text-center relative"
          >
            {/* Background Watermark Logo - Positioned specifically behind text */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] md:w-[700px] opacity-[0.18] pointer-events-none select-none -z-10">
              <img src={logoIcon} alt="" className="w-full h-auto" />
            </div>
            <h1 className="text-5xl md:text-6xl font-serif text-black mb-4">
              About Us
            </h1>
            <p className="text-black text-xl leading-relaxed max-w-xl font-serif">
              Welcome to <strong>Swarna Sparsh</strong>, where elegance meets
              timeless tradition. We are more than just a jewellery brand; we
              are curators of silver artistry designed to adorn your soul.
            </p>
            <p className="text-black text-xl leading-relaxed max-w-xl font-serif">
              Our journey began with a passion for bringing high-quality,
              handcrafted 925 Sterling Silver pieces to the modern woman. Every
              necklace, ring, and bracelet in our collection tells a story of
              skilled craftsmanship and attention to detail. We believe that
              luxury should be an everyday experience, not just for special
              occasions.
            </p>
            <p className="text-black text-xl leading-relaxed max-w-xl font-serif">
              At Swarna Sparsh, we are committed to sustainability and ethical
              sourcing, ensuring that beauty does not come at a cost to our
              planet. Join us in celebrating your unique style with ornaments
              that shine as bright as you do.
            </p>
          </motion.div>

          {/* Right: Collage Image - Redesigned to match screenshot */}
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="w-full lg:w-1/2 relative h-[500px]"
          >
            {/* Main Top Left Image - Landscape */}
            <div className="absolute top-0 left-0 w-72 h-48 overflow-hidden shadow-lg z-10 border-4 border-white">
              <img
                src={aboutHero1}
                alt="Landscape Jewellery"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Center Bottom Circle Image - Bracelet */}
            <div className="absolute top-28 left-20 w-64 h-64 rounded-full overflow-hidden shadow-2xl z-30 border-8 border-white">
              <img
                src={aboutHero2}
                alt="Gold Bracelet"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Top Right Rounded Image - Wearing Necklace */}
            <div className="absolute -top-10 right-0 w-60 h-60 rounded-tr-[3rem] rounded-bl-[3rem] overflow-hidden shadow-xl z-20 border-4 border-white">
              <img
                src={aboutHero3}
                alt="Wearing Necklace"
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 pt-4 pb-20">
        <div className="flex flex-col md:flex-row justify-center items-start gap-12 md:gap-24 text-center">
          {/* Feature 1 */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col items-center max-w-xs"
          >
            <div className="w-16 h-16 rounded-full bg-[#8D6E63] text-white flex items-center justify-center mb-6 shadow-lg">
              <Truck className="w-8 h-8" />
            </div>
            <h3 className="font-serif text-xl text-black font-bold mb-3">
              Free Shipping
            </h3>
            <p className="text-[#8D6E63] text-base leading-relaxed">
              Enjoy free and fast delivery on all orders above ₹2000. We ensure
              your precious pieces reach you safely and on time, anywhere in the
              country.
            </p>
          </motion.div>

          {/* Feature 2 */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="flex flex-col items-center max-w-xs"
          >
            <div className="w-16 h-16 rounded-full bg-[#8D6E63] text-white flex items-center justify-center mb-6 shadow-lg">
              <ThumbsUp className="w-8 h-8" />
            </div>
            <h3 className="font-serif text-xl text-black font-bold mb-3">
              Premium Quality
            </h3>
            <p className="text-[#8D6E63] text-base leading-relaxed">
              Our jewellery is crafted with 100% authentic 925 Sterling Silver.
              Each piece undergoes varying quality checks to ensure lasting
              shine and durability.
            </p>
          </motion.div>

          {/* Feature 3 */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
            className="flex flex-col items-center max-w-xs"
          >
            <div className="w-16 h-16 rounded-full bg-[#8D6E63] text-white flex items-center justify-center mb-6 shadow-lg">
              <Lock className="w-8 h-8" />
            </div>
            <h3 className="font-serif text-xl text-black font-bold mb-3">
              100% Secure Checkout
            </h3>
            <p className="text-[#8D6E63] text-base leading-relaxed">
              Shop with confidence using our encrypted payment gateways. Your
              privacy and security are our top priority for a seamless shopping
              experience.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Bottom Instagram Section Peek */}
      <section className="container mx-auto px-4 pt-10 border-t border-[#EFEBE9]">
        <div className="text-center mb-10">
          <h2 className="font-serif text-3xl text-[#5D4037]">
            Follow Our Instagram
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 opacity-50">
          {/* Just placeholders to mimic the bottom peek */}
          <div className="h-64 bg-gray-200">
            <img
              src={insta1}
              className="w-full h-full object-cover"
              alt="Insta 1"
            />
          </div>
          <div className="h-64 bg-gray-200">
            <img
              src={insta2}
              className="w-full h-full object-cover"
              alt="Insta 2"
            />
          </div>
          <div className="h-64 bg-gray-200">
            <img
              src={insta3}
              className="w-full h-full object-cover"
              alt="Insta 3"
            />
          </div>
          <div className="h-64 bg-gray-200">
            <img
              src={insta4}
              className="w-full h-full object-cover"
              alt="Insta 4"
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutUs;
