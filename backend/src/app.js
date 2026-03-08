const express = require("express");
const cors = require("cors");

const exerciseRoutes = require("./routes/exerciseRoutes");
const programRoutes = require("./routes/programRoutes");
const exercisesWithTagsRoutes = require("./routes/exercisesWithTagsRoutes");
const authRoutes = require("./routes/authRoutes");
const membershipRoutes = require("./routes/membershipRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({ message: "Gymkak API running" });
});

app.use("/api/exercises", exerciseRoutes);
app.use("/api/programs", programRoutes);
app.use("/api/exercises-tags", exercisesWithTagsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/membership", membershipRoutes);
app.use("/api/users", userRoutes);

module.exports = app;
