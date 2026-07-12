const User = require("../models/User");
const { signToken } = require("../utils/authToken");
const Driver = require("../models/Driver")
const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({ success: false, message: "name, email, password and role are required" });
        }

        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(409).json({ success: false, message: "Email already registered" });
        }

        const user = await User.create({ name, email, password, role });
        if (role.toLowerCase() === "driver") {
            console.log(role)
            await Driver.create({
                name,
                // Populate any required fields in your Driver schema
                licenseNumber: "",
                licenseCategory: "B",
                licenseExpiry: null,
                contactNumber: "",
                tripCompletion: 0,
                safetyScore: "High",
                safetyStatus: "Available",
                status: "Available",
            });
        }
        return res.status(201).json({
            success: true,
            message: "User registered",
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        if (error.name === "ValidationError") {
            const message = Object.values(error.errors).map((e) => e.message).join(", ");
            return res.status(400).json({ success: false, message });
        }
        return res.status(500).json({ success: false, message: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "email and password are required" });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const token = signToken(user);

        res.cookie("token", token, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 12 * 60 * 60 * 1000,
        });

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const me = async (req, res) => {
    return res.status(200).json({ success: true, data: req.user });
};

module.exports = { register, login, me };
