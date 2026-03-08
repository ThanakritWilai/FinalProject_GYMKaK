const express = require('express');
const router = express.Router();
const Program = require('../models/Program');

// GET exercises by category with tags
router.get('/by-category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { section } = req.query;

    let query = { category };
    if (section) {
      query.section = section;
    }

    const exercises = await Program.find(query).select('name category section tags targetMuscle');
    
    res.status(200).json({
      success: true,
      count: exercises.length,
      data: exercises
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET all exercises with tags (for filtering)
router.get('/all', async (req, res) => {
  try {
    const exercises = await Program.find().select('name category section tags targetMuscle');
    
    res.status(200).json({
      success: true,
      count: exercises.length,
      data: exercises
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET single exercise by name
router.get('/search/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const exercise = await Program.findOne({ name: new RegExp(name, 'i') });
    
    if (!exercise) {
      return res.status(404).json({
        success: false,
        error: 'Exercise not found'
      });
    }

    res.status(200).json({
      success: true,
      data: exercise
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
