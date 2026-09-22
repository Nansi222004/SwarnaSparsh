const path = require('path');
const backendDir = path.resolve(__dirname, '..', '..');
const mongoose = require(path.join(backendDir, 'node_modules', 'mongoose'));
const dotenv = require(path.join(backendDir, 'node_modules', 'dotenv'));
dotenv.config({ path: path.join(backendDir, '.env') });

const HomepageSection = require(path.join(backendDir, 'src', 'models', 'HomepageSection'));

const SECTIONS = [
  {
    pageKey: "diamond-collection",
    sectionKey: "hero-banners-diamond",
    sectionType: "banner",
    label: "Hero Banners",
    isActive: true,
    sortOrder: 1,
    settings: {
      autoplayMs: 4000,
    },
    items: [
      {
        itemId: "diamond-hero-1",
        label: "Eternal Diamond Brilliance",
        name: "Eternal Diamond Brilliance",
        title: "Eternal Diamond Brilliance",
        subtitle: "Handcrafted Luxury with Certified Natural & Lab-Grown Diamonds",
        description: "Handcrafted Luxury with Certified Natural & Lab-Grown Diamonds",
        tag: "Certified Diamond Atelier",
        ctaLabel: "Shop Diamond Collection",
        path: "/shop?metal=diamond",
        image: "eternal_diamond_brilliance.png",
      }
    ],
  },
  {
    pageKey: "diamond-collection",
    sectionKey: "diamond-shop-by-type",
    sectionType: "rich-content",
    label: "Shop by Diamond Type",
    isActive: true,
    sortOrder: 2,
    settings: {
      title: "Natural & Lab-Grown Diamonds",
      subtitle: "Choose your brilliance with complete authenticity and transparency",
      badge: "Curated Origins",
    },
    items: [
      {
        itemId: "diamond-natural",
        name: "Natural Diamonds",
        label: "Natural Diamonds",
        tag: "Timeless Brilliance, Naturally Formed",
        subtitle: "Formed over billions of years deep within Earth, celebrating eternal heritage and certified rarity.",
        path: "/shop?metal=diamond&diamondType=natural",
        image: "diamond_luxury.png",
        sortOrder: 0,
      },
      {
        itemId: "diamond-lab-grown",
        name: "Lab-Grown Diamonds",
        label: "Lab-Grown Diamonds",
        tag: "Modern Brilliance, Consciously Crafted",
        subtitle: "Chemically, physically, and optically identical to mined diamonds, offering exceptional clarity with modern innovation.",
        path: "/shop?metal=diamond&diamondType=lab_grown",
        image: "diamond_elegance_campaign.png",
        sortOrder: 1,
      }
    ],
  },
  {
    pageKey: "diamond-collection",
    sectionKey: "diamond-category-grid",
    sectionType: "category-grid",
    label: "Diamond Category Showcase",
    isActive: true,
    sortOrder: 3,
    settings: {
      title: "Curated Diamond Categories",
      subtitle: "Everyday elegance to grand celebrations, crafted in fine gold & diamonds",
      badge: "Signature Atelier",
    },
    items: [
      { itemId: "dcat-1", name: "Diamond Rings", label: "Diamond Rings", tag: "Solitaires & Bands", path: "/shop?metal=diamond&search=ring", image: "rings.png" },
      { itemId: "dcat-2", name: "Diamond Earrings", label: "Diamond Earrings", tag: "Studs & Drops", path: "/shop?metal=diamond&search=earring", image: "earrings.png" },
      { itemId: "dcat-3", name: "Diamond Pendants", label: "Diamond Pendants", tag: "Chains & Lockets", path: "/shop?metal=diamond&search=necklace", image: "pendants.png" },
      { itemId: "dcat-4", name: "Diamond Bangles", label: "Diamond Bangles", tag: "Kadas & Cuffs", path: "/shop?metal=diamond&search=bangles", image: "bangle.png" },
      { itemId: "dcat-5", name: "Solitaire Jewellery", label: "Solitaire Jewellery", tag: "Certified Solitaires", path: "/shop?metal=diamond&search=solitaire", image: "diamond_ring.png" },
      { itemId: "dcat-6", name: "Diamond Mangalsutra", label: "Diamond Mangalsutra", tag: "Sacred Sparkle", path: "/shop?metal=diamond&search=mangalsutra", image: "mangalsutra.png" },
      { itemId: "dcat-7", name: "Diamond Bracelets", label: "Diamond Bracelets", tag: "Tennis & Charm", path: "/shop?metal=diamond&search=bracelet", image: "bracelets.png" },
      { itemId: "dcat-8", name: "Diamond Nose Pins", label: "Diamond Nose Pins", tag: "Subtle Radiance", path: "/shop?metal=diamond&search=nosepin", image: "nosepin.png" },
    ],
  },
  {
    pageKey: "diamond-collection",
    sectionKey: "diamond-shapes",
    sectionType: "promo-grid",
    label: "Shop by Diamond Shape",
    isActive: true,
    sortOrder: 4,
    settings: {
      title: "Discover Your Signature Cut",
      subtitle: "Each facet geometry reflects light with a unique character and brilliance",
      badge: "Cut & Silhouette",
    },
    items: [
      { itemId: "shape-round", name: "Round Brilliant", label: "Round Brilliant", tag: "Maximum Fire & Scintillation", path: "/shop?metal=diamond&shape=round" },
      { itemId: "shape-oval", name: "Oval Cut", label: "Oval Cut", tag: "Elongated Elegance", path: "/shop?metal=diamond&shape=oval" },
      { itemId: "shape-princess", name: "Princess Cut", label: "Princess Cut", tag: "Modern Geometric Sparkle", path: "/shop?metal=diamond&shape=princess" },
      { itemId: "shape-pear", name: "Pear Cut", label: "Pear Cut", tag: "Graceful Teardrop Silhouette", path: "/shop?metal=diamond&shape=pear" },
      { itemId: "shape-cushion", name: "Cushion Cut", label: "Cushion Cut", tag: "Romantic Pillow Softness", path: "/shop?metal=diamond&shape=cushion" },
      { itemId: "shape-emerald", name: "Emerald Cut", label: "Emerald Cut", tag: "Sophisticated Step-Cut Hall of Mirrors", path: "/shop?metal=diamond&shape=emerald" },
      { itemId: "shape-heart", name: "Heart Cut", label: "Heart Cut", tag: "Symbol of Everlasting Devotion", path: "/shop?metal=diamond&shape=heart" },
      { itemId: "shape-marquise", name: "Marquise Cut", label: "Marquise Cut", tag: "Regal Boat-Shaped Carat Presence", path: "/shop?metal=diamond&shape=marquise" },
    ],
  },
  {
    pageKey: "diamond-collection",
    sectionKey: "diamond-4cs-guide",
    sectionType: "rich-content",
    label: "The 4Cs Education Guide",
    isActive: true,
    sortOrder: 5,
    settings: {
      title: "Understanding The 4Cs of Diamonds",
      subtitle: "The universal benchmark of diamond quality and value explained by our gemologists",
      badge: "Buyer's Masterclass",
    },
    items: [
      {
        itemId: "4c-cut",
        name: "Cut",
        label: "Cut (Brilliance & Fire)",
        tag: "Proportion & Symmetry",
        subtitle: "The most important factor influencing brilliance. Cut determines how light enters the diamond, bounces internally, and refracts back to your eye as rainbow fire.",
        description: "Grades: Ideal, Excellent, Very Good, Good.",
      },
      {
        itemId: "4c-colour",
        name: "Colour",
        label: "Colour (Purity)",
        tag: "Graded D to Z",
        subtitle: "Evaluated by how close the stone is to being entirely colorless. Truly colorless diamonds (D, E, F) allow the purest light transmission with no visible tint.",
        description: "Ranges: D-F (Colorless), G-J (Near Colorless), K-M (Faint Tint).",
      },
      {
        itemId: "4c-clarity",
        name: "Clarity",
        label: "Clarity (Natural Micro-Marks)",
        tag: "Microscopic Inclusions",
        subtitle: "Measures the presence of internal inclusions and surface blemishes under 10x magnification. Eye-clean diamonds show flawless beauty without visible imperfections.",
        description: "Grades: FL/IF (Flawless), VVS1-VVS2 (Very Very Slight), VS1-VS2 (Very Slight), SI1-SI2.",
      },
      {
        itemId: "4c-carat",
        name: "Carat",
        label: "Carat (Weight & Scale)",
        tag: "Weight & Visual Size",
        subtitle: "Refers to the diamond's metric weight (1 carat = 200 milligrams). Balanced proportions ensure the diamond appears full and radiant in its setting.",
        description: "Calibrated precision for rings, pendants, and solitaires.",
      },
    ],
  },
  {
    pageKey: "diamond-collection",
    sectionKey: "diamond-trust-markers",
    sectionType: "promo-grid",
    label: "Diamond Trust & Certification",
    isActive: true,
    sortOrder: 6,
    settings: {
      title: "The Alankar Assurance",
      subtitle: "Every diamond comes with verified grading, lifetime care, and absolute purity",
      badge: "Certified Trust",
    },
    items: [
      {
        itemId: "diamond-trust-1",
        name: "100% Certified",
        label: "100% Certified",
        subtitle: "Authentic Diamonds",
        description: "Independent laboratory grading (IGI, GIA or SGL certificate with serial mark)",
        iconName: "ShieldCheck",
      },
      {
        itemId: "diamond-trust-2",
        name: "Lifetime Exchange",
        label: "Lifetime Exchange",
        subtitle: "& Buyback Assurance",
        description: "Transparent value upgrade policy on your fine diamond jewellery anytime",
        iconName: "RefreshCw",
      },
      {
        itemId: "diamond-trust-3",
        name: "Easy 15 Days Return",
        label: "Easy 15 Days Return",
        subtitle: "No Questions Asked",
        description: "100% insured doorstep dispatch and hassle-free return pickup across India",
        iconName: "RotateCcw",
      },
      {
        itemId: "diamond-trust-4",
        name: "Hallmark Purity",
        label: "Hallmark Purity",
        subtitle: "BIS Stamped Assurance",
        description: "100% genuine gold settings stamped with official government hallmark",
        iconName: "Star",
      },
    ],
  },
  {
    pageKey: "diamond-collection",
    sectionKey: "diamond-curated-collections",
    sectionType: "promo-grid",
    label: "Curated Diamond Edits",
    isActive: true,
    sortOrder: 7,
    settings: {
      title: "Curated Diamond Edits",
      subtitle: "Selected by our creative studio for specific budgets, styling moods, and moments",
      badge: "Curated Moods",
    },
    items: [
      {
        itemId: "edit-everyday",
        name: "Everyday Sparkle",
        label: "Everyday Sparkle",
        tag: "Under ₹35,000",
        subtitle: "Delicate rings, minimalist studs, and dainty pendants designed for daily wear.",
        path: "/shop?metal=diamond&priceMax=35000",
      },
      {
        itemId: "edit-solitaire",
        name: "The Solitaire Edit",
        label: "The Solitaire Edit",
        tag: "Signature Single Stones",
        subtitle: "Statement solitaire rings and pendants for milestone engagements and anniversaries.",
        path: "/shop?metal=diamond&search=solitaire",
      },
      {
        itemId: "edit-bridal",
        name: "Bridal & Statement",
        label: "Bridal & Statement",
        tag: "Grand Celebrations",
        subtitle: "Extravagant diamond necklaces, chandelier earrings, and heirloom cocktail cuffs.",
        path: "/shop?metal=diamond&search=necklace",
      },
      {
        itemId: "edit-office",
        name: "Modern Atelier",
        label: "Modern Atelier",
        tag: "Contemporary Chic",
        subtitle: "Clean geometric profiles and stackable diamond bands for boardroom poise.",
        path: "/shop?metal=diamond&search=ring",
      },
    ],
  },
  {
    pageKey: "diamond-collection",
    sectionKey: "diamond-products-listing",
    sectionType: "product-carousel",
    label: "Explore Our Diamond Collection",
    isActive: true,
    sortOrder: 8,
    settings: {
      title: "Explore Our Diamond Collection",
      subtitle: "Handcrafted certified solitaires, fine diamond rings, and heirloom creations shaped by master artisans for milestone moments.",
      eyebrow: "Atelier Showcase",
      sourceMode: "dynamic",
      productLimit: 12,
    },
    items: [],
  },
  {
    pageKey: "diamond-collection",
    sectionKey: "diamond-bespoke-consultation",
    sectionType: "rich-content",
    label: "Bespoke Consultation / Concierge",
    isActive: false,
    sortOrder: 9,
    settings: {
      title: "Create Your Bespoke Diamond Piece",
      subtitle: "Collaborate directly with our master craftsmen to design a one-of-a-kind diamond ring, custom setting, or heirloom redesign.",
      badge: "Private Atelier Service",
      whatsappNumber: "919876543210",
      ctaLabel: "Chat on WhatsApp",
      ctaPath: "https://wa.me/919876543210?text=Hello%20Alankar%20Jewellers,%20I'd%20like%20to%20inquire%20about%20a%20bespoke%20diamond%20jewellery%20design.",
    },
    items: [],
  },
];

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    for (const sec of SECTIONS) {
      const sectionId = `diamond-collection:${sec.sectionKey}`;
      const existing = await HomepageSection.findOne({
        pageKey: 'diamond-collection',
        sectionKey: sec.sectionKey
      });

      if (!existing) {
        console.log(`[SEEDING] Creating new section: ${sec.sectionKey}`);
        await HomepageSection.create({
          ...sec,
          sectionId
        });
      } else {
        console.log(`[EXISTING] Updating sortOrder & defaults for: ${sec.sectionKey}`);
        existing.sortOrder = sec.sortOrder;
        existing.label = sec.label;
        if (!existing.items || existing.items.length === 0) {
          existing.items = sec.items;
        }
        if (!existing.settings || Object.keys(existing.settings).length === 0) {
          existing.settings = sec.settings;
        }
        await existing.save();
      }
    }

    const count = await HomepageSection.countDocuments({ pageKey: 'diamond-collection' });
    console.log(`\nSuccessfully verified diamond-collection sections in DB! Total count: ${count}`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error seeding sections:', err);
    process.exit(1);
  }
}

run();
