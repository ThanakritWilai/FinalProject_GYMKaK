const express = require("express");
const {
  createExercise,
  getExercises,
  getExerciseById,
  updateExercise,
  deleteExercise
} = require("../controllers/exerciseController");
const { protect } = require("../middleware/authMiddleware");
const { requirePremiumMembership } = require("../middleware/validationMiddleware");

const router = express.Router();

router.post("/", createExercise);
router.get("/", getExercises);
router.get("/:id", getExerciseById);
router.put("/:id", updateExercise);
router.delete("/:id", deleteExercise);

// ✅ VIP Only: GET /api/exercises/analysis - Plan Analysis (Premium Only)
router.get("/analysis/premium-data", protect, requirePremiumMembership, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Premium analysis data accessible',
    membership: req.userMembership
  });
});

module.exports = router;
