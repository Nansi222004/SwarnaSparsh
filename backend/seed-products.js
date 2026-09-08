const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const Product = require("./src/models/Product");
const Category = require("./src/models/Category");

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/sands";

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // Clear existing sample products
    await Product.deleteMany({ slug: { $regex: /^sample-/ } });
    console.log("Cleared existing sample products");

    const categoriesData = [
      { name: "Rings", slug: "rings" },
      { name: "Bracelets", slug: "bracelets" },
      { name: "Pendants", slug: "necklaces" },
      { name: "Earrings", slug: "earrings" },
      { name: "Men", slug: "men" },
      { name: "Sets", slug: "sets" },
      { name: "Anklets", slug: "anklets" },
      { name: "Chains", slug: "chains" },
      { name: "Mangalsutras", slug: "mangalsutras" },
      { name: "Nose Pins", slug: "nose-pins" },
      { name: "Personalised", slug: "personalised" },
      { name: "Bangles", slug: "bangle" },
      { name: "Toe Rings", slug: "toe-rings" },
      { name: "New Launch", slug: "new-launch" },
    ];

    for (const catData of categoriesData) {
      let category = await Category.findOne({ slug: catData.slug });
      if (!category) {
        category = await Category.create({
          ...catData,
          showInNavbar: true,
          showInCollection: true,
          isActive: true,
          metal: "silver",
        });
        console.log(`Created category: ${catData.name}`);
      }

      const productSlug = `sample-${catData.slug}-product`;
      let product = await Product.findOne({ slug: productSlug });

      if (!product) {
        product = await Product.create({
          name: `Elegant Silver ${catData.name}`,
          slug: productSlug,
          description: `A beautiful piece of silver ${catData.name} from Sands Jewels.`,
          categories: [category._id],
          category: category.name,
          categorySlug: category.slug,
          categoryId: category._id,
          navShopByCategory: [category._id],
          tags: {
            isNewArrival: true,
            isTrending: true,
          },
          material: "Silver",
          metal: "silver",
          status: "Active",
          active: true,
          silverCategory: "925",
          images: [
            `https://placehold.co/600x600/fce7e8/9C5B61?text=${catData.name}`,
          ],
          variants: [
            {
              name: "Default",
              mrp: 2999,
              price: 1499,
              stock: 50,
              weight: 2.5,
              finalPrice: 1499,
            },
          ],
        });
        console.log(`Created product for category: ${catData.name}`);
      }
    }

    console.log("Seeding completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

seed();
