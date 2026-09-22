const path = require('path');
const backendDir = 'd:/Appzeto_Projects/AlankaJewllers/backend';
const mongoose = require(backendDir + '/node_modules/mongoose');
const dotenv = require(backendDir + '/node_modules/dotenv');
dotenv.config({ path: backendDir + '/.env' });

const HomepageSection = require(backendDir + '/src/models/HomepageSection');

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  // Test 1: Query diamond-shop-by-type
  const typeSection = await HomepageSection.findOne({ pageKey: 'diamond-collection', sectionKey: 'diamond-shop-by-type' });
  console.log('1. Found diamond-shop-by-type:', Boolean(typeSection));
  console.log('   Title:', typeSection?.settings?.title);
  console.log('   Items count:', typeSection?.items?.length);

  // Test 2: Query diamond-trust-markers
  const trustSection = await HomepageSection.findOne({ pageKey: 'diamond-collection', sectionKey: 'diamond-trust-markers' });
  console.log('2. Found diamond-trust-markers:', Boolean(trustSection));
  console.log('   Title:', trustSection?.settings?.title);
  console.log('   Markers count:', trustSection?.items?.length);

  // Test 3: Query diamond-bespoke-consultation
  const consultSection = await HomepageSection.findOne({ pageKey: 'diamond-collection', sectionKey: 'diamond-bespoke-consultation' });
  console.log('3. Found diamond-bespoke-consultation:', Boolean(consultSection));
  console.log('   WhatsApp Number:', consultSection?.settings?.whatsappNumber);

  // Test 4: Verify Gold and Silver collections remain intact
  const goldCount = await HomepageSection.countDocuments({ pageKey: 'gold-collection' });
  const homeCount = await HomepageSection.countDocuments({ pageKey: 'home' });
  console.log(`4. Integrity check: Gold collection sections count = ${goldCount}, Home sections count = ${homeCount}`);

  // Test 5: Verify real diamond products in MongoDB
  const Product = require(backendDir + '/src/models/Product');
  const diamondProducts = await Product.find({
    status: 'Active',
    $or: [
      { material: /diamond/i },
      { diamondType: { $in: ['natural', 'lab_grown'] } },
      { 'variants.diamondType': { $in: ['natural', 'lab_grown'] } }
    ]
  }).select('name material diamondType variants.price variants.diamondType');
  console.log(`5. Real diamond products found in catalogue: ${diamondProducts.length}`);
  diamondProducts.slice(0, 5).forEach(p => console.log(`   - ${p.name} | Material: ${p.material} | Type: ${p.diamondType || 'standard'}`));

  await mongoose.disconnect();
  console.log('Test completed successfully');
}

test();
