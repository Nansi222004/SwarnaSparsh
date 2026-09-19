const path = require('path');
const backendDir = 'd:/Appzeto_Projects/AlankaJewllers/backend';
const mongoose = require(backendDir + '/node_modules/mongoose');
const dotenv = require(backendDir + '/node_modules/dotenv');
dotenv.config({ path: backendDir + '/.env' });

const HomepageSection = require(backendDir + '/src/models/HomepageSection');

const TARGET_DIAMOND_ITEMS = [
  {
    itemId: 'diamond-natural',
    name: 'Natural Diamonds',
    label: 'Natural Diamonds',
    tag: 'Timeless Brilliance, Naturally Formed',
    image: 'diamond_luxury.png',
    path: '/shop?metal=diamond&diamondType=natural',
    sortOrder: 0
  },
  {
    itemId: 'diamond-lab-grown',
    name: 'Lab-Grown Diamonds',
    label: 'Lab-Grown Diamonds',
    tag: 'Modern Brilliance, Beautifully Created',
    image: 'diamond_elegance_campaign.png',
    path: '/shop?metal=diamond&diamondType=lab_grown',
    sortOrder: 1
  }
];

async function run() {
  const isApply = process.argv.includes('--apply');
  console.log(`\n================ MIGRATION: SHOP BY DIAMOND (${isApply ? 'APPLY MODE' : 'DRY RUN ONLY'}) ================\n`);

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const totalSectionsBefore = await HomepageSection.countDocuments({ pageKey: 'home' });
    console.log(`Total homepage sections currently in database: ${totalSectionsBefore}`);

    const existing = await HomepageSection.findOne({
      pageKey: 'home',
      sectionKey: 'shop-by-diamond'
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

    const targetLabel = 'Shop by Diamond (Diamond Type Panel)';
    const targetSortOrder = 2.35;
    const targetIsActive = existing?.isActive !== undefined ? existing.isActive : true;

    const mergedSettings = {
      ...existingSettings,
      title: existingSettings.title || 'Shop by Diamond Type',
      subtitle: existingSettings.subtitle || 'Discover brilliance, your way.',
      badge: existingSettings.badge || 'DIAMOND COLLECTION',
      position: existingSettings.position || 'right',
      enabled: existingSettings.enabled !== undefined ? existingSettings.enabled : true
    };

    console.log('\n[TARGET PROPOSED STATE]:');
    console.log(`- pageKey: "home"`);
    console.log(`- sectionKey: "shop-by-diamond"`);
    console.log(`- sectionType: "promo-grid"`);
    console.log(`- label: "${targetLabel}"`);
    console.log(`- sortOrder: ${targetSortOrder}`);
    console.log(`- isActive: ${targetIsActive}`);
    console.log(`- settings:`, JSON.stringify(mergedSettings, null, 2));
    console.log(`- items (${TARGET_DIAMOND_ITEMS.length}):`);
    TARGET_DIAMOND_ITEMS.forEach((item, idx) => {
      console.log(`    [${idx + 1}] itemId: ${item.itemId} | name: "${item.name}" | tag: "${item.tag}" | image: "${item.image}" | path: "${item.path}"`);
    });

    const updateOps = {
      $set: {
        pageKey: 'home',
        sectionKey: 'shop-by-diamond',
        sectionType: 'promo-grid',
        label: targetLabel,
        sortOrder: targetSortOrder,
        isActive: targetIsActive,
        'settings.title': mergedSettings.title,
        'settings.subtitle': mergedSettings.subtitle,
        'settings.badge': mergedSettings.badge,
        'settings.position': mergedSettings.position,
        'settings.enabled': mergedSettings.enabled,
        items: TARGET_DIAMOND_ITEMS
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
        { pageKey: 'home', sectionKey: 'shop-by-diamond' },
        updateOps,
        { upsert: true, new: true }
      );
      console.log('\n>>> SUCCESS: shop-by-diamond section has been updated in MongoDB.');
      console.log('Document _id:', result._id);
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
}

run();
