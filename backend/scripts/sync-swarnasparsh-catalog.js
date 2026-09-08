const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Category = require('../src/models/Category');
const Product = require('../src/models/Product');
const slugify = require('../src/utils/slugify');

function decodeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&#8217;/g, "'")
    .replace(/&#8211;/g, "-")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#038;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

// Map keywords in product name to category slug
function inferCategorySlug(name = '') {
  const upper = name.toUpperCase();
  if (upper.includes('NECKLACE') || upper.includes('CHOKAR') || upper.includes('CHOKER') || upper.includes('RANIHAAR') || upper.includes('MALA') || upper.includes('HAAR')) {
    return 'necklace';
  }
  if (upper.includes('BANGLE') || upper.includes('KADA')) {
    return 'bangles';
  }
  if (upper.includes('BRACELET')) {
    return 'bracelet';
  }
  if (upper.includes('EARRING') || upper.includes('TOPS') || upper.includes('JHUMKA')) {
    return 'earrings';
  }
  if (upper.includes('RING') && !upper.includes('EARRING')) {
    return 'finger-ring';
  }
  if (upper.includes('MANGALSUTRA')) {
    return 'mangalsutra';
  }
  if (upper.includes('CHAIN') || upper.includes('PENDENT') || upper.includes('PENDANT')) {
    return 'chain-pendent';
  }
  if (upper.includes('BAG') || upper.includes('POTLI') || upper.includes('CLUTCH') || upper.includes('SLING')) {
    return 'hand-bags';
  }
  if (upper.includes('TIKA') || upper.includes('TEENKA')) {
    return 'mang-tika';
  }
  if (upper.includes('BAJUBANDH') || upper.includes('BAJU')) {
    return 'other-jewelley';
  }
  return 'other-jewelley';
}

function detectAudience(name = '', categorySlug = '') {
  const text = `${name} ${categorySlug}`.toLowerCase();
  if (text.includes("men's") || text.includes('mens') || text.includes('for him') || text.includes('men-')) {
    return ['men'];
  }
  if (text.includes('women') || text.includes('bridal') || text.includes('mangalsutra') || text.includes('hand-bags') || text.includes('potli') || text.includes('clutch') || text.includes('chokar') || text.includes('ranihaar')) {
    return ['women'];
  }
  return ['unisex'];
}

async function syncSwarnaSparshCatalog() {
  if (mongoose.connection.readyState !== 1) {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI is not configured in backend/.env');
    }
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB successfully.');
  }

  // 1. Fetch Categories from swarnasparsh.com
  console.log('\n--- Step 1: Fetching Categories from swarnasparsh.com ---');
  const catRes = await fetch('https://swarnasparsh.com/wp-json/wc/store/v1/products/categories?per_page=100');
  if (!catRes.ok) {
    throw new Error(`Failed to fetch categories: ${catRes.status} ${catRes.statusText}`);
  }
  const rawCategories = await catRes.json();
  console.log(`Fetched ${rawCategories.length} categories from API.`);

  const categoryMapBySlug = new Map();
  const categoryMapById = new Map();

  let catSortOrder = 1;
  for (const rawCat of rawCategories) {
    const rawCleanName = decodeHtml(rawCat.name);
    const cleanSlug = slugify(rawCat.slug || rawCleanName);
    const imgUrl = rawCat.image?.src || null;

    // Filter out generic "products" parent category if not desired, or keep as active
    const isSpecialCategory = cleanSlug === 'products';

    // Handle identical category names (e.g. child "Necklace" under parent "Necklace")
    let finalName = rawCleanName;
    const existingNameDoc = await Category.findOne({ name: finalName });
    if (existingNameDoc && existingNameDoc.slug !== cleanSlug) {
      finalName = `${rawCleanName} (${cleanSlug.split('-').pop().toUpperCase()})`;
      console.log(`  Disambiguating duplicate name: "${rawCleanName}" -> "${finalName}" for slug "${cleanSlug}"`);
    }

    const categoryDoc = await Category.findOneAndUpdate(
      { slug: cleanSlug },
      {
        $set: {
          name: finalName,
          slug: cleanSlug,
          description: rawCat.description ? decodeHtml(rawCat.description) : `Exclusive collection of ${finalName} from Swarna Sparsh.`,
          image: imgUrl,
          bannerTitle: finalName,
          bannerSubtitle: `Handcrafted ${finalName} with Golden Touch`,
          showInNavbar: !isSpecialCategory,
          showInCollection: true,
          isActive: true,
          sortOrder: catSortOrder++
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    categoryMapBySlug.set(cleanSlug, categoryDoc);
    categoryMapById.set(rawCat.id, categoryDoc);
    console.log(`  ✓ Synced Category: "${finalName}" (${cleanSlug}) [ID: ${categoryDoc._id}]`);
  }

  // 2. Fetch Products from swarnasparsh.com
  console.log('\n--- Step 2: Fetching Products from swarnasparsh.com ---');
  const prodRes = await fetch('https://swarnasparsh.com/wp-json/wc/store/v1/products?per_page=100');
  if (!prodRes.ok) {
    throw new Error(`Failed to fetch products: ${prodRes.status} ${prodRes.statusText}`);
  }
  const rawProducts = await prodRes.json();
  console.log(`Fetched ${rawProducts.length} products from API.`);

  let syncedProductsCount = 0;

  for (const rawProd of rawProducts) {
    const cleanName = decodeHtml(rawProd.name);
    const cleanSlug = slugify(rawProd.slug || cleanName);
    const productCode = `SP-${rawProd.id}`;
    const sku = `SKU-SP-${rawProd.id}`;

    // Resolve Category
    let matchedCatDoc = null;

    if (Array.isArray(rawProd.categories) && rawProd.categories.length > 0) {
      for (const catRef of rawProd.categories) {
        if (catRef.slug !== 'products') {
          matchedCatDoc = categoryMapBySlug.get(slugify(catRef.slug)) || categoryMapById.get(catRef.id);
          if (matchedCatDoc) break;
        }
      }
    }

    if (!matchedCatDoc) {
      const inferredSlug = inferCategorySlug(cleanName);
      matchedCatDoc = categoryMapBySlug.get(inferredSlug) || Array.from(categoryMapBySlug.values())[0];
    }

    const price = Math.round(Number(rawProd.prices?.price || 0) / 100);
    const rawMrp = Math.round(Number(rawProd.prices?.regular_price || rawProd.prices?.price || 0) / 100);
    const mrp = rawMrp >= price ? rawMrp : Math.round(price * 1.35);
    const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

    const images = (rawProd.images || []).map((img) => img.src).filter(Boolean);
    const description = rawProd.description ? decodeHtml(rawProd.description) : `<p>${cleanName} by Swarna Sparsh.</p>`;
    const audience = detectAudience(cleanName, matchedCatDoc?.slug || '');

    // Extract material or fallback
    let material = 'Gold Plated Alloy';
    if (description.toLowerCase().includes('antique')) material = 'Antique Finish Alloy';
    else if (description.toLowerCase().includes('kundan')) material = 'Kundan & Pearls';
    else if (description.toLowerCase().includes('silver')) material = 'Silver Plated';

    const stock = 50;
    const serialCodes = Array.from({ length: stock }, (_, i) => ({
      code: `SP-${rawProd.id}-${String(i + 1).padStart(3, '0')}`,
      status: 'AVAILABLE'
    }));

    const variants = [
      {
        name: 'Standard',
        size: 'Free Size',
        variantCode: `SP-${rawProd.id}-V1`,
        mrp: mrp,
        price: price,
        finalPrice: price,
        discount: discount,
        stock: stock,
        sold: 0,
        weight: 15,
        weightUnit: 'Grams',
        variantImages: images,
        serialCodes: serialCodes
      }
    ];

    const productPayload = {
      name: cleanName,
      slug: cleanSlug,
      productCode: productCode,
      sku: sku,
      brand: 'Swarna Sparsh',
      category: matchedCatDoc ? matchedCatDoc.name : 'Jewellery',
      categorySlug: matchedCatDoc ? matchedCatDoc.slug : 'jewellery',
      categoryId: matchedCatDoc ? matchedCatDoc._id : null,
      categories: matchedCatDoc ? [matchedCatDoc._id] : [],
      navShopByCategory: matchedCatDoc ? [matchedCatDoc._id] : [],
      description: description,
      material: material,
      audience: audience,
      images: images,
      variants: variants,
      tags: {
        isNewArrival: true,
        isTrending: true,
        isMostGifted: false,
        isNewLaunch: true,
        isPremium: true
      },
      rating: 4.8,
      reviewCount: Math.floor(Math.random() * 20) + 5,
      status: 'Active',
      active: true,
      showInNavbar: true,
      showInCollection: true,
      isSerialized: true
    };

    await Product.findOneAndUpdate(
      { $or: [{ productCode: productCode }, { slug: cleanSlug }] },
      { $set: productPayload },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    syncedProductsCount++;
    console.log(`  ✓ Synced Product [${syncedProductsCount}/${rawProducts.length}]: "${cleanName}" -> ₹${price} (MRP: ₹${mrp}, ${discount}% off) [Cat: ${productPayload.category}]`);
  }

  console.log('\n========================================');
  console.log(`✅ SYNC COMPLETE!`);
  console.log(`   Categories Synced: ${categoryMapBySlug.size}`);
  console.log(`   Products Synced:   ${syncedProductsCount}`);
  console.log('========================================\n');

  return {
    categoriesCount: categoryMapBySlug.size,
    productsCount: syncedProductsCount
  };
}

if (require.main === module) {
  syncSwarnaSparshCatalog()
    .then(() => {
      console.log('Done.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Sync failed:', err);
      process.exit(1);
    });
}

module.exports = { syncSwarnaSparshCatalog };
