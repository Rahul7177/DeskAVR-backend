const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

const JWT_SECRET = "your_jwt_secret";

// Signup Route
router.post("/signup", async (req, res) => {
    const { userID, email, password } = req.body;
    try {
      const newUser = new User({
        userID,
        email,
        password, 
      });
      await newUser.save();
      res.status(201).json({ message: "User registered successfully!" });
    } catch (err) {
      res.status(500).json({ error: "Error registering user", details: err });
    }
  });
  

// Login Route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({
      email: { $regex: new RegExp("^" + email + "$", "i") },
    });

    console.log("User Document Retrieved:", user); // Debugging log

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.password !== password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userID: user.userID, email: user.email },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      name: user.name,
      email: user.email,
    });
  } catch (err) {
    console.error("Error during login:", err); // Debugging log
    res.status(500).json({ error: "Error logging in", details: err });
  }
});


// Add a new report
router.post("/addReport/:userID", async (req, res) => {
  const { userID } = req.params;
  const report = req.body;
  try {
    const user = await User.findOne({ userID });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.reports.push(report);
    user.interviews_given.push(report.company); // Assuming the frontend sends `company` in the report.
    user.interview_count = user.reports.length;
    user.updatedAt = new Date();

    await user.save();
    res.status(200).json({ message: "Report added successfully!" });
  } catch (err) {
    res.status(500).json({ error: "Error adding report", details: err });
  }
});

// Get user details
router.get("/:userID", async (req, res) => {
  const { userID } = req.params;
  try {
    const user = await User.findOne({ userID });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: "Error fetching user", details: err });
  }
});

router.put("/update-password", async (req, res) => {
  const { userId, newPassword } = req.body;

  if (!newPassword) {
    return res.status(400).json({ error: "New password is required" });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});


module.exports = router;
