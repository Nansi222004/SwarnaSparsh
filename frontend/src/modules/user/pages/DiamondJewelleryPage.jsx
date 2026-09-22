import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Gem } from "lucide-react";
import { useShop } from "../../../context/ShopContext";
import { usePublicCmsPage } from "../hooks/usePublicCmsPage";
import PromoSlider from "../components/PromoSlider";
import Loader from "../../shared/components/Loader";
import { matchesRequestedMetal } from "../utils/productMetal";
import { resolveLegacyCmsAsset } from "../utils/legacyCmsAssets";
import heroDiamondBrilliance from "@assets/hero/eternal_diamond_brilliance.png";
import heroDiamondLuxury from "@assets/hero/diamond_luxury.png";
import heroDiamondCampaign from "@assets/hero/diamond_elegance_campaign.png";

import CollectionCategoryGrid from "../components/CollectionCategoryGrid";
import { diamondCollectionGridDefaults } from "../utils/collectionGridDefaults";

// Specialized luxury diamond components
import DiamondShopByType from "../components/DiamondShopByType";
import DiamondCategoryShowcase from "../components/DiamondCategoryShowcase";
import DiamondShapeSelector from "../components/DiamondShapeSelector";
import Diamond4CsGuide from "../components/Diamond4CsGuide";
import DiamondTrustSection from "../components/DiamondTrustSection";
import DiamondCuratedCollections from "../components/DiamondCuratedCollections";
import ExploreDiamondCollection from "../components/ExploreDiamondCollection";


const DEFAULT_HERO_SLIDES = [
  {
    id: "diamond-hero-default-1",
    image: heroDiamondBrilliance,
    title: "Eternal Diamond Brilliance",
    subtitle: "Handcrafted luxury with certified natural & lab-grown diamonds, tailored for timeless elegance",
    tag: "Certified Diamond Atelier",
    ctaLabel: "Shop Diamond Collection",
    link: "/shop?metal=diamond",
  },
  {
    id: "diamond-hero-default-2",
    image: heroDiamondLuxury,
    title: "Rare Earth Solitaires",
    subtitle: "Naturally formed over billions of years, cut with exacting mathematical precision",
    tag: "Natural Diamonds",
    ctaLabel: "Explore Natural Diamonds",
    link: "/shop?metal=diamond&diamondType=natural",
  },
  {
    id: "diamond-hero-default-3",
    image: heroDiamondCampaign,
    title: "Conscious Fire & Brilliance",
    subtitle: "Innovative lab-grown creations offering exceptional color, clarity, and unmatched modern value",
    tag: "Lab-Grown Diamonds",
    ctaLabel: "Explore Lab-Grown",
    link: "/shop?metal=diamond&diamondType=lab_grown",
  },
];

