const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const Product = require('./src/models/Product');
const Category = require('./src/models/Category');

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/sands";

async function check() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const products = await Product.find({}).populate('categories');
        console.log(`Found ${products.length} products total.`);

        products.forEach(p => {
             console.log(`Product: ${p.name}, Slug: ${p.slug}, Status: ${p.status}, Active: ${p.active}`);
             console.log(`Categories: ${p.categories.map(c => c.slug).join(', ')}`);
        });

        const categories = await Category.find({});
        console.log(`\nFound ${categories.length} categories total.`);
        categories.forEach(c => {
            console.log(`Category: ${c.name}, Slug: ${c.slug}, Metal: ${c.metal}, Active: ${c.isActive}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Check failed:', error);
        process.exit(1);
    }
}

check();
