const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  Domain_knowledge: Number,
  Quality_of_responses: Number,
  Work_Experience: Number,
  Well_revised_with_new_Technology: Number,
  Project_Work: Number,
  Final_Score: Number,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const userSchema = new mongoose.Schema({
  userID: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  reports: [reportSchema],
  interviews_given: [String],
  interview_count: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  name:{type: String, required: true},
  phone:{type: String, required: true, unique: true},
  subscription:{type: Boolean, default: false},
});

module.exports = mongoose.model("user", userSchema);
