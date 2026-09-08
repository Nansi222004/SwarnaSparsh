const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Joi = require('joi');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const { addressSchema } = require('../src/modules/user/validators/address.validator');
const Address = require('../src/models/Address');
const User = require('../src/models/User');

async function test() {
    try {
        console.log("Connecting to MongoDB:", process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected successfully!");

        // 1. Find a user
        const user = await User.findOne({});
        if (!user) {
            console.error("No user found in DB to test with!");
            process.exit(1);
        }
        console.log(`Found user: Name="${user.name}", ID="${user._id}"`);

        // 2. Sample address payload matching what frontend sends
        const sampleAddress = {
            name: "Aditi Sharma",
            phone: "9876543210",
            flatNo: "Flat 4B, Rose Apartments",
            area: "Lokhandwala Complex",
            city: "Mumbai",
            district: "", // frontend sends district: ""
            state: "Maharashtra",
            pincode: "400001",
            type: "Home",
            isDefault: false
        };

        console.log("\nTesting Joi Validation...");
        const { error, value } = addressSchema.validate(sampleAddress);
        if (error) {
            console.error("Joi Validation FAILED:", error.details);
        } else {
            console.log("Joi Validation PASSED!", value);
        }

        // 3. Try to save in MongoDB
        console.log("\nTesting MongoDB saving...");
        const addressDoc = new Address({
            ...value,
            userId: user._id
        });
        
        await addressDoc.save();
        console.log("MongoDB Save PASSED! Address ID:", addressDoc._id);

        // Delete test address
        await Address.deleteOne({ _id: addressDoc._id });
        console.log("Test address cleaned up successfully!");

    } catch (err) {
        console.error("ERROR encountered during test:", err);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB.");
    }
}

test();
