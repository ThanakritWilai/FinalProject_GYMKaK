const mongoose = require("mongoose");
require("dotenv").config();
const Account = require("./src/models/Account");
const seedAccounts = require("./src/seed/seedAccounts");

const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1/Gym";

const reseed = async () => {
  try {
    await mongoose.connect(mongoUri, {
      autoIndex: true,
      dbName: process.env.MONGODB_DB_NAME || "Gym"
    });

    console.log("Connected to MongoDB");

    // Drop the entire collection to remove old indexes
    try {
      await Account.collection.drop();
      console.log("✅ Dropped accounts collection");
    } catch (error) {
      console.log("ℹ️ Collection didn't exist, creating new one");
    }

    // Reseed accounts
    await seedAccounts();

    console.log("✅ Reseed complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during reseed:", error);
    process.exit(1);
  }
};

reseed();
