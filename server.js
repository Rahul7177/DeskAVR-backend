const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const userRoutes = require("./routes/userRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use("/api/users", userRoutes);

// Connect to MongoDB
const mongoURI = "mongodb+srv://deskavrspectov:deskavr123@cluster0.dfw2o.mongodb.net/deskavr"; // Replace with your actual URI
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(async () => {
    console.log("Connected to MongoDB");

    // Get the current database name
    const db = mongoose.connection.db;
    const databaseName = db.databaseName;
    console.log(`Connected to database: ${databaseName}`);

    // List all collections in the database
    const collections = await db.collections();
    console.log("Collections in the database:");
    collections.forEach((collection) => {
      console.log(`- ${collection.collectionName}`);
    });

    // Optionally log some sample records from each collection
    for (let collection of collections) {
      const records = await collection.find().limit(3).toArray(); // Limiting to 3 records for brevity
      console.log(`Sample records from ${collection.collectionName}:`);
      console.log(records);
    }
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });

// Define your routes (assuming you've set up routes in userRoute.js)
app.get("/", (req, res) => {
  res.send("Hello, MongoDB connected!");
});

// Port where the server runs
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
