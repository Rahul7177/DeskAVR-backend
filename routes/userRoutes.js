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
      { userID: user.userID, email: user.email,},
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      name: user.name,
      email: user.email,
      userID: user.userID,
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

router.get("/pastinterviews/:userID", async (req, res) => {
  try {
    const { userID } = req.params; // Use params instead of query
    console.log(`Received userID from request: ${userID}`);

    if (!userID) {
      return res.status(400).json({ message: "UserId is required" });
    }

    // Log all users for debugging (useful for testing)
    const allUsers = await User.find();
    console.log("All users in database:", allUsers);

    const user = await User.findOne({ userID: userID });
    if (!user) {
      console.log(`User not found for userID: ${userID}`);
      return res.status(404).json({ message: "User not found" });
    }

    console.log("User found:", user);

    const interviews_given = Array.isArray(user.interviews_given) ? user.interviews_given : [];
    const reports = Array.isArray(user.reports) ? user.reports : [];

    const pastInterviews = interviews_given.map((company, index) => {
      const report = reports[index] || {};
      return {
        name: company,
        createdAt: report.createdAt ? new Date(report.createdAt).toLocaleDateString() : "Date not available",
      };
    });

    console.log("Past interviews:", pastInterviews);

    res.json(pastInterviews);
  } catch (error) {
    console.error("Error fetching past interviews:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:userID/reports/:index", async (req, res) => {
  const { userID, index } = req.params;

  try {
    // Find the user by userID
    const user = await User.findOne({ userID });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if the index is valid for both interviews_given and reports
    if (index < 0 || index >= user.reports.length || index >= user.interviews_given.length) {
      return res.status(404).json({ error: "Report or interview not found" });
    }

    // Retrieve the specific report and interview
    const report = user.reports[index];
    const interview = user.interviews_given[index];
    
    // Include interview data if needed in response
    res.status(200).json({ report, interview, user });
  } catch (error) {
    console.error("Error fetching report:", error);
    res.status(500).json({ error: "Failed to fetch report" });
  }
});


module.exports = router;
