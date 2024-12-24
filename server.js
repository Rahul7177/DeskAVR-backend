const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const User = require("./models/User");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const requireAuth = require('./authMiddleware');

const app = express();
app.use(express.json()); // Replaces body-parser

// Middleware
app.use(
  cors({
    origin: "http://localhost:3000", // Your frontend's URL
    methods: ["GET", "POST", "PUT", "DELETE"], // Allowed methods
    credentials: true, // Allow cookies/auth headers if needed
  })
);

// Routes

// MongoDB Connection
const mongoURI = "mongodb+srv://deskavrspectov:deskavr123@cluster0.dfw2o.mongodb.net/deskavr";
mongoose
.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log("Connected to MongoDB");
  
  // Debugging database connection
  const db = mongoose.connection.db;
  const databaseName = db.databaseName;
  console.log(`Connected to database: ${databaseName}`);
  
  const collections = await db.collections();
  console.log("Collections in the database:");
  collections.forEach((collection) => {
    console.log(`- ${collection.collectionName}`);
  });
})
.catch((err) => {
  console.error("Error connecting to MongoDB:", err);
});

app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message);
  res.status(500).json({ error: "Internal Server Error", details: err.message });
  console.log("Request:", req.method, req.url, req.body);
  next();
});


// Default Route
app.get("/", (req, res) => {
  res.send("Hello, MongoDB connected!");
});
app.get('/api/admin/dashboard', requireAuth, (req, res) => {
  // This code will only execute if the user is authenticated and is an admin
  res.json({ message: 'Admin dashboard accessed successfully', user: req.user }); // Send user data from middleware
});

app.put('/api/users/:userId', async (req, res) => {
  try {
      const userId = req.params.userId;
      const { subscription, key } = req.body; // Include 'key' in the destructuring

      const updateFields = { subscription }; // Start with subscription

      if (key !== undefined) { // Only add 'key' if it's provided in the request
          updateFields.key = key;
      }

      const updatedUser = await User.findByIdAndUpdate(userId, updateFields, { new: true });

      if (!updatedUser) {
          return res.status(404).json({ error: 'User not found' });
      }

      res.json(updatedUser);
  } catch (error) {
      console.error('Error updating user:', error); // More generic error message
      res.status(500).json({ error: 'Failed to update user' }); // More generic error message
  }
});
const reportRoutes = require("./routes/report");
app.use("/api/sendreport", reportRoutes);
app.use("/api/getreport", reportRoutes);
app.use("/api/user", reportRoutes); 

const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
