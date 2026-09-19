require("dotenv").config({
  path: require("path").join(__dirname, "..", ".env"),
});

const mongoose = require("mongoose");
const Page = require("../src/models/Page");
const { defaultPages: defaultPagesMap } = require("../src/utils/defaultPages");

const defaultPages = [
  ...Object.values(defaultPagesMap),
  {
    slug: "seller-terms-conditions",
    title: "Seller Terms & Conditions",
    content: `
      <h2>Merchant Partnership Agreement</h2>
      <p>These terms govern the relationship between Alankar Jewellers and authorized sellers, artisans, and merchants listing fine jewellery on the Alankar Jewellers platform.</p>

      <h3>1. Quality Standards & Hallmarking</h3>
      <p>Merchants must guarantee that all silver jewellery listed conforms to certified 925 Sterling Silver standards, and gold products meet declared BIS hallmarking standards.</p>

      <h3>2. Order Fulfillment & Dispatch</h3>
      <p>Sellers are obligated to safely pack and dispatch customer orders within 24 to 48 hours of order receipt using certified secure shipping materials.</p>

      <h3>3. Payouts & Commission</h3>
      <p>Commissions are deducted as per agreed category tier schedules, and seller net proceeds are transferred directly via automated NEFT/IMPS bank transfer following the 7-day customer return window.</p>
    `
  },
  {
    slug: "seller-privacy-policy",
    title: "Seller Privacy Policy",
    content: `
      <h2>Merchant Privacy Policy</h2>
      <p>Alankar Jewellers is dedicated to safeguarding the privacy, financial records, and proprietary catalog data of all merchant partners. We do not share your confidential business metrics or personal KYC documents with unauthorized third parties.</p>
    `
  }
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for CMS pages seeding.");

    for (const p of defaultPages) {
      const existing = await Page.findOne({ slug: p.slug });
      if (existing) {
        existing.title = p.title;
        existing.content = p.content;
        existing.lastUpdated = new Date();
        await existing.save();
        console.log(`Updated page: ${p.slug} (${p.title})`);
      } else {
        await Page.create({
          slug: p.slug,
          title: p.title,
          content: p.content,
          lastUpdated: new Date()
        });
        console.log(`Created page: ${p.slug} (${p.title})`);
      }
    }

    const count = await Page.countDocuments();
    console.log(`Total CMS pages in database: ${count}`);
    process.exit(0);
  } catch (err) {
    console.error("Error seeding CMS pages:", err);
    process.exit(1);
  }
};

seed();
