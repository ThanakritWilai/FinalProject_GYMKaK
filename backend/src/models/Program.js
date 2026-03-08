const mongoose = require("mongoose");

const programSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      required: true,
      enum: ["weight", "cardio", "calisthenics"],
      trim: true
    },
    section: {
      type: String,
      trim: true
    },
    targetMuscle: {
      type: String,
      required: true,
      trim: true
    },
    equipment: {
      type: String,
      trim: true
    },
    level: {
      type: String,
      trim: true
    },
    mediaUrl: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    tags: {
      type: [String],
      default: []
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Program", programSchema);
