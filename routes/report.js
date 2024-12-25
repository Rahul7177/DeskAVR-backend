const router = require("express").Router();
const User = require("../models/User.js");

// POST route to create or update a report - /api/sendreport
router.post("/", async (req, res) => {
    try {
        const { phone, report } = req.body;

        if (!phone || typeof phone !== "string") {
            return res.status(400).send({ message: "Invalid or missing phone" });
        }

        if (!report || typeof report !== "object") {
            return res.status(400).send({ message: "Invalid or missing report data" });
        }

        // Find the user by phone and update the reports array
        const user = await User.findOneAndUpdate(
            { phone },
            { $push: { reports: report } },
            { new: true }
        );

        if (!user) {
            return res.status(404).send({ message: "User not found" });
        }

        res.status(201).send({ message: "Report added successfully", user });
    } catch (error) {
        console.error("Error in POST /api/sendreport:", error);
        res.status(500).send({ message: "Internal Server Error", error: error.message });
    }
});

// GET route to fetch all reports or reports for a specific user - /api/getreport
router.get("/", async (req, res) => {
    try {
        const { phone } = req.query;

        if (phone && typeof phone !== "string") {
            return res.status(400).send({ message: "Invalid phone format" });
        }

        // Find reports for a specific user or all users
        const query = phone ? { phone } : {};
        const users = await User.find(query).select("phone name reports");

        res.status(200).send(users);
    } catch (error) {
        console.error("Error in GET /api/getreport:", error);
        res.status(500).send({ message: "Internal Server Error", error: error.message });
    }
});

// GET route to fetch user report details by phone - /api/user/:phone
router.get("/:phone", async (req, res) => {
    try {
        const { phone } = req.params;

        if (!phone || typeof phone !== "string") {
            return res.status(400).send({ message: "Invalid phone format" });
        }

        // Find user by phone and return reports
        const user = await User.findOne({ phone }).select("phone name reports");

        if (!user) {
            return res.status(404).send({ message: "User not found" });
        }

        res.status(200).send(user);
    } catch (error) {
        console.error("Error in GET /api/user/:phone:", error);
        res.status(500).send({ message: "Internal Server Error", error: error.message });
    }
});

// GET route to fetch the count of reports for a specific user - /api/user/:phone/report-count
router.get("/:phone/report-count", async (req, res) => {
    try {
        const { phone } = req.params;

        if (!phone || typeof phone !== "string") {
            return res.status(400).send({ message: "Invalid phone format" });
        }

        // Find user by phone and count reports
        const user = await User.findOne({ phone }).select("reports");

        if (!user) {
            return res.status(404).send({ message: "User not found" });
        }

        const reportCount = user.reports.length;

        res.status(200).send({ reportCount });
    } catch (error) {
        console.error("Error in GET /api/user/:phone/report-count:", error);
        res.status(500).send({ message: "Internal Server Error", error: error.message });
    }
});

module.exports = router;
