/**
 * Drop Empty Blog Collection
 * 
 * Safety guards:
 * 1. Requires explicit `--confirm` CLI flag
 * 2. Checks document count: MUST be exactly 0
 * 3. Verifies archive exists and passes SHA-256
 * 4. Captures core collections count before and after
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const dns = require('node:dns');

dns.setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function dropBlogCollection() {
  console.log('=== STARTING DROP BLOG COLLECTION ===');

  const args = process.argv.slice(2);
  if (!args.includes('--confirm')) {
    console.error('ERROR: Safety check aborted. You must pass --confirm to drop the blog collection.');
    process.exit(1);
  }

  // Verify archive exists and is intact
  const archiveDir = path.join(__dirname, '../archive');
  const jsonPath = path.join(archiveDir, 'blogs-pre-retirement.json');
  const hashPath = path.join(archiveDir, 'blogs-pre-retirement.sha256');

  if (!fs.existsSync(jsonPath) || !fs.existsSync(hashPath)) {
    console.error('ERROR: Pre-retirement archive or checksum missing. Cannot drop collection.');
    process.exit(1);
  }

  const rawJson = fs.readFileSync(jsonPath, 'utf8');
  const expectedHash = fs.readFileSync(hashPath, 'utf8').trim().split(/\s+/)[0];
  const actualHash = crypto.createHash('sha256').update(rawJson).digest('hex');
  if (expectedHash !== actualHash) {
    console.error('ERROR: Archive SHA-256 mismatch. Refusing to drop collection.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI, { family: 4 });
  console.log('Connected to MongoDB.');

  const db = mongoose.connection.db;
  const collections = await db.listCollections({ name: 'blogs' }).toArray();
  if (collections.length === 0) {
    console.log("Collection 'blogs' already does not exist.");
    await mongoose.disconnect();
    return;
  }

  // Pre-drop census of core collections
  const monitored = ['users', 'products', 'orders', 'categories', 'settings', 'notifications', 'reviews'];
  const beforeCounts = {};
  for (const col of monitored) {
    try {
      beforeCounts[col] = await db.collection(col).countDocuments();
    } catch {
      beforeCounts[col] = 'N/A';
    }
  }

  const blogDocCount = await db.collection('blogs').countDocuments();
  console.log(`Current 'blogs' count: ${blogDocCount}`);

  if (blogDocCount > 0) {
    console.error(`ABORTING: Collection 'blogs' contains ${blogDocCount} documents (> 0)! Refusing to drop.`);
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log("Dropping empty 'blogs' collection...");
  await db.collection('blogs').drop();
  console.log("Collection 'blogs' successfully dropped.");

  // Post-drop verification
  const afterCollections = await db.listCollections({ name: 'blogs' }).toArray();
  if (afterCollections.length > 0) {
    console.error("ERROR: Collection 'blogs' still exists after drop!");
    process.exit(1);
  }

  const afterCounts = {};
  for (const col of monitored) {
    try {
      afterCounts[col] = await db.collection(col).countDocuments();
    } catch {
      afterCounts[col] = 'N/A';
    }
  }

  console.log('--- COLLECTION INTEGRITY CHECK ---');
  let integrityPassed = true;
  for (const col of monitored) {
    console.log(`${col}: Before = ${beforeCounts[col]}, After = ${afterCounts[col]}`);
    if (beforeCounts[col] !== afterCounts[col]) {
      integrityPassed = false;
      console.error(`INTEGRITY ERROR: Document count mismatch for ${col}!`);
    }
  }

  if (!integrityPassed) {
    console.error('FATAL: Core collection document count changed unexpectedly!');
    process.exit(1);
  }

  console.log('✅ Collection drop and integrity verification PASSED.');
  await mongoose.disconnect();
  console.log('=== DROP BLOG COLLECTION COMPLETE ===');
}

dropBlogCollection().catch((err) => {
  console.error('Drop operation failed:', err);
  process.exit(1);
});
