const jwt = require("jsonwebtoken");

const signToken = (user) =>
    jwt.sign(
        {
            id: user._id,
            email: user.email,
            role: user.role,
        },
        process.env.JWT_SECRET || "transitops-secret",
        { expiresIn: process.env.JWT_EXPIRES_IN || "12h" }
    );

module.exports = { signToken };
