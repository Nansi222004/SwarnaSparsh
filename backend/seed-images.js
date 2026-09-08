const mongoose = require('mongoose');
require('dotenv').config(); // Load environment variables
const cloudinary = require('./src/config/cloudinary');
const Category = require('./src/models/Category');
const path = require('path');
const fs = require('fs');

const ASSET_PATH = path.join(__dirname, '../frontend/src/modules/user/assets');

const mapping = {
  "Rings": "cat_rings.png",
  "Earrings": "cat_earrings.png",
  "Chain Pendant": "cat_pendant.png",
  "Bracelets": "cat_bracelets.png",
  "Anklets": "cat_anklets.png",
  "Toe Rings": "cat_anklets.png",
  "Studs": "new_launch_studs.png",
  "Pendants": "cat_pendant_wine.png",
  "Chains": "new_launch_chains.png"
};

async function seedImages() {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    const categories = await Category.find({ name: { $in: Object.keys(mapping) } });
    console.log(`Found ${categories.length} categories to update.`);

    for (const cat of categories) {
      const fileName = mapping[cat.name];
      const filePath = path.join(ASSET_PATH, fileName);

      if (fs.existsSync(filePath)) {
        console.log(`Uploading ${fileName} for category ${cat.name}...`);
        const result = await cloudinary.uploader.upload(filePath, {
          folder: 'sands-ornaments/categories',
          use_filename: true,
          unique_filename: false
        });

        cat.image = result.secure_url;
        await cat.save();
        console.log(`✅ Updated ${cat.name} with ${result.secure_url}`);
      } else {
        console.warn(`❌ Asset not found: ${filePath}`);
      }
    }

    console.log("Image seeding completed.");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

seedImages();
