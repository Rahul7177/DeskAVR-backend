const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

const requireAuth = (req, res, next) => {
    const token = req.header('Authorization');

    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // Add user information to the request object
        if (!req.user.isAdmin) { // Check if the user is an admin
            return res.status(403).json({ message: 'Forbidden: Not an admin' });
        }
        next(); // Call next if the token is valid and the user is an admin
    } catch (err) {
        console.error("JWT Verification Error:", err);
        res.status(401).json({ message: 'Token is not valid' });
    }
};

module.exports = requireAuth;