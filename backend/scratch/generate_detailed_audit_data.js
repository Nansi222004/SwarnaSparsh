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

const queries = [
  'gold',
  'silver',
  'diamond',
  'finger ring',
  'ring',
  'rings',
  'necklace',
  'bangles',
  'earrings',
  'choker',
  'mala',
  'xyznonexistent123'
];

async function generateAudit() {
  console.log('=== DETAILED AUDIT DATA GENERATION ===\n');

  for (const q of queries) {
    const fullRes = await get(`/api/public/products?search=${encodeURIComponent(q)}&limit=50`);
    const autoRes = await get(`/api/public/products/search?q=${encodeURIComponent(q)}`);

    const products = fullRes.data?.products || [];
    const total = fullRes.data?.pagination?.total || products.length;
    const suggestions = autoRes.data?.suggestions || [];

    const names = products.map(p => p.name);
    console.log(`QUERY: "${q}"`);
    console.log(`API Total: ${total}`);
    console.log(`Autocomplete Suggestions Count: ${suggestions.length}`);
    console.log(`Product Names (${names.length}):`);
    names.forEach((name, idx) => {
      console.log(`   ${idx + 1}. ${name} [${products[idx].category}] (${products[idx].material})`);
    });
    console.log('--------------------------------------------------\n');
  }
}

generateAudit().catch(console.error);
