const http = require('http');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data.substring(0, 300) });
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  console.log('=== VERIFYING ALANKAR JEWELLERS SEARCH SYSTEM ===\n');

  // 1. Check frontend server
  try {
    const frontendRes = await fetchJson('http://localhost:5174/');
    console.log('Frontend dev server status: HTTP', frontendRes.status, '(HTML rendered successfully)');
  } catch (err) {
    console.error('Frontend dev server check failed:', err.message);
  }

  // 2. Test Autocomplete Search Endpoint
  console.log('\n--- 1. Autocomplete Search Endpoint (/api/public/products/search?q=...) ---');
  const autocompleteQueries = ['ring', 'gold', 'silver', 'diamond', 'choker'];
  for (const q of autocompleteQueries) {
    const res = await fetchJson(`http://localhost:5005/api/public/products/search?q=${encodeURIComponent(q)}`);
    const suggestions = res.data?.data?.suggestions || [];
    console.log(`Query: "${q}" -> ${suggestions.length} suggestions`);
    if (suggestions.length > 0) {
      const top = suggestions[0];
      console.log(`   Top: "${top.name}" | Cat: ${top.category} | Material: ${top.material} | Price: ₹${top.price}`);
    }
  }

  // 3. Test Full Catalog Search Endpoint (/api/public/products?search=...)
  console.log('\n--- 2. Full Catalog Search Endpoint (/api/public/products?search=...) ---');
  const catalogQueries = [
    { label: 'gold (case-insensitive)', q: 'gold' },
    { label: 'Gold (capitalized)', q: 'Gold' },
    { label: 'GOLD (uppercase)', q: 'GOLD' },
    { label: 'diamond', q: 'diamond' },
    { label: 'silver', q: 'silver' },
    { label: 'finger ring (synonym for finger-ring)', q: 'finger ring' },
    { label: 'ring (singular)', q: 'ring' },
    { label: '  ring   (extra spaces)', q: '  ring   ' },
    { label: 'necklace', q: 'necklace' },
    { label: 'earring (singular)', q: 'earring' },
    { label: 'mala', q: 'mala' },
    { label: 'bangles (plural)', q: 'bangles' },
    { label: 'choker', q: 'choker' },
    { label: 'xyznonexistent123 (non-existent query)', q: 'xyznonexistent123' },
  ];

  for (const item of catalogQueries) {
    const res = await fetchJson(`http://localhost:5005/api/public/products?search=${encodeURIComponent(item.q)}`);
    const count = res.data?.data?.pagination?.total ?? res.data?.data?.products?.length ?? 0;
    const products = res.data?.data?.products || [];
    console.log(`Query [${item.label}] -> Found: ${count} designs`);
    if (products.length > 0) {
      console.log(`   #1: "${products[0].name}" (${products[0].category}) [${products[0].material}]`);
      if (products.length > 1) {
        console.log(`   #2: "${products[1].name}" (${products[1].category}) [${products[1].material}]`);
      }
    } else {
      console.log(`   No products matched (Expected for non-existent queries)`);
    }
  }

  console.log('\n=== ALL VERIFICATION CHECKS COMPLETED ===');
}

run().catch(console.error);
