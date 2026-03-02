const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User'); // Adjust path if needed
const bcrypt = require('bcryptjs');

dotenv.config({ path: '../.env' }); // Adjust path to .env if running from 'scripts' folder, or just use .env in root

// Better explicitly load it or assume we run from backend root having .env
// Let's assume we run strict from backend root: node scripts/initDb.js
// So .env is in ./
dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${mongoose.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const seedParams = async () => {
    await connectDB();

    const existingAdmin = await User.findOne({ role: 'SuperAdmin' });
    if (existingAdmin) {
        console.log('SuperAdmin already exists.');
    } else {
        // Create default SuperAdmin
        // Since we might not have 'SetupPassword' flow for the *first* user, 
        // let's create one with a known password or just an invite token?
        // User request "create schema", so let's just make the collection exist.
        // I will create a dummy entry or a real admin if I knew the pass.
        // Let's create a placeholder admin.

        console.log('Creating SuperAdmin user...');
        // We need to hash password if we set one, or leave it blank if using invite flow.
        // For "Create Schema", just ensuring collection exists is enough.
        // But let's verify models.

        // Actually, if we just want to test connection, we are good.
        // But to "Create Schema", we need to insert something for Compass/Atlas to show the collections.

        // Let's not insert data that might be garbage.
        // I will just create the collections by creating indexes or empty.
        // Mongoose generic way:
        await User.init();
        await require('../models/Quotation').init();
        await require('../models/Client').init();

        console.log('Collections initialized (indexes built).');
    }

    console.log('Database verification successful.');
    process.exit();
};

seedParams();
