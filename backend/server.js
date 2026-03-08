const dotenv = require("dotenv");
const connectDB = require("./src/config/db");
const app = require("./src/app");
const seedAccounts = require("./src/seed/seedAccounts");

dotenv.config();

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || "Gym";

const startServer = async () => {
  try {
    process.env.MONGODB_DB_NAME = MONGODB_DB_NAME;
    await connectDB(MONGODB_URI);

    // Seed accounts if collection is empty
    await seedAccounts();

    app.listen(PORT, () => {
      console.log(`Gymkak API listening on port ${PORT} (db: ${MONGODB_DB_NAME})`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
