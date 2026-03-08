const mongoose = require("mongoose");
const Program = require("../models/Program");

const createProgram = async (req, res) => {
  try {
    const program = await Program.create(req.body);
    return res.status(201).json(program);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const getPrograms = async (req, res) => {
  try {
    const filters = {};

    const allowedFilters = ["name", "category", "section", "targetMuscle", "equipment", "level"];
    allowedFilters.forEach((field) => {
      if (req.query[field]) {
        filters[field] = new RegExp(req.query[field], "i");
      }
    });

    const programs = await Program.find(filters).sort({ createdAt: -1 });
    return res.status(200).json(programs);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getProgramById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid program id" });
    }

    const program = await Program.findById(id);

    if (!program) {
      return res.status(404).json({ message: "Program not found" });
    }

    return res.status(200).json(program);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateProgram = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid program id" });
    }

    const program = await Program.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    });

    if (!program) {
      return res.status(404).json({ message: "Program not found" });
    }

    return res.status(200).json(program);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const deleteProgram = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid program id" });
    }

    const program = await Program.findByIdAndDelete(id);

    if (!program) {
      return res.status(404).json({ message: "Program not found" });
    }

    return res.status(200).json({ message: "Program deleted" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createProgram,
  getPrograms,
  getProgramById,
  updateProgram,
  deleteProgram
};
