import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  RefreshCw,
  RotateCcw,
  Star,
  ArrowRight,
  Gem,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { useShop } from "../../../context/ShopContext";
import { usePublicCmsPage } from "../hooks/usePublicCmsPage";
import PromoSlider from "../components/PromoSlider";
import ProductCard from "../components/ProductCard";
import Loader from "../../shared/components/Loader";
import { matchesRequestedMetal } from "../utils/productMetal";
import { resolveLegacyCmsAsset } from "../utils/legacyCmsAssets";
import heroDiamondBrilliance from "@assets/hero/eternal_diamond_brilliance.png";

const DEFAULT_TRUST_BADGES = [
  {
    id: 1,
    icon: ShieldCheck,
    title: "100% Certified",
    subtitle: "Authentic Diamonds",
  },
  {
    id: 2,
    icon: RefreshCw,
    title: "Lifetime Exchange",
    subtitle: "& Buyback",
  },
  {
    id: 3,
    icon: RotateCcw,
    title: "Easy 15",
    subtitle: "Days Return",
  },
  {
    id: 4,
    icon: Star,
    title: "Hallmark",
    subtitle: "Purity Assurance",
  },
];

const DEFAULT_CATEGORIES = [
  { id: "rings", name: "Diamond Rings", slug: "rings", search: "ring" },
  { id: "earrings", name: "Diamond Earrings", slug: "earrings", search: "earring" },
  { id: "bangles", name: "Diamond Bangles", slug: "bangles", search: "bangles" },
  { id: "necklaces", name: "Diamond Pendants", slug: "necklaces", search: "necklace" },
  { id: "solitaire", name: "Solitaire Jewellery", slug: "solitaire", search: "solitaire" },
];

