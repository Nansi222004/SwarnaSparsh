require("dotenv").config({
  path: require("path").join(__dirname, "..", ".env"),
});

const mongoose = require("mongoose");
const Page = require("../src/models/Page");

const sellerPrivacyContent = `
<h2>Merchant Privacy Policy</h2>
<p>Last updated: June 17, 2026</p>
<p>Sands Jewels ("we", "us", or "our") operates the Sands Jewels Merchant platform. We are committed to protecting the privacy of our sellers and merchants. This Privacy Policy describes how we collect, use, and share information about you when you register and use our seller services.</p>

<h3>1. Information We Collect</h3>
<p>When you register as a merchant on our platform, we collect information necessary to establish and manage your business profile, process commissions, and handle payouts:</p>
<ul>
  <li><strong>Business Profile Information:</strong> Name, phone number, email address, store address, GSTIN, PAN, and identity verification documents.</li>
  <li><strong>Financial Information:</strong> Bank account number, IFSC code, and other details required to process commission payments and payouts.</li>
  <li><strong>Inventory & Transaction Data:</strong> Information about the products you list, stock levels, orders, sales history, and customer interactions on our platform.</li>
</ul>

<h3>2. How We Use Your Information</h3>
<p>We use the collected information for the following business purposes:</p>
<ul>
  <li>To verify your merchant account and approve your store profile.</li>
  <li>To manage your inventory, pricing, and process orders.</li>
  <li>To calculate commissions, track sales analytics, and transfer payouts to your bank account.</li>
  <li>To communicate important updates, policy changes, and security alerts.</li>
</ul>

<h3>3. Data Sharing and Disclosure</h3>
<p>We do not sell your personal or business data. We may share your information only in the following circumstances:</p>
<ul>
  <li><strong>With Service Providers:</strong> Third-party partners who provide services such as hosting, database management, SMS notifications, and payment processing.</li>
  <li><strong>Legal Compliance:</strong> To comply with applicable laws, tax regulations (GST/income tax reporting), or legal processes.</li>
</ul>

<h3>4. Data Security</h3>
<p>We implement industry-standard technical and organizational security measures to protect your account credentials, business details, and financial transactions from unauthorized access, loss, or alteration.</p>

<h3>5. Your Rights and Access</h3>
<p>You can update your profile, contact information, and banking details directly through the Seller Dashboard profile settings. For account deletion requests or further queries, contact merchant support.</p>

<h3>6. Contact Us</h3>
<p>If you have any questions about this Merchant Privacy Policy, please contact our merchant support team at <strong>support@swarnasparsh.com</strong> or call us at <strong>+919921128662</strong>.</p>
`;

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");

    const slug = "seller-privacy-policy";
    const existingPage = await Page.findOne({ slug });

    if (existingPage) {
      console.log("Seller Privacy Policy already exists. Updating content...");
      existingPage.content = sellerPrivacyContent;
      existingPage.title = "Seller Privacy Policy";
      await existingPage.save();
      console.log("Seller Privacy Policy updated successfully.");
    } else {
      console.log("Creating Seller Privacy Policy...");
      await Page.create({
        title: "Seller Privacy Policy",
        slug,
        content: sellerPrivacyContent,
      });
      console.log("Seller Privacy Policy seeded successfully.");
    }
  } catch (err) {
    console.error("Seeding failed:", err.message);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
};

seed();
