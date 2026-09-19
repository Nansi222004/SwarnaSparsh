const path = require('path');
const backendDir = 'd:/Appzeto_Projects/AlankaJewllers/backend';
const mongoose = require(backendDir + '/node_modules/mongoose');
const dotenv = require(backendDir + '/node_modules/dotenv');
dotenv.config({ path: backendDir + '/.env' });

const HomepageSection = require(backendDir + '/src/models/HomepageSection');

const TARGET_SILVER_ITEMS = [
  {
    itemId: 'silver-rings',
    name: '925 Silver Rings',
    label: '925 Silver Rings',
    tag: 'Everyday elegance in genuine sterling silver',
    image: 'rings.png',
    path: '/shop?metal=silver&silver_type=925&category=finger-ring',
    sortOrder: 0
  },
  {
    itemId: 'silver-earrings',
    name: '925 Silver Earrings',
    label: '925 Silver Earrings',
    tag: 'Timeless silver styles for every occasion',
    image: 'earrings.png',
    path: '/shop?metal=silver&silver_type=925&category=earrings',
    sortOrder: 1
  },
  {
    itemId: 'silver-chains',
    name: '925 Silver Chains & Necklaces',
    label: '925 Silver Chains & Necklaces',
    tag: 'Classic silver essentials',
    image: 'silverchains.png',
    path: '/shop?metal=silver&silver_type=925&category=necklace',
    sortOrder: 2
  },
  {
    itemId: 'silver-bracelets',
    name: '925 Silver Bracelets',
    label: '925 Silver Bracelets',
    tag: 'Refined styles for everyday wear',
    image: 'bracelets.png',
    path: '/shop?metal=silver&silver_type=925&category=bracelet',
    sortOrder: 3
  }
];

async function run() {
  const isApply = process.argv.includes('--apply');
  console.log(`\n================ MIGRATION: SHOP BY SILVER (${isApply ? 'APPLY MODE' : 'DRY RUN ONLY'}) ================\n`);

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const totalSectionsBefore = await HomepageSection.countDocuments({ pageKey: 'home' });
    console.log(`Total homepage sections currently in database: ${totalSectionsBefore}`);

    const existing = await HomepageSection.findOne({
      pageKey: 'home',
      sectionKey: 'shop-by-silver'
    }).lean();

    console.log('\n[CURRENT RECORD IN DATABASE]:');
    if (existing) {
      console.log(`- _id: ${existing._id}`);
      console.log(`- pageKey: "${existing.pageKey}"`);
      console.log(`- sectionKey: "${existing.sectionKey}"`);
      console.log(`- label: "${existing.label}"`);
      console.log(`- sortOrder: ${existing.sortOrder}`);
      console.log(`- isActive: ${existing.isActive}`);
      console.log(`- settings:`, JSON.stringify(existing.settings, null, 2));
      console.log(`- items (${existing.items?.length || 0}):`);
      (existing.items || []).forEach((item, idx) => {
        console.log(`    [${idx + 1}] id: ${item.itemId || item.id} | name: "${item.name}" | tag: "${item.tag}" | image: "${item.image}" | path: "${item.path}"`);
      });
    } else {
      console.log('Record does not exist yet. Will be inserted as a new section document.');
    }

    const existingSettings = existing?.settings || {};

    const targetLabel = 'Shop by Silver (Silver Type Panel)';
    const targetSortOrder = 2.25;
    const targetIsActive = existing?.isActive !== undefined ? existing.isActive : true;

    const mergedSettings = {
      ...existingSettings,
      title: existingSettings.title || 'Shop by Silver',
      subtitle: existingSettings.subtitle || 'Handcrafted 925 Sterling Silver',
      badge: existingSettings.badge || 'Pure 925 Silver',
      position: existingSettings.position || 'right',
      enabled: existingSettings.enabled !== undefined ? existingSettings.enabled : true
    };

    console.log('\n[TARGET PROPOSED STATE]:');
    console.log(`- pageKey: "home"`);
    console.log(`- sectionKey: "shop-by-silver"`);
    console.log(`- sectionType: "promo-grid"`);
    console.log(`- label: "${targetLabel}"`);
    console.log(`- sortOrder: ${targetSortOrder}`);
    console.log(`- isActive: ${targetIsActive}`);
    console.log(`- settings:`, JSON.stringify(mergedSettings, null, 2));
    console.log(`- items (${TARGET_SILVER_ITEMS.length}):`);
    TARGET_SILVER_ITEMS.forEach((item, idx) => {
      console.log(`    [${idx + 1}] itemId: ${item.itemId} | name: "${item.name}" | tag: "${item.tag}" | image: "${item.image}" | path: "${item.path}"`);
    });

    const updateOps = {
      $set: {
        pageKey: 'home',
        sectionKey: 'shop-by-silver',
        sectionType: 'promo-grid',
        label: targetLabel,
        sortOrder: targetSortOrder,
        isActive: targetIsActive,
        'settings.title': mergedSettings.title,
        'settings.subtitle': mergedSettings.subtitle,
        'settings.badge': mergedSettings.badge,
        'settings.position': mergedSettings.position,
        'settings.enabled': mergedSettings.enabled,
        items: TARGET_SILVER_ITEMS
      }
    };

    console.log('\n[EXACT MONGODB UPDATE OPERATOR]:');
    console.log(JSON.stringify(updateOps, null, 2));

    if (!isApply) {
      console.log('\n>>> DRY RUN COMPLETED.');
      console.log('>>> NO changes were made to MongoDB.');
      console.log('>>> All other homepage sections and settings remain 100% preserved.');
      console.log('>>> Waiting for explicit user approval before applying.\n');
    } else {
      const result = await HomepageSection.findOneAndUpdate(
        { pageKey: 'home', sectionKey: 'shop-by-silver' },
        updateOps,
        { upsert: true, new: true }
      );
      console.log('\n>>> SUCCESS: shop-by-silver section has been updated in MongoDB.');
      console.log('Document _id:', result._id);
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
}

run();