const DiamondJewelleryPage = () => {
  const { products = [], categories: liveCategories = [], isLoading: isShopLoading } = useShop();
  const {
    data: sections = [],
    isLoading: isCmsLoading,
    isError: isCmsError,
    error: cmsError,
    refetch,
  } = usePublicCmsPage("diamond-collection");

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("featured");

  useEffect(() => {
    document.title = "Shop Diamond Jewellery | Alankar Jewellers";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const sectionMap = useMemo(
    () =>
      (sections || []).reduce((acc, section) => {
        const key = section.sectionKey || section.sectionId;
        if (key) acc[key] = section;
        return acc;
      }, {}),
    [sections],
  );

  // Dynamic Hero Slides from CMS or fallback
  const heroSlides = useMemo(() => {
    const heroSection = sectionMap["hero-banners-diamond"];
    const configuredItems = Array.isArray(heroSection?.items) ? heroSection.items : [];
    const validConfigured = configuredItems.filter(
      (item) => item?.label || item?.name || item?.image,
    );

    if (validConfigured.length > 0) {
      return validConfigured.map((item, index) => ({
        id: item.itemId || item.id || `diamond-hero-${index + 1}`,
        image: resolveLegacyCmsAsset(item.image, heroDiamondBrilliance) || heroDiamondBrilliance,
        mobileImage: item.mobileImage ? resolveLegacyCmsAsset(item.mobileImage, null) : null,
        title: String(item?.label || item?.title || "Diamond Atelier").trim(),
        subtitle: String(item?.subtitle || item?.description || "Timeless Brilliance & Craftsmanship").trim(),
        tag: String(item?.name || item?.tag || "Handcrafted Luxury").trim(),
        ctaLabel: String(item?.ctaLabel || "Shop Diamond Collection").trim(),
        link: item?.path || "/shop?metal=diamond",
      }));
    }

    return [
      {
        id: "diamond-hero-default",
        image: heroDiamondBrilliance,
        title: "Diamond Atelier",
        subtitle: "Handcrafted brilliance with certified authenticity and contemporary design",
        tag: "Timeless Luxury",
        ctaLabel: "Shop Diamond Collection",
        link: "/shop?metal=diamond",
      },
    ];
  }, [sectionMap]);

  const autoplayMs = Number(sectionMap["hero-banners-diamond"]?.settings?.autoplayMs) || 4000;

  // Filter verified Diamond products from MongoDB catalogue
  const diamondProducts = useMemo(() => {
    return (products || []).filter((p) => matchesRequestedMetal(p, "diamond"));
  }, [products]);

  // Dynamic Categories from CMS or live DB categories or defaults
  const categoriesList = useMemo(() => {
    const categorySection = sectionMap["diamond-category-grid"];
    const configured = Array.isArray(categorySection?.items) ? categorySection.items : [];
    if (configured.length > 0) {
      return configured.map((c) => ({
        id: c.itemId || c.id || c.name,
        name: c.name || c.label,
        image: resolveLegacyCmsAsset(c.image, ""),
        path: c.path || `/shop?metal=diamond&category=${encodeURIComponent(c.name)}`,
      }));
    }

    // Match live categories that contain "diamond" or fallback categories
    const matchedLive = liveCategories.filter((c) =>
      /diamond/i.test(c.name) || /diamond/i.test(c.slug),
    );
    if (matchedLive.length > 0) {
      return matchedLive.map((c) => ({
        id: c._id || c.id,
        name: c.name,
        image: c.image || "",
        path: `/shop?metal=diamond&category=${encodeURIComponent(c.slug || c._id)}`,
      }));
    }

    return DEFAULT_CATEGORIES.map((c) => ({
      id: c.id,
      name: c.name,
      image: "",
      path: `/shop?metal=diamond&search=${encodeURIComponent(c.search)}`,
    }));
  }, [sectionMap, liveCategories]);

  // Trust Badges from CMS or defaults
  const trustBadges = useMemo(() => {
    const trustSection = sectionMap["diamond-trust-markers"];
    const configured = Array.isArray(trustSection?.items) ? trustSection.items : [];
    if (configured.length === 0) return DEFAULT_TRUST_BADGES;

    const iconLookup = {
      ShieldCheck,
      RefreshCw,
      RotateCcw,
      Star,
    };

    return configured.map((item, idx) => ({
      id: item?.itemId || item?.id || `diamond-trust-${idx + 1}`,
      icon: iconLookup[item.iconName] || DEFAULT_TRUST_BADGES[idx % DEFAULT_TRUST_BADGES.length].icon,
      title: item.name || item.label || DEFAULT_TRUST_BADGES[idx % DEFAULT_TRUST_BADGES.length].title,
      subtitle: item.subtitle || DEFAULT_TRUST_BADGES[idx % DEFAULT_TRUST_BADGES.length].subtitle,
      image: item?.image ? resolveLegacyCmsAsset(item.image, "") : "",
    }));
  }, [sectionMap]);

  // Filtered and sorted products for catalogue section
  const filteredProducts = useMemo(() => {
    let result = [...diamondProducts];

    if (selectedCategory !== "all") {
      result = result.filter((p) => {
        const catName = String(p.category?.name || p.category || "").toLowerCase();
        const catSlug = String(p.categorySlug || p.category?.slug || "").toLowerCase();
        const pName = String(p.name || "").toLowerCase();
        const target = String(selectedCategory).toLowerCase();
        return catName.includes(target) || catSlug.includes(target) || pName.includes(target);
      });
    }

    switch (sortBy) {
      case "price-low":
        result.sort((a, b) => (a.variants?.[0]?.price || a.price || 0) - (b.variants?.[0]?.price || b.price || 0));
        break;
      case "price-high":
        result.sort((a, b) => (b.variants?.[0]?.price || b.price || 0) - (a.variants?.[0]?.price || a.price || 0));
        break;
      case "newest":
        result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        break;
      default:
        break;
    }

    return result;
  }, [diamondProducts, selectedCategory, sortBy]);

  if ((isCmsLoading || isShopLoading) && diamondProducts.length === 0) {
    return <Loader />;
  }

  if (isCmsError && diamondProducts.length === 0) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center px-6 py-14">
        <div className="max-w-xl w-full bg-white border border-gray-100 rounded-2xl p-8 shadow-sm text-center">
          <div className="text-[10px] font-black uppercase tracking-[0.35em] text-[#C6A04A]">
            Diamond Collection
          </div>
          <h1 className="mt-2 text-2xl font-extrabold text-gray-900">
            Unable to load page content
          </h1>
          <p className="mt-3 text-sm text-gray-600">
            {cmsError?.response?.data?.message || cmsError?.message || "Please check your network and try again."}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-[#171717] px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white hover:bg-[#C6A04A] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen font-body text-stone-900 selection:bg-[#C6A04A] selection:text-[#171717]">
      {/* 1. Dynamic Hero Banner Slider */}
      <PromoSlider externalSlides={heroSlides} autoplayInterval={autoplayMs} />

      {/* 2. Dynamic Diamond Category Grid */}
      <section className="py-12 md:py-16 bg-[#FAF7F0] border-b border-[#E8E0D2]">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#E8E0D2] bg-white text-[#C6A04A] text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] mb-3">
              <Gem className="w-3.5 h-3.5" />
              <span>{sectionMap["diamond-category-grid"]?.settings?.eyebrow || "Atelier Categories"}</span>
            </div>
            <h2 className="font-serif text-2xl md:text-4xl text-[#171717] font-medium tracking-tight">
              {sectionMap["diamond-category-grid"]?.settings?.title || "Explore Diamond Creations"}
            </h2>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
            {categoriesList.map((cat) => (
              <Link
                key={cat.id}
                to={cat.path}
                className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider bg-white border border-[#E8E0D2] text-[#242424] hover:border-[#C6A04A] hover:text-[#C6A04A] transition-all shadow-xs"
              >
                <span>{cat.name}</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-1 group-hover:opacity-100 transition-transform" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Trust Markers Section */}
      <section className="py-10 bg-white border-b border-gray-100">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {trustBadges.map((badge, idx) => (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-center gap-4 bg-[#FAF7F0] rounded-2xl p-4 border border-[#E8E0D2]/50 hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shrink-0 border border-[#E8E0D2] shadow-xs">
                  {badge.image ? (
                    <img src={badge.image} alt={badge.title} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <badge.icon className="w-5 h-5 text-[#C6A04A]" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 leading-tight tracking-wide">{badge.title}</h4>
                  <p className="text-xs text-[#77716A] font-medium leading-tight mt-0.5">{badge.subtitle}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Dynamic Products Showcase & Catalogue */}
      <section className="py-12 md:py-20 max-w-[1440px] mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-4 border-b border-[#E8E0D2] gap-4">
          <div>
            <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] text-[#C6A04A] block mb-1">
              {sectionMap["diamond-products-listing"]?.settings?.eyebrow || "The Collection"}
            </span>
            <h2 className="font-serif text-2xl md:text-3xl text-[#171717]">
              {sectionMap["diamond-products-listing"]?.settings?.title || "Diamond Jewellery Catalogue"}
            </h2>
          </div>

          {/* Controls: Filter & Sort */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs">
              <SlidersHorizontal className="w-3.5 h-3.5 text-gray-500" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent text-xs font-semibold text-gray-800 outline-none cursor-pointer"
              >
                <option value="all">All Categories</option>
                <option value="ring">Rings</option>
                <option value="earring">Earrings</option>
                <option value="bangle">Bangles</option>
                <option value="necklace">Necklaces & Pendants</option>
              </select>
            </div>

            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-xs font-semibold text-gray-800 outline-none cursor-pointer"
              >
                <option value="featured">Sort: Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="newest">New Arrivals</option>
              </select>
            </div>

            <Link
              to="/shop?metal=diamond"
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#171717] hover:text-[#C6A04A] transition-colors ml-2"
            >
              <span>View In Shop</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id || product._id}
                product={product}
              />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center bg-[#FAF7F0] rounded-2xl border border-[#E8E0D2] px-4">
            <Gem className="w-10 h-10 text-[#C6A04A] mx-auto mb-3 opacity-60" />
            <h3 className="font-serif text-lg md:text-xl text-[#171717] mb-1">
              No Diamond Jewellery Found
            </h3>
            <p className="text-xs md:text-sm text-[#77716A] mb-6 max-w-md mx-auto font-light">
              We couldn't find any diamond products matching this specific category filter.
            </p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className="px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-white border border-[#E8E0D2] text-[#171717] hover:border-[#C6A04A] transition-all"
              >
                Reset Filter
              </button>
              <Link
                to="/shop?metal=diamond"
                className="inline-block bg-[#171717] text-white px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#C6A04A] hover:text-[#171717] transition-all"
              >
                Browse All In Shop
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* 5. Bottom Bespoke Consultation CTA */}
      <section className="bg-[#FAF7F0] border-t border-[#E8E0D2] py-14 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-white border border-[#E8E0D2] text-[#C6A04A] mb-4 shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="font-serif text-2xl md:text-3xl text-[#171717] mb-2 font-medium">
            Looking for a Bespoke Diamond Design?
          </h3>
          <p className="text-xs md:text-sm text-[#77716A] mb-8 font-light leading-relaxed">
            Speak with our dedicated jewellery consultants to curate custom settings, solitaire rings, and personalised anniversary gifts crafted to your exact preferences.
          </p>
          <Link
            to="/shop?metal=diamond"
            className="inline-flex items-center gap-2 bg-[#171717] text-[#FAF7F0] hover:bg-[#C6A04A] hover:text-[#171717] px-8 py-3.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all shadow-sm"
          >
            <span>Explore Full Diamond Collection</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default DiamondJewelleryPage;
