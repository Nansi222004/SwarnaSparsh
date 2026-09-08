import React, { useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import FamilyProductsCatalog from "../components/family/FamilyProductsCatalog";
import { normalizeFamilyCollection } from "../utils/familyNavigation";
import Loader from "../../shared/components/Loader";
import { usePublicCmsPage } from "../hooks/usePublicCmsPage";

const collectionMeta = {
  classics: {
    title: "925 Silver Classics",
    subtitle: "Timeless family essentials with a clean silver finish.",
    badge: "Collection",
    allowedProductIds: ["f1", "f3", "f7", "f11"],
  },
  astra: {
    title: "Astra Edition",
    subtitle: "Modern pieces with a premium boutique feel.",
    badge: "Collection",
    allowedProductIds: ["f2", "f8", "f9"],
  },
  signature: {
    title: "Signature Sets",
    subtitle: "Matching sets and elevated gifting combinations.",
    badge: "Collection",
    allowedProductIds: ["f3", "f10", "f11", "f12"],
  },
  boho: {
    title: "Boho Anklets",
    subtitle: "Relaxed, playful, and statement-ready anklets.",
    badge: "Collection",
    allowedProductIds: ["f5", "f6", "f12"],
  },
  bridal: {
    title: "Bridal Edit",
    subtitle: "Occasion-ready pieces for celebrations and ceremonies.",
    badge: "Collection",
    allowedProductIds: ["f2", "f3", "f4", "f11"],
  },
  gifts: {
    title: "Gifts for Her",
    subtitle: "Thoughtful family picks with a soft feminine touch.",
    badge: "Collection",
    allowedProductIds: ["f2", "f7", "f8", "f11", "f12"],
  },
  "mother-picks": {
    title: "For Mother",
    subtitle: "Elegant keepsakes and soft classics for mothers.",
    badge: "Collection",
    allowedProductIds: ["f1", "f2"],
  },
  "father-picks": {
    title: "For Father",
    subtitle: "Refined pieces with a grounded, timeless feel.",
    badge: "Collection",
    allowedProductIds: ["f3", "f4"],
  },
  "brother-picks": {
    title: "For Brother",
    subtitle: "Clean everyday styles with a modern edge.",
    badge: "Collection",
    allowedProductIds: ["f5", "f6"],
  },
  "sister-picks": {
    title: "For Sister",
    subtitle: "Light, expressive gifts with a polished finish.",
    badge: "Collection",
    allowedProductIds: ["f7", "f8"],
  },
  "spouse-picks": {
    title: "For Spouse",
    subtitle: "Romantic gifting picks for a special someone.",
    badge: "Collection",
    allowedProductIds: ["f9", "f10", "f11", "f12"],
  },
  "daughter-picks": {
    title: "For Daughter",
    subtitle: "Delicate pieces with a sweet and playful touch.",
    badge: "Collection",
    allowedProductIds: ["f7", "f8", "f11"],
  },
  "baby-picks": {
    title: "For Baby",
    subtitle: "Soft gifting inspirations for little celebrations.",
    badge: "Collection",
    allowedProductIds: ["f1", "f5", "f6"],
  },
  "grandmother-picks": {
    title: "Grandmother Picks",
    subtitle: "Classic pieces for treasured family moments.",
    badge: "Collection",
    allowedProductIds: ["f1", "f2", "f7"],
  },
  "grandfather-picks": {
    title: "Grandfather Picks",
    subtitle: "Thoughtful men’s-style gifting with a classic edge.",
    badge: "Collection",
    allowedProductIds: ["f3", "f4", "f9"],
  },
  "couple-picks": {
    title: "For Couple",
    subtitle: "Shared gifting pieces designed to feel coordinated.",
    badge: "Collection",
    allowedProductIds: ["f9", "f10", "f11", "f12"],
  },
  "matching-sets": {
    title: "Matching Sets",
    subtitle: "Pairing-friendly gifts with a coordinated look.",
    badge: "Trending",
    allowedProductIds: ["f11", "f12"],
  },
  "heirloom-pieces": {
    title: "Heirloom Pieces",
    subtitle: "Legacy-inspired designs with a premium presence.",
    badge: "Trending",
    allowedProductIds: ["f1", "f2"],
  },
  "mom-and-me": {
    title: "Mom & Me",
    subtitle: "Soft matching picks for special shared moments.",
    badge: "Trending",
    allowedProductIds: ["f1", "f2"],
  },
  generations: {
    title: "Generations",
    subtitle: "Classic family styles across generations.",
    badge: "Trending",
    allowedProductIds: ["f3", "f4"],
  },
  "everyday-wear": {
    title: "Everyday Wear",
    subtitle: "Easy-to-style pieces for daily use.",
    badge: "Trending",
    allowedProductIds: ["f5", "f6"],
  },
  "festive-joy": {
    title: "Festive Joy",
    subtitle: "Celebratory styles with a brighter finish.",
    badge: "Trending",
    allowedProductIds: ["f7", "f8"],
  },
  "minimalist-luxe": {
    title: "Minimalist Luxe",
    subtitle: "Clean lines and understated polish.",
    badge: "Trending",
    allowedProductIds: ["f9", "f10"],
  },
  "statement-picks": {
    title: "Statement Picks",
    subtitle: "Bold family gifting choices that stand out.",
    badge: "Trending",
    allowedProductIds: ["f11", "f12"],
  },
  traditional: {
    title: "Traditional",
    subtitle: "Rooted, celebratory styles with timeless appeal.",
    badge: "Trending",
    allowedProductIds: ["f3", "f7", "f11"],
  },
  "modern-staples": {
    title: "Modern Staples",
    subtitle: "Contemporary family favourites for everyday gifting.",
    badge: "Trending",
    allowedProductIds: ["f2", "f6", "f10"],
  },
  "under-2999": {
    title: "Under Rs 2999",
    subtitle: "Budget-friendly keepsakes for quick gifting.",
    badge: "Rose Pick",
    allowedProductIds: ["f1", "f5", "f6", "f7", "f8", "f12"],
  },
  "premium-gifts": {
    title: "Premium Gifts",
    subtitle: "Heirloom-style favourites with a premium finish.",
    badge: "Most Loved",
    allowedProductIds: ["f2", "f3", "f4", "f9", "f10", "f11"],
  },
  "under-4999": {
    title: "Under Rs 4999",
    subtitle: "Statement family gifts in an elevated range.",
    badge: "Easy Upgrade",
    allowedProductIds: [
      "f1",
      "f2",
      "f3",
      "f4",
      "f5",
      "f6",
      "f7",
      "f8",
      "f9",
      "f10",
      "f11",
      "f12",
    ],
  },
};

const FamilyCollectionProductsPage = () => {
  const { collectionId } = useParams();
  const normalizedCollection = normalizeFamilyCollection(collectionId);
  const meta =
    collectionMeta[normalizedCollection] || collectionMeta["under-2999"];
  const {
    data: sections = [],
    isLoading,
    isError,
    error,
    refetch,
  } = usePublicCmsPage("shop-family");

  useEffect(() => {
    document.title = `${meta.title} | Swarna Sparsh`;
  }, [meta.title]);

  const sectionMap = useMemo(
    () =>
      (sections || []).reduce((acc, section) => {
        const key = section.sectionKey || section.sectionId;
        if (key) acc[key] = section;
        return acc;
      }, {}),
    [sections],
  );

  if (isLoading) return <Loader />;
  if (isError) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center px-6 py-14">
        <div className="max-w-xl w-full bg-white border border-gray-100 rounded-2xl p-8 shadow-sm text-center">
          <div className="text-[10px] font-black uppercase tracking-[0.35em] text-gray-400">
            Family Gift Picks
          </div>
          <h1 className="mt-2 text-2xl font-extrabold text-gray-900">
            Unable to load page content
          </h1>
          <p className="mt-3 text-sm text-gray-600">
            {error?.response?.data?.message ||
              error?.message ||
              "Please try again."}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-[#141211] px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white hover:bg-[#1C1917] hover:text-[#E8D198] transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen text-black font-sans overflow-x-hidden">
      <div className="border-b border-[#E8DFD0] bg-[#FAF8F5]">
        <div className="container mx-auto px-4 md:px-8 py-4 md:py-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#C59B27]">
              Family Gift Picks
            </p>
            <h1 className="mt-1 font-serif text-2xl md:text-4xl text-[#141211]">
              {meta.title}
            </h1>
            <p className="mt-1 text-sm text-stone-500">{meta.subtitle}</p>
          </div>

          <Link
            to="/category/family"
            className="inline-flex items-center justify-center rounded-full border border-[#E8DFD0] bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#141211] transition-colors hover:bg-[#FAF8F5] hover:border-[#C59B27] hover:text-[#C59B27]"
          >
            Back to Family
          </Link>
        </div>
      </div>

      <FamilyProductsCatalog
        selectedRecipient="all"
        titleOverride={meta.title}
        eyebrowOverride={meta.badge}
        subtitleOverride={meta.subtitle}
        allowedProductIds={meta.allowedProductIds}
        hideRecipientFilters
        sectionData={sectionMap["products-listing"]}
      />
    </div>
  );
};

export default FamilyCollectionProductsPage;
