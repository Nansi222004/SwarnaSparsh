import React from 'react';
import CollectionCategoryGrid from './CollectionCategoryGrid';
import { homeCategoryGridDefaults } from '../utils/homeCategoryGridDefaults';
import {
    goldCollectionGridDefaults,
    silverCollectionGridDefaults,
    diamondCollectionGridDefaults
} from '../utils/collectionGridDefaults';

export const CategoryGrid = () => {
    return (
        <CollectionCategoryGrid
            sectionKey="category-grid"
            defaultTitle="Shop by Category"
            defaultEyebrow="Curated Dimensions"
            defaultSubtitle="Handcrafted Categories"
            defaultItems={homeCategoryGridDefaults}
            bgClass="bg-[#FAF8F5]"
        />
    );
};

export const GoldCollectionGrid = () => {
    return (
        <CollectionCategoryGrid
            sectionKey="gold-collection-grid"
            defaultTitle="Gold Collection"
            defaultEyebrow="Pure Radiance"
            defaultSubtitle="Timeless gold jewellery crafted with exceptional artistry"
            defaultItems={goldCollectionGridDefaults}
            bgClass="bg-white"
        />
    );
};

export const SilverCollectionGrid = () => {
    return (
        <CollectionCategoryGrid
            sectionKey="silver-collection-grid"
            defaultTitle="Silver Collection"
            defaultEyebrow="Sterling Elegance"
            defaultSubtitle="Handcrafted 925 sterling silver essentials for everyday elegance"
            defaultItems={silverCollectionGridDefaults}
            bgClass="bg-[#FAF8F5]"
        />
    );
};

export const DiamondCollectionGrid = () => {
    return (
        <CollectionCategoryGrid
            sectionKey="diamond-collection-grid"
            defaultTitle="Diamond Collection"
            defaultEyebrow="Timeless Sparkle"
            defaultSubtitle="Dazzling certified diamond jewellery designed to capture light"
            defaultItems={diamondCollectionGridDefaults}
            bgClass="bg-white"
        />
    );
};

export default CategoryGrid;
