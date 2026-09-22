const http = require('http');

function get(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:5005${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ error: e.message, raw: data.substring(0, 200) });
        }
      });
    }).on('error', reject);
  });
}

async function runRegressionTests() {
  console.log('=== REGRESSION & FILTER AUDIT ===\n');

  // Test 1: General Catalogue (All Jewellery - no search)
  const allProds = await get('/api/public/products?limit=100');
  const allList = allProds.data?.products || [];
  console.log(`1. All Jewellery (General Catalogue): ${allList.length} products returned from backend`);

  // Test 2: Malas in General Catalogue vs Explicit Mala
  const malasInGeneral = allList.filter(p => (p.categorySlug === 'malas' || p.category === 'Malas'));
  console.log(`   Malas in general catalogue (raw backend): ${malasInGeneral.length}`);
  const explicitMala = await get('/api/public/products?search=mala');
  console.log(`2. Explicit Mala Search (/api/public/products?search=mala): ${explicitMala.data?.pagination?.total || explicitMala.data?.products?.length} designs found`);

  // Test 3: Existing Category Filter (finger-ring)
  const ringCat = await get('/api/public/products?category=finger-ring');
  console.log(`3. Category Filter (?category=finger-ring): ${ringCat.data?.pagination?.total || ringCat.data?.products?.length} products`);

  // Test 4: Autocomplete vs Full Search Consistency
  console.log('\n--- Autocomplete vs Full Search Consistency ---');
  const checkQueries = ['ring', 'finger ring', 'gold', 'silver', 'diamond', 'bangles', 'necklace'];
  for (const q of checkQueries) {
    const autoRes = await get(`/api/public/products/search?q=${encodeURIComponent(q)}`);
    const fullRes = await get(`/api/public/products?search=${encodeURIComponent(q)}`);
    const autoList = autoRes.data?.suggestions || [];
    const fullTotal = fullRes.data?.pagination?.total || fullRes.data?.products?.length || 0;
    const fullList = fullRes.data?.products || [];
    
    console.log(`Query "${q}":`);
    console.log(`   Autocomplete: ${autoList.length} suggestions (Top: "${autoList[0]?.name || 'none'}")`);
    console.log(`   Full Search:  ${fullTotal} designs (Top: "${fullList[0]?.name || 'none'}")`);
    
    // Check consistency: Top autocomplete item should be present in full search results
    if (autoList.length > 0 && fullList.length > 0) {
      const topAutoId = String(autoList[0]._id || autoList[0].id);
      const existsInFull = fullList.some(p => String(p._id || p.id) === topAutoId);
      console.log(`   Consistency check: Top autocomplete item exists in full search results: ${existsInFull ? 'YES (PASS)' : 'NO'}`);
    }
  }

  // Test 5: Sorting alongside search
  console.log('\n--- Sorting with Search ---');
  const searchSortHigh = await get('/api/public/products?search=gold&sort=priceHtoL');
  const searchSortLow = await get('/api/public/products?search=gold&sort=priceLtoH');
  console.log(`Search 'gold' with sort=priceHtoL: ${searchSortHigh.data?.pagination?.total} designs`);
  console.log(`Search 'gold' with sort=priceLtoH: ${searchSortLow.data?.pagination?.total} designs`);

  console.log('\n=== REGRESSION TESTS FINISHED ===');
}

runRegressionTests().catch(console.error);
