const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const JWT_SECRET = process.env.JWT_SECRET || 'your_default_secret';

router.post('/adminlogin', async (req, res) => {
    const { email, password } = req.body;

    try {
        const admin = await Admin.findOne({ email: { $regex: new RegExp("^" + email + "$", "i") } });

        if (!admin) {
            return res.status(404).json({ error: "Admin not found" });
        }

        // *** Bypassing bcrypt for now (FOR DEVELOPMENT ONLY) ***
        if (admin.password !== password) { // Direct password comparison (INSECURE)
            return res.status(401).json({ error: "Invalid credentials" });
        }
        // *** End of bcrypt bypass ***

        const tokenPayload = { adminID: admin._id, email: admin.email, isAdmin: true };

        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "1h" });

        res.status(200).json({
            message: "Admin login successful",
            token,
            name: admin.name,
            email: admin.email,
            adminID: admin._id,
            isAdmin: true
        });
    } catch (err) {
        console.error("Error during admin login:", err);
        res.status(500).json({ error: "Error logging in", details: err });
    }
});

module.exports = router;