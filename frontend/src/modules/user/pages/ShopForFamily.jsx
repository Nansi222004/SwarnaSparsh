import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import FamilyHeroCarousel from "../components/family/FamilyHeroCarousel";
import FamilyPricePoints from "../components/family/FamilyPricePoints";
import FamilyRecipientCategories from "../components/family/FamilyRecipientCategories";
import FamilyCuratedCollections from "../components/family/FamilyCuratedCollections";
import FamilyTrendingNearYou from "../components/family/FamilyTrendingNearYou";
import FamilyPromoBanner from "../components/family/FamilyPromoBanner";
import Family3DCarousel from "../components/family/Family3DCarousel";
import FamilyProductsCatalog from "../components/family/FamilyProductsCatalog";
import {
  buildFamilyShopPath,
  getFamilyRecipientFromSearch,
  normalizeFamilyRecipient,
} from "../utils/familyNavigation";
import { usePublicCmsPage } from "../hooks/usePublicCmsPage";

import Loader from "../../shared/components/Loader";

const ShopForFamily = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { recipient: recipientParam } = useParams();
  const [selectedRecipient, setSelectedRecipient] = useState(() =>
    normalizeFamilyRecipient(
      recipientParam || getFamilyRecipientFromSearch(location.search),
    ),
  );
  const {
    data: sections = [],
    isLoading: isCmsLoading,
    isError,
    error,
    refetch,
  } = usePublicCmsPage("shop-family");

  useEffect(() => {
    document.title = "Gifts for Family | Swarna Sparsh";
  }, []);

  useEffect(() => {
    const nextRecipient = normalizeFamilyRecipient(
      recipientParam || getFamilyRecipientFromSearch(location.search),
    );
    if (nextRecipient !== selectedRecipient) {
      setSelectedRecipient(nextRecipient);
    }
  }, [location.search, recipientParam, selectedRecipient]);

  const sectionMap = useMemo(
    () =>
      (sections || []).reduce((acc, section) => {
        const key = section.sectionKey || section.sectionId;
        if (key) acc[key] = section;
        return acc;
      }, {}),
    [sections],
  );

  if (isCmsLoading) return <Loader />;
  if (isError) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center px-6 py-14">
        <div className="max-w-xl w-full bg-white border border-gray-100 rounded-2xl p-8 shadow-sm text-center">
          <div className="text-[10px] font-black uppercase tracking-[0.35em] text-gray-400">
            Gifts for Family
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
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-[#3E2723] px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white hover:opacity-95"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const handleSelectRecipient = (recipientId) => {
    const normalizedRecipient = normalizeFamilyRecipient(recipientId);
    setSelectedRecipient(normalizedRecipient);
    navigate(buildFamilyShopPath({ recipient: normalizedRecipient }));
  };

  return (
    <div className="bg-white min-h-screen text-black font-sans overflow-x-hidden">
      {/* 1. Hero Section */}
      <FamilyHeroCarousel sectionData={sectionMap["hero-banners"]} />

      {/* Curated Collections Showcase */}
      <FamilyCuratedCollections
        sectionData={
          sectionMap.collections || sectionMap["curated-collections"]
        }
      />

      {/* Price Points Quick Access */}
      <FamilyPricePoints sectionData={sectionMap["luxury-within-reach"]} />

      {/* 2. Category Section */}
      <FamilyRecipientCategories
        selectedRecipient={selectedRecipient}
        onSelectRecipient={handleSelectRecipient}
        sectionData={sectionMap["shop-by-relation"]}
      />

      {/* Trending Section */}
      <FamilyTrendingNearYou sectionData={sectionMap["trending-near-you"]} />

      {/* Promotional Banner */}
      <FamilyPromoBanner sectionData={sectionMap["family-promo-banner"]} />

      {/* 3D Interactive Carousel */}
      <Family3DCarousel sectionData={sectionMap["gifts-to-remember"]} />

      {/* 3. Product Listing Section */}
      <FamilyProductsCatalog
        selectedRecipient={selectedRecipient}
        onSelectRecipient={handleSelectRecipient}
        sectionData={sectionMap["products-listing"]}
      />
    </div>
  );
};

export default ShopForFamily;
