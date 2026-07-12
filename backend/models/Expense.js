const mongoose = require("mongoose");

module.exports = mongoose.model(
    "Expense",
    new mongoose.Schema(
        {
            trip: { type: mongoose.Schema.Types.ObjectId, ref: "Trip" },
            vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },
            tollFee: { type: Number, default: 0 },
            otherFee: { type: Number, default: 0 },
            maintenanceCost: { type: Number, default: 0 },
            totalCost: { type: Number, required: true },
            remarks: String,
            date: { type: Date, default: Date.now },
        },
        { timestamps: true }
    )
);