const mongoose = require("mongoose");

const exerciseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
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
    mediaUrl: {
      type: String,
      trim: true
    },
    estimatedCalories: {
      type: Number,
      min: 0
    },
    level: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Exercise", exerciseSchema);
