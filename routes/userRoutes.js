const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { Admin } = require("../models/Admin");
const cors = require("cors");
const router = express.Router();
const mongoose = require("mongoose");

const JWT_SECRET = "your_jwt_secret";

router.get('/', async (req, res) => {
  try {
      const users = await User.find();
      res.json(users);
  } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Signup Route
router.post("/signup", async (req, res) => {
  const { name, email, phone, password } = req.body;
  console.log("Request body:", req.body); // Log the entire request body

  if (!name || !email || !phone || !password) {
      console.log("Validation failed: Missing fields");
      return res.status(400).json({ error: "All fields are required!" });
  }

  try {
      console.log("Checking for existing user by email:", email);
      const existingUser = await User.findOne({ email });
      console.log("Existing user (by email) result:", existingUser);

      if (existingUser) {
          console.log("Email already in use:", email);
          return res.status(400).json({ error: "Email already in use!" });
      }
      console.log("Checking for existing user by phone:", phone);
      const existingPhone = await User.findOne({ phone });
      console.log("Existing user (by phone) result:", existingPhone);
      if (existingPhone) {
          console.log("Phone number already in use:", phone);
          return res.status(400).json({ error: "Phone number already in use!" });
      }

      console.log("Hashing password...");
      const hashedPassword = await bcrypt.hash(password, 10);
      console.log("Password hashed successfully.");

      console.log("Creating new user...");
      const newUser = new User({
          userID: new mongoose.Types.ObjectId(),
          name,
          email,
          phone,
          password: hashedPassword,
          subscription: false,
          transactions: [],
          interview_count: 0,
          interviews_given: [],
          reports: [],
      });
      console.log("New user object created:", newUser);

      console.log("Saving user to database...");
      await newUser.save();
      console.log("User saved successfully.");

      res.status(201).json({ message: "User registered successfully!" });
  } catch (err) {
    if (err.name === 'ValidationError') {
      console.error("Mongoose Validation Error:", err.errors); // Log the specific validation errors
      return res.status(400).json({ error: "Validation Error", details: err.errors }); // Send validation errors to the client
  }
      console.error("Error in signup route:", err); // Log the full error object
      res.status(500).json({ error: "Error registering user", details: err.message });
  }
});
  

// Login Route
router.post("/login", async (req, res) => {
  const { email, password, isAdmin } = req.body;

  try {
      let user; // Declare user variable outside the if/else
      if (isAdmin) {
          user = await Admin.findOne({ email: { $regex: new RegExp("^" + email + "$", "i") } });
      } else {
          user = await User.findOne({ email: { $regex: new RegExp("^" + email + "$", "i") } });
      }

      if (!user) {
          return res.status(404).json({ error: `${isAdmin ? "Admin" : "User"} not found` });
      }

      try {
          const isMatch = await bcrypt.compare(password, user.password);
          if (!isMatch) {
              return res.status(401).json({ error: "Invalid credentials" });
          }
      } catch (bcryptErr) {
          console.error("Error comparing passwords:", bcryptErr);
          return res.status(500).json({ error: "Error logging in", details: bcryptErr });
      }

      const tokenPayload = isAdmin
          ? { adminID: user._id, email: user.email, isAdmin: true } // Include isAdmin in payload
          : { userID: user.userID, email: user.email, isAdmin: false }; // Include isAdmin in payload

      const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "1h" });

      res.status(200).json({
          message: "Login successful",
          token,
          name: user.name,
          email: user.email,
          ...(isAdmin ? { adminID: user._id } : { userID: user.userID }),
          isAdmin: isAdmin // Send isAdmin back to the client
      });
  } catch (err) {
      console.error("Error during login:", err);
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
  const { userID } = req.params; // Extract the userID from the route parameter

  try {
    // Find the user by userID in the database
    const user = await User.findOne({ userID });

    // Check if user exists
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Assuming the user document has 'subscription' and 'transactions' fields
    // You can customize this depending on what you want to return
    const userData = {
      id: user.userID,
      name: user.name,
      email: user.email,
      subscription: user.subscription, // Subscription status
      transactions: user.transactions, // Transaction history
    };

    // Send back the user data as a response
    res.status(200).json(userData);
  } catch (err) {
    // Handle any error that occurs while fetching the user
    console.error("Error fetching user:", err);
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

router.post("/addTransaction/:userID", async (req, res) => {
  const { userID } = req.params;
  const { transactionID } = req.body;

  console.log("Received UserID:", userID);
  console.log("Received TransactionID:", transactionID);

  if (!userID || !transactionID) {
    return res.status(400).json({ error: "UserID and TransactionID are required" });
  }

  try {
    const user = await User.findOne({ userID });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.transactions.push(transactionID);
    await user.save();
    res.status(200).json({ message: "Transaction ID added successfully" });
  } catch (error) {
    console.error("Error adding transaction:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});




module.exports = router;
