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
  userID: { type: mongoose.Types.ObjectId, required: true, unique: true, default: mongoose.Types.ObjectId },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  subscription: { type: Boolean, default: false },
  transactions: { type: [String], default: [] },
  interview_count: { type: Number, default: 0 },
  interviews_given: { type: [String], default: [] },
  reports: { type: [reportSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("user", userSchema);
