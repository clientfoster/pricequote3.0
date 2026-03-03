const mongoose = require('mongoose');

let cached = global.__mongoose_conn;

if (!cached) {
    cached = global.__mongoose_conn = { conn: null, promise: null };
}

const connectDB = async () => {
    if (cached.conn) {
        return cached.conn;
    }
    if (!cached.promise) {
        cached.promise = mongoose.connect(process.env.MONGO_URI).then((conn) => conn);
    }
    try {
        cached.conn = await cached.promise;
        console.log(`MongoDB Connected: ${cached.conn.connection.host}`);
        return cached.conn;
    } catch (error) {
        cached.promise = null;
        console.error(`Error: ${error.message}`);
        throw error;
    }
};

module.exports = connectDB;
