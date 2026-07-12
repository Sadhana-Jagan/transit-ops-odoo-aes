const mongoose = require("mongoose");

module.exports = mongoose.model(
    "Driver",
    new mongoose.Schema(
        {
            name: { type: String, required: true, trim: true },
            licenseNumber: { type: String, required: true, unique: true, trim: true },
            licenseCategory: { type: String, required: true },
            licenseExpiry: { type: Date, required: true },
            contactNumber: { type: String, required: true },
            tripCompletion: { type: Number, default: 0 },
            safetyScore: { type: Number, default: 100 },
            safetyStatus: { type: String, enum: ["Available", "OnTrip", "Suspended"], default: "Available" },
            status: { type: String, enum: ["Available", "OnTrip", "OffDuty", "Suspended"], default: "Available" },
        },
        { timestamps: true }
    )
);