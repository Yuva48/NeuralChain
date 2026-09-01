const mongoose = require("mongoose");

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    console.log("✅ Using existing MongoDB connection");
    return;
  }

  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error(
        "MONGODB_URI environment variable is not set. Please add it to your .env file."
      );
    }

    // Check if URI contains placeholder
    if (mongoUri.includes("<db_username>") || mongoUri.includes("<db_password>")) {
      throw new Error(
        "MongoDB URI contains placeholders (<db_username> or <db_password>). Please replace with actual credentials in .env file."
      );
    }

    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(mongoUri);

    isConnected = true;
    console.log("✅ MongoDB connected successfully");
    return mongoose.connection;
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
    console.log("✅ MongoDB disconnected");
  }
};

module.exports = { connectDB, disconnectDB };
