/**
 * Create Pre-Retirement Archive for Blogs Feature
 * 
 * Safely captures:
 * 1. Collection name & metadata
 * 2. Document count (expected: 0)
 * 3. Documents (if any)
 * 4. Database indexes
 * 5. Mongoose schema source code & parsed paths
 * 6. Timestamp & SHA-256 integrity hash
 * 
 * NOTE: DOES NOT DROP ANY COLLECTION.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const dns = require('node:dns');

dns.setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Blog = require('../src/models/Blog');

async function createArchive() {
  console.log('=== STARTING BLOG PRE-RETIREMENT ARCHIVAL ===');
  
  if (!process.env.MONGO_URI) {
    console.error('ERROR: MONGO_URI not defined in .env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI, { family: 4 });
  console.log('Connected to MongoDB.');

  const db = mongoose.connection.db;
  const collections = await db.listCollections({ name: 'blogs' }).toArray();
  const collectionExists = collections.length > 0;

  let docCount = 0;
  let documents = [];
  let indexes = [];
  let collectionOptions = null;

  if (collectionExists) {
    docCount = await db.collection('blogs').countDocuments();
    documents = await db.collection('blogs').find({}).toArray();
    indexes = await db.collection('blogs').indexes();
    collectionOptions = collections[0].options || {};
    console.log(`Collection 'blogs' found: ${docCount} documents.`);
  } else {
    console.log("Collection 'blogs' does not exist in database.");
  }

  // Read Blog Mongoose model schema
  const modelPath = path.join(__dirname, '../src/models/Blog.js');
  let modelSource = '';
  if (fs.existsSync(modelPath)) {
    modelSource = fs.readFileSync(modelPath, 'utf8');
  }

  const schemaPaths = {};
  Blog.schema.eachPath((pathname, schematype) => {
    schemaPaths[pathname] = {
      instance: schematype.instance,
      isRequired: Boolean(schematype.isRequired),
      defaultValue: schematype.defaultValue,
      options: schematype.options
    };
  });

  const archiveData = {
    metadata: {
      archiveName: 'blogs-pre-retirement',
      feature: 'Swarna Sparsh Blog Feature',
      purpose: 'Complete Blog Feature Retirement Archive',
      createdAt: new Date().toISOString(),
      collectionName: 'blogs',
      collectionExists,
      collectionOptions,
      documentCount: docCount,
      indexCount: indexes.length
    },
    schema: {
      modelName: 'Blog',
      modelFilePath: 'backend/src/models/Blog.js',
      schemaSource: modelSource,
      schemaPaths: schemaPaths,
      schemaOptions: Blog.schema.options
    },
    indexes: indexes,
    documents: documents
  };

  const archiveDir = path.join(__dirname, '../archive');
  if (!fs.existsSync(archiveDir)) {
    fs.mkdirSync(archiveDir, { recursive: true });
  }

  const jsonContent = JSON.stringify(archiveData, null, 2);
  const archivePath = path.join(archiveDir, 'blogs-pre-retirement.json');
  fs.writeFileSync(archivePath, jsonContent, 'utf8');
  console.log(`Archive written to: ${archivePath} (${Buffer.byteLength(jsonContent)} bytes)`);

  // Compute SHA-256 hash
  const hash = crypto.createHash('sha256').update(jsonContent).digest('hex');
  const hashPath = path.join(archiveDir, 'blogs-pre-retirement.sha256');
  fs.writeFileSync(hashPath, `${hash}  blogs-pre-retirement.json\n`, 'utf8');
  console.log(`SHA-256 Checksum: ${hash}`);
  console.log(`Checksum written to: ${hashPath}`);

  await mongoose.disconnect();
  console.log('MongoDB disconnected.');
  console.log('=== BLOG PRE-RETIREMENT ARCHIVAL COMPLETE ===');
}

createArchive().catch((err) => {
  console.error('Archival failed:', err);
  process.exit(1);
});