const DiamondJewelleryPage = () => {
  const { products = [], isLoading: isShopLoading } = useShop();
  const {
    data: sections = [],
    isLoading: isCmsLoading,
    isError: isCmsError,
    error: cmsError,
    refetch,
  } = usePublicCmsPage("diamond-collection");

  const [selectedShape, setSelectedShape] = useState(null);

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

  // Dynamic Hero Slides from CMS or luxury fallback
  const heroSlides = useMemo(() => {
    const heroSection = sectionMap["hero-banners-diamond"];
    const configuredItems = Array.isArray(heroSection?.items) ? heroSection.items : [];
    const validConfigured = configuredItems.filter(
      (item) => item?.label || item?.name || item?.image,
    );

    if (validConfigured.length > 1) {
      return validConfigured.map((item, index) => {
        const fallbackSlide = DEFAULT_HERO_SLIDES[index % DEFAULT_HERO_SLIDES.length];
        return {
          id: item.itemId || item.id || `diamond-hero-${index + 1}`,
          image: resolveLegacyCmsAsset(item.image, fallbackSlide.image) || fallbackSlide.image,
          mobileImage: item.mobileImage ? resolveLegacyCmsAsset(item.mobileImage, null) : null,
          title: String(item?.label || item?.title || fallbackSlide.title).trim(),
          subtitle: String(item?.subtitle || item?.description || fallbackSlide.subtitle).trim(),
          tag: String(item?.name || item?.tag || fallbackSlide.tag).trim(),
          ctaLabel: String(item?.ctaLabel || fallbackSlide.ctaLabel).trim(),
          link: item?.path || fallbackSlide.link,
        };
      });
    }

    if (validConfigured.length === 1 && (validConfigured[0].image || (validConfigured[0].label && validConfigured[0].label !== "Eternal Diamond Brilliance" && validConfigured[0].label !== "Diamond Atelier"))) {
      const item = validConfigured[0];
      return [{
        id: item.itemId || item.id || "diamond-hero-1",
        image: resolveLegacyCmsAsset(item.image, heroDiamondBrilliance) || heroDiamondBrilliance,
        mobileImage: item.mobileImage ? resolveLegacyCmsAsset(item.mobileImage, null) : null,
        title: String(item?.label || item?.title || "Eternal Diamond Brilliance").trim(),
        subtitle: String(item?.subtitle || item?.description || "Handcrafted Luxury with Certified Natural & Lab-Grown Diamonds").trim(),
        tag: String(item?.name || item?.tag || "Certified Diamond Atelier").trim(),
        ctaLabel: String(item?.ctaLabel || "Shop Diamond Collection").trim(),
        link: item?.path || "/shop?metal=diamond",
      }];
    }

    return DEFAULT_HERO_SLIDES;
  }, [sectionMap]);

  const autoplayMs = Number(sectionMap["hero-banners-diamond"]?.settings?.autoplayMs) || 4000;

  // Filter verified Diamond products from MongoDB catalogue
  const diamondProducts = useMemo(() => {
    return (products || []).filter((p) => matchesRequestedMetal(p, "diamond"));
  }, [products]);


  if ((isCmsLoading || isShopLoading) && diamondProducts.length === 0) {
    return <Loader />;
  }

  if (isCmsError && diamondProducts.length === 0) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center px-6 py-14">
        <div className="max-w-xl w-full bg-white border border-stone-200 rounded-3xl p-8 shadow-sm text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-stone-200 bg-[#FAFBFD] text-[#171717] text-[10px] font-bold uppercase tracking-[0.25em] mb-3">
            <Gem className="w-3.5 h-3.5 text-[#C6A04A]" />
            <span>Diamond Atelier</span>
          </div>
          <h1 className="mt-2 text-2xl font-serif font-medium text-stone-900">
            Unable to load diamond collection
          </h1>
          <p className="mt-3 text-sm text-stone-600 font-light">
            {cmsError?.response?.data?.message || cmsError?.message || "Please check your network and try again."}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-[#171717] px-6 py-3 text-xs font-bold uppercase tracking-widest text-white hover:bg-[#C6A04A] hover:text-[#171717] transition-all cursor-pointer shadow-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Check section visibility toggles from CMS
  const isSectionActive = (key) => {
    const sec = sectionMap[key];
    return !sec || sec.isActive !== false;
  };

  return (
    <div className="bg-white min-h-screen font-body text-stone-900 selection:bg-[#C6A04A] selection:text-[#171717]">
      {/* 1. Dynamic Hero Banner Slider */}
      {isSectionActive("hero-banners-diamond") && (
        <PromoSlider externalSlides={heroSlides} autoplayInterval={autoplayMs} />
      )}

      {/* 2. Diamond Collection Showcase Section (Screenshot layout: Left Lead Spotlight + Center 2x2 Category Grid + Right Shop by Diamond Type Panel) */}
      {isSectionActive("diamond-category-grid") && (
        <CollectionCategoryGrid
          sectionKey="diamond-category-grid"
          sectionData={sectionMap["diamond-category-grid"]}
          sidePanelData={sectionMap["diamond-shop-by-type"]}
          defaultTitle={sectionMap["diamond-category-grid"]?.settings?.title || "Diamond Collection"}
          defaultEyebrow={sectionMap["diamond-category-grid"]?.settings?.badge || "DIAMOND COLLECTION"}
          defaultSubtitle={sectionMap["diamond-category-grid"]?.settings?.subtitle || "Dazzling certified diamond jewellery designed to capture light"}
          defaultItems={diamondCollectionGridDefaults}
          bgClass="bg-white"
        />
      )}

      {/* 4. Shop by Diamond Shape */}
      {isSectionActive("diamond-shapes") && (
        <DiamondShapeSelector
          sectionData={sectionMap["diamond-shapes"]}
          selectedShape={selectedShape}
          onSelectShape={setSelectedShape}
        />
      )}

      {/* 5. The 4Cs Educational Masterclass */}
      {isSectionActive("diamond-4cs-guide") && (
        <Diamond4CsGuide sectionData={sectionMap["diamond-4cs-guide"]} />
      )}

      {/* 6. Diamond Trust & Certification Strip */}
      {isSectionActive("diamond-trust-markers") && (
        <DiamondTrustSection sectionData={sectionMap["diamond-trust-markers"]} />
      )}

      {/* 7. Curated Diamond Edits & Price Bands */}
      {isSectionActive("diamond-curated-collections") && (
        <DiamondCuratedCollections sectionData={sectionMap["diamond-curated-collections"]} />
      )}

      {/* 8. Explore Our Diamond Collection (Dynamic Admin Panel Product Showcase) */}
      {(isSectionActive("diamond-products-listing") || isSectionActive("diamond-bespoke-consultation")) && (
        <ExploreDiamondCollection
          sectionData={sectionMap["diamond-products-listing"] || sectionMap["diamond-bespoke-consultation"]}
          diamondProducts={diamondProducts}
          selectedShape={selectedShape}
          onSelectShape={setSelectedShape}
        />
      )}
    </div>
  );
};

export default DiamondJewelleryPage;
