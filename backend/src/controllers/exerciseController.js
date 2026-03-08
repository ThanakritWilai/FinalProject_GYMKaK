const mongoose = require("mongoose");
const Exercise = require("../models/Exercise");

const createExercise = async (req, res) => {
  try {
    const exercise = await Exercise.create(req.body);
    return res.status(201).json(exercise);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const getExercises = async (req, res) => {
  try {
    const filters = {};

    const allowedFilters = ["name", "targetMuscle", "equipment", "level"];
    allowedFilters.forEach((field) => {
      if (req.query[field]) {
        filters[field] = new RegExp(req.query[field], "i");
      }
    });

    const exercises = await Exercise.find(filters).sort({ createdAt: -1 });
    return res.status(200).json(exercises);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getExerciseById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid exercise id" });
    }

    const exercise = await Exercise.findById(id);

    if (!exercise) {
      return res.status(404).json({ message: "Exercise not found" });
    }

    return res.status(200).json(exercise);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateExercise = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid exercise id" });
    }

    const exercise = await Exercise.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    });

    if (!exercise) {
      return res.status(404).json({ message: "Exercise not found" });
    }

    return res.status(200).json(exercise);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const deleteExercise = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid exercise id" });
    }

    const exercise = await Exercise.findByIdAndDelete(id);

    if (!exercise) {
      return res.status(404).json({ message: "Exercise not found" });
    }

    return res.status(200).json({ message: "Exercise deleted" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createExercise,
  getExercises,
  getExerciseById,
  updateExercise,
  deleteExercise
};
