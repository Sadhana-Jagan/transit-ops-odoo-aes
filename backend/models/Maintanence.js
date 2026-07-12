const mongoose = require("mongoose");

module.exports = mongoose.model(
    "Maintenance",
    new mongoose.Schema(
        {
            vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },
            maintenanceType: { type: String, required: true },
            description: String,
            cost: { type: Number, required: true },
            serviceDate: { type: Date, default: Date.now },
            status: { type: String, enum: ["Open", "Completed"], default: "Open" },
            openedAt: { type: Date, default: Date.now },
            closedAt: Date,
        },
        { timestamps: true }
    )
);