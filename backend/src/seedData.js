require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Product = require('./models/Product');
const Category = require('./models/Category');

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const catsToCreate = ['Rings', 'Chains', 'Bracelets', 'Earrings', 'Pendants', 'Sets', 'Custom'];
        const catMap = {};

        for (const c of catsToCreate) {
            let cat = await Category.findOne({ name: c });
            if (!cat) {
                cat = await Category.create({ name: c, slug: c.toLowerCase(), showInNavbar: true });
            }
            catMap[c.toLowerCase()] = cat._id;
        }

        const mockProducts = [
            // MEN'S PRODUCTS
            {
                name: "Onyx Statement Signet Ring",
                slug: "onyx-signet-ring-men-" + Math.random(),
                category: "rings",
                images: ["https://images.unsplash.com/photo-1605100804763-247f66156ce4?q=80&w=800"],
                mrp: 6999, price: 4999
            },
            {
                name: "Cuban Link Silver Chain",
                slug: "cuban-link-chain-" + Math.random(),
                category: "chains",
                images: ["https://images.unsplash.com/photo-1599643478524-fb5244098775?q=80&w=800"],
                mrp: 10999, price: 8499
            },
            {
                name: "Minimalist Silver Beaded Bracelet",
                slug: "minimalist-beaded-bracelet-men-" + Math.random(),
                category: "bracelets",
                images: ["https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=800"],
                mrp: 4500, price: 3299
            },
            {
                name: "Matte Black Titanium Ring",
                slug: "matte-black-titanium-ring-" + Math.random(),
                category: "rings",
                images: ["https://images.unsplash.com/photo-1589410185121-6bd79ceba696?q=80&w=800"],
                mrp: 5499, price: 3999
            },
            {
                name: "Classic Anchor Bracelet",
                slug: "classic-anchor-bracelet-" + Math.random(),
                category: "bracelets",
                images: ["https://images.unsplash.com/photo-1611652022419-a9419f74343d?q=80&w=800"],
                mrp: 3199, price: 2499
            },

            // WOMEN'S PRODUCTS
            {
                name: "Elegant Pearl Drop Earrings",
                slug: "elegant-pearl-drop-womens-" + Math.random(),
                category: "earrings",
                images: ["https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=800"],
                mrp: 4999, price: 2999
            },
            {
                name: "Rose Gold Plated Tennis Bracelet",
                slug: "rose-gold-tennis-bracelet-" + Math.random(),
                category: "bracelets",
                images: ["https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=800"], // Reuse placeholder
                mrp: 8999, price: 5499
            },
            {
                name: "Vintage Silver Filigree Ring",
                slug: "vintage-silver-filigree-ring-" + Math.random(),
                category: "rings",
                images: ["https://images.unsplash.com/photo-1605100804763-247f66156ce4?q=80&w=800"],
                mrp: 3500, price: 2199
            },
            {
                name: "Layered Choker Set",
                slug: "layered-choker-set-" + Math.random(),
                category: "sets",
                images: ["https://images.unsplash.com/photo-1599643478524-fb5244098775?q=80&w=800"],
                mrp: 6500, price: 4299
            },
            {
                name: "Celestial Sun Pendant",
                slug: "celestial-sun-pendant-" + Math.random(),
                category: "pendants",
                images: ["https://images.unsplash.com/photo-1611652022419-a9419f74343d?q=80&w=800"],
                mrp: 2999, price: 1899
            }
        ];

        let count = 0;
        for (let p of mockProducts) {
            const catId = catMap[p.category];
            await Product.create({
                name: p.name,
                slug: p.slug,
                description: `A stunning ${p.name} handcrafted for perfection.`,
                categories: catId ? [catId] : [],
                images: p.images,
                active: true,
                status: "Active",
                variants: [{
                    name: "Default Silver",
                    mrp: p.mrp,
                    price: p.price,
                    finalPrice: p.price,
                    stock: 50,
                    sold: Math.floor(Math.random() * 20)
                }],
                tags: {
                    isTrending: Math.random() > 0.5,
                    isNewArrival: Math.random() > 0.5
                }
            });
            count++;
        }

        console.log(`Seeded ${count} items successfully.`);
        process.exit(0);

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedData();
