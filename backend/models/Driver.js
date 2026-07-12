const mongoose = require("mongoose");

module.exports = mongoose.model(
    "Driver",
    new mongoose.Schema(
        {
            name: { type: String, required: true, trim: true },
            licenseNumber: { type: String, required: false, unique: true, trim: true },
            licenseCategory: { type: String, required: false },
            licenseExpiry: { type: Date, required: false },
            contactNumber: { type: String, required: false },
            tripCompletion: { type: Number, default: 0 },
            safetyScore: { type: String, enum: ["Low", "Medium", "High"], default: "High" },
            safetyStatus: { type: String, enum: ["Available", "OnTrip", "Suspended"], default: "Available" },
            status: { type: String, enum: ["Available", "OnTrip", "OffDuty", "Suspended"], default: "Available" },
        },
        { timestamps: true }
    )
);
