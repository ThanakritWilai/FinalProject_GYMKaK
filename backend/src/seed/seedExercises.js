const dotenv = require("dotenv");
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Exercise = require("../models/Exercise");

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || "Gym";

const seedData = [
  {
    name: "Bench Press",
    description: "Compound chest press with barbell",
    targetMuscle: "Chest",
    equipment: "Barbell",
    level: "Intermediate",
    estimatedCalories: 120
  },
  {
    name: "Pull Up",
    description: "Bodyweight vertical pulling exercise",
    targetMuscle: "Back",
    equipment: "Pull-up Bar",
    level: "Intermediate",
    estimatedCalories: 90
  },
  {
    name: "Squat",
    description: "Compound lower-body movement",
    targetMuscle: "Leg",
    equipment: "Barbell",
    level: "Beginner",
    estimatedCalories: 130
  },
  {
    name: "Running",
    description: "Steady state cardio",
    targetMuscle: "Cardio",
    equipment: "None",
    level: "Beginner",
    estimatedCalories: 220
  }
];

async function runSeed() {
  try {
    process.env.MONGODB_DB_NAME = MONGODB_DB_NAME;
    await connectDB(MONGODB_URI);

    await Exercise.deleteMany({});
    await Exercise.insertMany(seedData);

    console.log(`✅ Seed completed in database: ${mongoose.connection.name}`);
    console.log(`📦 Inserted ${seedData.length} exercises`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error.message);
    process.exit(1);
  }
}

runSeed();
