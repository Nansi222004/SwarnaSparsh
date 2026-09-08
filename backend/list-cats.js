require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('./src/models/Category');

async function listCategories() {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }
    await mongoose.connect(mongoUri);
    const categories = await Category.find({ metal: { $in: ['silver', 'gold', 'Silver', 'Gold'] } });
    console.log(JSON.stringify(categories, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

listCategories();
