const path = require('path');
const backendDir = 'd:/Appzeto_Projects/AlankaJewllers/backend';
const mongoose = require(backendDir + '/node_modules/mongoose');
const dotenv = require(backendDir + '/node_modules/dotenv');
dotenv.config({ path: backendDir + '/.env' });

const HomepageSection = require(backendDir + '/src/models/HomepageSection');

const TARGET_ITEMS = [
  {
    itemId: 'colour-white-gold',
    name: 'White Gold',
    label: 'White Gold',
    tag: 'Pure Modern Brilliance',
    image: 'gold_color_white.png',
    path: '/shop?metal=gold&tone=white-gold',
    sortOrder: 0
  },
  {
    itemId: 'colour-rose-gold',
    name: 'Rose Gold',
    label: 'Rose Gold',
    tag: 'Warm Romantic Glow',
    image: 'gold_color_rose.png',
    path: '/shop?metal=gold&tone=rose-gold',
    sortOrder: 1
  },
  {
    itemId: 'colour-gold',
    name: 'Gold',
    label: 'Gold',
    tag: 'Classic 22K Radiance',
    image: 'gold_color_yellow.png',
    path: '/shop?metal=gold',
    sortOrder: 2
  }
];

async function run() {
  const isApply = process.argv.includes('--apply');
  console.log(`\n================ MIGRATION: SHOP BY COLOUR (${isApply ? 'APPLY MODE' : 'DRY RUN'}) ================\n`);

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const existing = await HomepageSection.findOne({
      pageKey: 'home',
      sectionKey: 'shop-by-colour'
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
      console.log('Record does not exist yet. Will be inserted.');
    }

    const existingSettings = existing?.settings || {};

    // Preserve all existing settings keys, only add default values for missing keys
    const mergedSettings = {
      ...existingSettings,
      title: existingSettings.title || 'Shop by Colour',
      subtitle: existingSettings.subtitle || 'Choose Your Gold Tone',
      badge: existingSettings.badge || 'Atelier Palette',
      position: existingSettings.position || 'right',
      enabled: existingSettings.enabled !== undefined ? existingSettings.enabled : true
    };

    const targetLabel = 'Shop by Colour (Gold Tone Panel)';
    const targetSortOrder = 2.15;
    const targetIsActive = existing?.isActive !== undefined ? existing.isActive : true;

    console.log('\n[PRESERVED & MERGED TARGET STATE]:');
    console.log(`- label: "${targetLabel}"`);
    console.log(`- sortOrder: ${targetSortOrder}`);
    console.log(`- isActive: ${targetIsActive} (preserved from existing: ${existing?.isActive !== undefined})`);
    console.log(`- settings (preserved all existing keys, merged new defaults):`, JSON.stringify(mergedSettings, null, 2));
    console.log(`- items (${TARGET_ITEMS.length}):`);
    TARGET_ITEMS.forEach((item, idx) => {
      console.log(`    [${idx + 1}] itemId: ${item.itemId} | name: "${item.name}" | tag: "${item.tag}" | image: "${item.image}" | path: "${item.path}"`);
    });

    // We build a targeted $set object using dot notation for newly added settings fields,
    // thereby strictly preserving any existing custom settings in MongoDB.
    const updateOps = {
      $set: {
        label: targetLabel,
        sortOrder: targetSortOrder,
        isActive: targetIsActive,
        'settings.subtitle': mergedSettings.subtitle,
        'settings.badge': mergedSettings.badge,
        'settings.position': mergedSettings.position,
        'settings.enabled': mergedSettings.enabled,
        items: TARGET_ITEMS
      }
    };

    // If title was somehow missing, set default; otherwise keep untouched
    if (!existingSettings.title) {
      updateOps.$set['settings.title'] = mergedSettings.title;
    }

    console.log('\n[EXACT MONGODB UPDATE OPERATOR]:');
    console.log(JSON.stringify(updateOps, null, 2));

    if (!isApply) {
      console.log('\n>>> DRY RUN COMPLETED. No database changes were made.');
      console.log('>>> Migration is idempotent and safe to run once approved.\n');
    } else {
      const result = await HomepageSection.findOneAndUpdate(
        { pageKey: 'home', sectionKey: 'shop-by-colour' },
        updateOps,
        { upsert: true, new: true }
      );
      console.log('\n>>> SUCCESS: shop-by-colour section has been updated in MongoDB.');
      console.log('Updated document _id:', result._id);
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
}

run();
