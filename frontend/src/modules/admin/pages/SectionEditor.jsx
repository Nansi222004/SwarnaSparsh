import React, { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import PageHeader from '../components/common/PageHeader';
import AllJewellerySectionEditor from '../components/editors/AllJewellerySectionEditor';
import BestStylesSectionEditor from '../components/editors/BestStylesSectionEditor';
import ShopByBondEditor from '../components/editors/ShopByBondEditor';
import ShopByColourEditor from '../components/editors/ShopByColourEditor';
import SilverNewLaunchGridEditor from '../components/editors/SilverNewLaunchGridEditor';
import MenLuxurySectionEditor from '../components/editors/MenLuxurySectionEditor';
import CelebrateMenEditor from '../components/editors/CelebrateMenEditor';
import MenCuratedCollectionsEditor from '../components/editors/MenCuratedCollectionsEditor';
import MenExploreCollectionsEditor from '../components/editors/MenExploreCollectionsEditor';
import MenPersonalizedBannerEditor from '../components/editors/MenPersonalizedBannerEditor';
import MenPickYourGlamEditor from '../components/editors/MenPickYourGlamEditor';
import MenStyleGuideEditor from '../components/editors/MenStyleGuideEditor';
import MenStyleTrendsEditor from '../components/editors/MenStyleTrendsEditor';
import MenFeaturedProductsEditor from '../components/editors/MenFeaturedProductsEditor';
import WomenFeaturedProductsEditor from '../components/editors/WomenFeaturedProductsEditor';
import FamilyFeaturedProductsEditor from '../components/editors/FamilyFeaturedProductsEditor';
import GoldFeaturedProductsEditor from '../components/editors/GoldFeaturedProductsEditor';
import GoldTrustMarkersEditor from '../components/editors/GoldTrustMarkersEditor';
import CategoryShowcaseEditor from '../components/editors/CategoryShowcaseEditor';
import BannerSectionEditor from '../components/editors/BannerSectionEditor';
import BrandPromisesEditor from '../components/editors/BrandPromisesEditor';
import FAQSectionEditor from '../components/editors/FAQSectionEditor';
import TestimonialSectionEditor from '../components/editors/TestimonialSectionEditor';
import GenericJsonSectionEditor from '../components/editors/GenericJsonSectionEditor';
import { adminService } from '../services/adminService';
import { getPageConfig, getSectionDefaultsForPage } from '../utils/sectionDefaults';
import toast from 'react-hot-toast';

const SectionEditor = () => {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const [sectionData, setSectionData] = useState(null);
    const [saving, setSaving] = useState(false);
    const [reloading, setReloading] = useState(false);
    const pageKey = searchParams.get('pageKey') || 'home';
    const pageConfig = getPageConfig(pageKey);
    const requestSeqRef = useRef(0);

    const hydrateSection = (data) => {
        if (!data) return null;
        const items = (data.items || []).map((item) => ({
            id: item.itemId || item.id || item._id || `${Date.now()}_${Math.random()}`,
            ...item
        }));
        return {
            id: data.sectionId,
            sectionKey: data.sectionKey || id,
            pageKey: data.pageKey || pageKey,
            sectionType: data.sectionType || 'rich-content',
            label: data.label,
            items,
            settings: data.settings || {}
        };
    };

    const loadSection = async (mode = 'initial') => {
        const seq = ++requestSeqRef.current;
        if (mode === 'reload') setReloading(true);
        try {
            const data = await adminService.getSectionById(id, pageKey);
            if (seq !== requestSeqRef.current) return;
            const hydrated = hydrateSection(data);
            if (hydrated) setSectionData(hydrated);
        } catch (err) {
            toast.error(mode === 'reload' ? "Failed to reload section" : "Failed to load section");
        } finally {
            if (seq === requestSeqRef.current) setReloading(false);
        }
    };

    useEffect(() => {
        loadSection('initial');
    }, [id, pageKey]);

    if (!sectionData) {
        return <div className="p-10 text-center">Loading Section Editor...</div>;
    }

    const handleSave = async (newData) => {
        const seq = ++requestSeqRef.current;
        setSaving(true);
        try {
            const payload = {
                pageKey,
                sectionKey: sectionData.sectionKey || id,
                sectionType: sectionData.sectionType || 'rich-content',
                label: sectionData.label,
                settings: newData.settings || sectionData.settings || {},
                items: newData.items || []
            };
            const res = await adminService.updateSection(id, payload, pageKey);
            if (res.success === false) {
                toast.error(res.message || "Failed to save section");
                return { success: false };
            }
            const savedSection = res.data?.section || res.data?.data?.section || res.section || null;
            if (savedSection) {
                if (seq === requestSeqRef.current) {
                    const hydrated = hydrateSection(savedSection);
                    if (hydrated) {
                        hydrated.label = hydrated.label || sectionData.label;
                        setSectionData(hydrated);
                    }
                }
            } else {
                if (seq === requestSeqRef.current) {
                    setSectionData((prev) => ({
                        ...prev,
                        settings: newData.settings || prev.settings || {},
                        items: (newData.items || []).map((item) => ({
                            id: item.itemId || item.id || item._id || `${Date.now()}_${Math.random()}`,
                            ...item
                        }))
                    }));
                }
            }
            toast.success("Section updated");
            return { success: true };
        } catch (err) {
            toast.error("Failed to save section");
            return { success: false };
        } finally {
            if (seq === requestSeqRef.current) setSaving(false);
        }
    };

    const defaultSection = getSectionDefaultsForPage(pageKey).find((section) => (
        section.sectionKey === id || section.sectionId === id
    ));
    const defaultItems = defaultSection?.items || [];

    // Render appropriate editor based on section ID or type
    const renderEditor = () => {
        if ((sectionData.sectionKey || id) === 'gold-new-launch-banner' && pageKey === 'gold-collection') {
            return <CategoryShowcaseEditor sectionData={sectionData} onSave={handleSave} defaultItems={defaultItems} />;
        }

        if (sectionData.sectionType === 'banner') {
            return <BannerSectionEditor sectionData={sectionData} onSave={handleSave} defaultItems={defaultItems} />;
        }

        if (sectionData.sectionType === 'testimonial') {
            return <TestimonialSectionEditor sectionData={sectionData} onSave={handleSave} defaultItems={defaultItems} />;
        }

        if (sectionData.sectionType === 'faq') {
            return <FAQSectionEditor sectionData={sectionData} onSave={handleSave} defaultItems={defaultItems} />;
        }

        if ((sectionData.sectionKey || id) === 'brand-promises') {
            return <BrandPromisesEditor sectionData={sectionData} onSave={handleSave} defaultItems={defaultItems} />;
        }

        if ((sectionData.sectionKey || id) === 'all-jewellery') {
            return <AllJewellerySectionEditor sectionData={sectionData} onSave={handleSave} defaultSection={defaultSection} />;
        }

        if ((sectionData.sectionKey || id) === 'best-styles' || (sectionData.sectionKey || id) === 'featured-gifts') {
            return <BestStylesSectionEditor sectionData={sectionData} onSave={handleSave} defaultSection={defaultSection} />;
        }

        if ((sectionData.sectionKey || id) === 'shop-by-colour') {
            return <ShopByColourEditor sectionData={sectionData} onSave={handleSave} defaultSection={defaultSection} />;
        }

        if ((sectionData.sectionKey || id) === 'shop-by-bond') {
            return <ShopByBondEditor sectionData={sectionData} onSave={handleSave} defaultSection={defaultSection} />;
        }

        if ((sectionData.sectionKey || id) === 'shop-by-relation') {
            return <ShopByBondEditor sectionData={sectionData} onSave={handleSave} defaultSection={defaultSection} />;
        }

        if ((sectionData.sectionKey || id) === 'silver-new-launch-grid') {
            return <SilverNewLaunchGridEditor sectionData={sectionData} onSave={handleSave} defaultSection={defaultSection} />;
        }

        if ((sectionData.sectionKey || id) === 'luxury-section') {
            return <MenLuxurySectionEditor sectionData={sectionData} onSave={handleSave} defaultSection={defaultSection} />;
        }

        if ((sectionData.sectionKey || id) === 'celebrate-men') {
            return <CelebrateMenEditor sectionData={sectionData} onSave={handleSave} defaultSection={defaultSection} />;
        }

        if ((sectionData.sectionKey || id) === 'curated-collections' && pageKey === 'shop-men') {
            return <MenCuratedCollectionsEditor sectionData={sectionData} onSave={handleSave} defaultSection={defaultSection} />;
        }

        if ((sectionData.sectionKey || id) === 'explore-collections' && pageKey === 'shop-men') {
            return <MenExploreCollectionsEditor sectionData={sectionData} onSave={handleSave} defaultSection={defaultSection} />;
        }

        if ((sectionData.sectionKey || id) === 'personalized-banner' && pageKey === 'shop-men') {
            return <MenPersonalizedBannerEditor sectionData={sectionData} onSave={handleSave} defaultSection={defaultSection} />;
        }

        if ((sectionData.sectionKey || id) === 'personalized-banner' && pageKey === 'shop-women') {
            return <BannerSectionEditor sectionData={sectionData} onSave={handleSave} defaultItems={defaultItems} />;
        }

        if ((sectionData.sectionKey || id) === 'pick-your-glam' && pageKey === 'shop-men') {
            return <MenPickYourGlamEditor sectionData={sectionData} onSave={handleSave} defaultSection={defaultSection} />;
        }

        if ((sectionData.sectionKey || id) === 'style-guide' && pageKey === 'shop-men') {
            return <MenStyleGuideEditor sectionData={sectionData} onSave={handleSave} defaultSection={defaultSection} />;
        }

        if ((sectionData.sectionKey || id) === 'style-trends' && pageKey === 'shop-men') {
            return <MenStyleTrendsEditor sectionData={sectionData} onSave={handleSave} defaultSection={defaultSection} />;
        }

        if ((sectionData.sectionKey || id) === 'products-listing' && pageKey === 'shop-men') {
            return <MenFeaturedProductsEditor sectionData={sectionData} onSave={handleSave} defaultSection={defaultSection} />;
        }

        if ((sectionData.sectionKey || id) === 'products-listing' && pageKey === 'shop-women') {
            return <WomenFeaturedProductsEditor sectionData={sectionData} onSave={handleSave} defaultSection={defaultSection} />;
        }

        if ((sectionData.sectionKey || id) === 'products-listing' && pageKey === 'shop-family') {
            return <FamilyFeaturedProductsEditor sectionData={sectionData} onSave={handleSave} defaultSection={defaultSection} />;
        }

        if ((sectionData.sectionKey || id) === 'gold-products-listing' && pageKey === 'gold-collection') {
            return <GoldFeaturedProductsEditor sectionData={sectionData} onSave={handleSave} defaultSection={defaultSection} />;
        }

        if ((sectionData.sectionKey || id) === 'gold-trust-markers' && pageKey === 'gold-collection') {
            return <GoldTrustMarkersEditor sectionData={sectionData} onSave={handleSave} defaultItems={defaultItems} />;
        }

        const supportedSections = [
            'silver-collection',
            'silver-curated',
            'luxury-within-reach',
            'category-grid',
            'collections',
            'categories-grid',
            'trending-near-you',
            'product-categories',
            'curated-collections',
            'occasion-carousel',
            'gifts-to-remember',
            'discover-hue',
            'promo-banners',
            'premium-category-cards',
            'category-showcase',
            'price-range-showcase',
            'perfect-gift',
            'new-launch',
            'latest-drop',
            'most-gifted',
            'proposal-rings',
            'curated-for-you',
            'style-it-your-way',
            'hero-banners-gold',
            'gold-category-grid',
            'gold-explore-collections',
            'gold-trust-markers',
            'gold-new-launch-banner',
            'gold-exclusive-launch',
            'gold-ring-carousel',
            'gold-shop-by-colour',
            'gold-luxury-within-reach',
            'gold-curated-bond',
            'gold-curated-showcase',
            'gold-lifestyle-grid',
            'gold-products-listing'
        ];

        if (supportedSections.includes(sectionData.sectionKey || id)) {
            return <CategoryShowcaseEditor sectionData={sectionData} onSave={handleSave} defaultItems={defaultItems} />;
        }

        // Never leave admins at a dead-end "not implemented" screen in production.
        // Use a safe JSON fallback editor so content remains editable even for new/legacy section keys.
        return <GenericJsonSectionEditor sectionData={sectionData} onSave={handleSave} />;
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <div className="max-w-[1400px] mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 p-6 md:p-8">
                <PageHeader
                    title={`Edit ${sectionData.label}`}
                    subtitle={saving ? "Saving changes..." : `Customize the content for ${pageConfig?.label || 'this page'} section`}
                    backPath={`/admin/sections?pageKey=${pageKey}`}
                    action={{
                        label: reloading ? 'Reloading...' : 'Reload',
                        onClick: () => loadSection('reload')
                    }}
                />

                {renderEditor()}
            </div>
        </div>
    );
};

export default SectionEditor;
