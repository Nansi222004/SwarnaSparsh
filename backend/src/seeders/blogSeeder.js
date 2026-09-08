const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Blog = require("../models/Blog");
const slugify = require("../utils/slugify");

dotenv.config();

const mockBlogs = [
    {
        title: 'The Art of Layering Silver Necklaces',
        category: 'Style Guide',
        coverImage: 'https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?auto=format&fit=crop&q=80&w=600',
        excerpt: 'Discover how to create the perfect layered look with our guide to mixing and matching silver chains and pendants.',
        content: 'Layering necklaces is more than just a trend; it is an art form that allows you to express your individual style and personality. Start with a simple base chain, like a delicate snake or box chain, sitting close to the neck. Add a pendant necklace of medium length to create a focal point. Finally, finish with a longer chain or a lariat to elongate the torso. Mixing textures and weights can add depth, while sticking to a single metal keeps the look cohesive. Do not be afraid to mix vintage pieces with modern designs for a truly unique statement.',
        author: 'Swarna Sparsh Editorial',
        isPublished: true
    },
    {
        title: 'Caring for Your Sterling Silver',
        category: 'Care Tips',
        coverImage: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&q=80&w=600',
        excerpt: 'Learn the essential tips and tricks to keep your 925 Sterling Silver jewellery shining bright for years to come.',
        content: 'Sterling silver is a beautiful and durable metal, but it does require some care to maintain its luster. Tarnish is a natural reaction to sulfur in the air, but it can be easily managed. Store your silver in a cool, dry place, preferably in tarnish-preventive bags. Avoid exposing your jewellery to household chemicals, engaging in water sports, or sunbathing while wearing it. For cleaning, use a soft polishing cloth specifically designed for silver. If your pieces are heavily tarnished, a gentle wash with mild soap and warm water can help, but always dry them thoroughly immediately after.',
        author: 'Care Team',
        isPublished: true
    },
    {
        title: 'Understanding Hallmarks: What is 925?',
        category: 'Education',
        coverImage: 'https://images.unsplash.com/photo-1576014131795-d4c5c91f94d9?auto=format&fit=crop&q=80&w=600',
        excerpt: 'Dive deep into the world of silver purity. We explain what the 925 hallmark means, why it matters, and how to verify authenticity.',
        content: 'If you have ever looked closely at a piece of silver jewellery, you might have seen the number "925" stamped on it. This is the hallmark for Sterling Silver. Pure silver (999) is too soft for everyday wear, so it is alloyed with other metals to increase its strength. The "925" indicates that the piece is 92.5% pure silver and 7.5% other metals, usually copper. This alloy provides the perfect balance of luster and durability. Always check for this hallmark to ensure you are buying authentic, high-quality silver that will stand the test of time.',
        author: 'Silver Expert',
        isPublished: true
    },
    {
        title: 'Top 5 Trends for Spring 2024',
        category: 'Trends',
        coverImage: 'https://images.unsplash.com/photo-1630019852942-e5b121fb1154?auto=format&fit=crop&q=80&w=600',
        excerpt: 'Get ahead of the curve with our rundown of the must-have silver jewellery trends for the upcoming spring season.',
        content: 'Spring 2024 is all about nature-inspired designs and bold statements. Floral motifs are making a huge comeback, with intricate flower pendants and leaf-patterned bracelets taking center stage. Minimalist geometric shapes are also trending for those who prefer a sleeker look. Chunky silver hoops are a versatile staple that pairs well with any outfit. Another rising trend is personalized jewellery, from initial necklaces to engraved signet rings. Finally, mixed metal stacking rings offer a playful way to add variety to your daily look.',
        author: 'Fashion Desk',
        isPublished: true
    }
];

const seedBlogs = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for seeding...");

        // Clear existing blogs (optional, but good for clean seed)
        await Blog.deleteMany({});
        console.log("Old blogs cleared.");

        const blogsWithSlugs = mockBlogs.map(blog => ({
            ...blog,
            slug: slugify(blog.title),
            publishedAt: new Date()
        }));

        await Blog.insertMany(blogsWithSlugs);
        console.log("Mock blogs seeded successfully!");

        process.exit(0);
    } catch (err) {
        console.error("Seeding failed:", err);
        process.exit(1);
    }
};

seedBlogs();
