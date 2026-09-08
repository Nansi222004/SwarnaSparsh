const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const connectDB = require("../config/db");
const Category = require("../models/Category");
const Subcategory = require("../models/Subcategory");
const slugify = require("../utils/slugify");

// Load env vars
dotenv.config({ path: path.join(__dirname, "../../.env") });

const categoriesData = [
    {
        name: "Rings",
        subcategories: ["Solitaire", "Engagement", "Silver Bands", "Gemstone"]
    },
    {
        name: "Earrings",
        subcategories: ["Jhumkas", "Hoops", "Drops"]
    },
    {
        name: "Chain Pendant",
        subcategories: ["Minimal", "Layered"]
    },
    {
        name: "Bracelets",
        subcategories: ["Cuffs", "Charms", "Bangles"]
    },
    {
        name: "Anklets",
        subcategories: ["Silver", "Beaded"]
    },
    {
        name: "Toe Rings", 
        subcategories: ["Plain", "Stone"]
    },
    {
        name: "Studs",
        subcategories: ["Silver Studs", "Stone Studs"]
    },
    {
        name: "Pendants",
        subcategories: ["Religious", "Modern"]
    },
    {
        name: "Chains",
        subcategories: ["Thick", "Thin"]
    }
];

const seedData = async () => {
    try {
        await connectDB();

        // Clear existing data
        console.log("Cleaning existing categories and subcategories...");
        await Category.deleteMany({});
        await Subcategory.deleteMany({});

        for (const cat of categoriesData) {
            console.log(`Seeding Category: ${cat.name}`);
            
            const category = await Category.create({
                name: cat.name,
                slug: slugify(cat.name),
                description: `Elegant collection of ${cat.name}`,
                isActive: true,
                showInNavbar: true,
                showInCollection: true
            });

            const subcategoryIds = [];
            for (const subName of cat.subcategories) {
                console.log(`  Seeding Subcategory: ${subName}`);
                const subcategory = await Subcategory.create({
                    name: subName,
                    slug: slugify(subName),
                    parentCategory: category._id,
                    isActive: true
                });
                subcategoryIds.push(subcategory._id);
            }

            // Update category with subcategory references
            category.subcategories = subcategoryIds;
            await category.save();
        }

        console.log("✅ Seeding completed successfully!");
        process.exit();
    } catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    }
};

seedData();
