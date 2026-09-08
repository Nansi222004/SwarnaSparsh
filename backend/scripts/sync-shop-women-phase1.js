require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("../src/config/db");
const HomepageSection = require("../src/models/HomepageSection");

const applyMode = process.argv.includes("--apply");

const phase1Sections = [
  {
    pageKey: "shop-women",
    sectionKey: "hero-banners",
    sectionId: "shop-women:hero-banners",
    sectionType: "banner",
    label: "Hero Banners",
    isActive: true,
    sortOrder: 1,
    settings: { autoplayMs: 3000 },
    items: [
      {
        itemId: "women-hero-1",
        type: "manual",
        name: "Sands Jewels Exclusive",
        label: "Eternal Radiance",
        subtitle: "Diamonds that capture the light and her heart.",
        image: "women_hero_radiance.png",
        path: "/shop?source=women&category=women",
        tag: "Shop for Women",
        ctaLabel: "Shop Diamonds",
        sortOrder: 0,
      },
    ],
  },
  {
    pageKey: "shop-women",
    sectionKey: "price-range-showcase",
    sectionId: "shop-women:price-range-showcase",
    sectionType: "promo-grid",
    label: "Curated Price Points",
    isActive: true,
    sortOrder: 2,
    settings: {},
    items: [
      {
        itemId: "women-under-1299",
        type: "manual",
        name: "Under INR 1299",
        label: "Under INR 1299",
        image: "",
        path: "/shop?source=women&price_max=1299",
        tag: "EVERYDAY ESSENTIALS",
        priceMax: 1299,
        price: "1299",
        sortOrder: 0,
      },
      {
        itemId: "women-under-1499",
        type: "manual",
        name: "Under INR 1499",
        label: "Under INR 1499",
        image: "",
        path: "/shop?source=women&price_max=1499",
        tag: "ELEGANT CHARMS",
        priceMax: 1499,
        price: "1499",
        sortOrder: 1,
      },
      {
        itemId: "women-under-1999",
        type: "manual",
        name: "Under INR 1999",
        label: "Under INR 1999",
        image: "",
        path: "/shop?source=women&price_max=1999",
        tag: "LUXURY STATEMENTS",
        priceMax: 1999,
        price: "1999",
        sortOrder: 2,
      },
    ],
  },
  {
    pageKey: "shop-women",
    sectionKey: "product-categories",
    sectionId: "shop-women:product-categories",
    sectionType: "category-grid",
    label: "Product Categories",
    isActive: true,
    sortOrder: 3,
    settings: {
      title: "Shop by Category",
      subtitle:
        "Handcrafted silver masterpieces, each piece telling a unique story of elegance.",
    },
    items: [
      {
        itemId: "women-rings",
        type: "manual",
        name: "Rings",
        label: "Rings",
        image: "Rings.png",
        path: "/shop?source=women&category=rings",
        sortOrder: 0,
      },
      {
        itemId: "women-earrings",
        type: "manual",
        name: "Earrings",
        label: "Earrings",
        image: "Earrings.png",
        path: "/shop?source=women&category=earrings",
        sortOrder: 1,
      },
      {
        itemId: "women-bracelets",
        type: "manual",
        name: "Bracelets",
        label: "Bracelets",
        image: "Bracelets.png",
        path: "/shop?source=women&category=bracelets",
        sortOrder: 2,
      },
      {
        itemId: "women-pendants",
        type: "manual",
        name: "Pendants",
        label: "Pendants",
        image: "Pendants.png",
        path: "/shop?source=women&category=pendants",
        sortOrder: 3,
      },
      {
        itemId: "women-chains",
        type: "manual",
        name: "Chains",
        label: "Chains",
        image: "Chains.png",
        path: "/shop?source=women&category=chains",
        sortOrder: 4,
      },
      {
        itemId: "women-bangles",
        type: "manual",
        name: "Bangles",
        label: "Bangles",
        image: "Bangles.png",
        path: "/shop?source=women&category=bangles",
        sortOrder: 5,
      },
      {
        itemId: "women-sets",
        type: "manual",
        name: "Sets",
        label: "Sets",
        image: "Sets.png",
        path: "/shop?source=women&category=sets",
        sortOrder: 6,
      },
      {
        itemId: "women-personalised",
        type: "manual",
        name: "Personalised",
        label: "Personalised",
        image: "Personalised.png",
        path: "/shop?source=women&category=personalised",
        sortOrder: 7,
      },
    ],
  },
];

const run = async () => {
  await connectDB();

  const summary = [];
  for (const section of phase1Sections) {
    if (applyMode) {
      // eslint-disable-next-line no-await-in-loop
      await HomepageSection.updateOne(
        { pageKey: section.pageKey, sectionKey: section.sectionKey },
        { $set: section },
        { upsert: true },
      );
    }

    // eslint-disable-next-line no-await-in-loop
    const existing = await HomepageSection.findOne({
      pageKey: section.pageKey,
      sectionKey: section.sectionKey,
    }).lean();

    summary.push({
      sectionKey: section.sectionKey,
      mode: applyMode ? "applied" : "dry-run",
      existsInDb: Boolean(existing),
      itemCountAfter: existing?.items?.length ?? section.items.length,
    });
  }

  console.log(
    JSON.stringify(
      {
        mode: applyMode ? "apply" : "dry-run",
        updatedSections: phase1Sections.length,
        summary,
      },
      null,
      2,
    ),
  );

  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error(err);
  try {
    await mongoose.disconnect();
  } catch (disconnectErr) {
    console.error(disconnectErr);
  }
  process.exit(1);
});
