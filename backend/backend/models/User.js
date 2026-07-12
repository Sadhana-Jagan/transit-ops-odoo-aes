const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true, lowercase: true },
        password: { type: String, required: true, minlength: 6 },
        role: {
            type: String,
            enum: ["FleetManager", "Dispatcher", "SafetyOfficer", "FinancialAnalyst", "Driver"],
            required: true,
        },
    },
    { timestamps: true }
);

userSchema.pre("save", async function save(next) {
    if (!this.isModified("password")) {
        return next();
    }

    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.comparePassword = function comparePassword(plainPassword) {
    return bcrypt.compare(plainPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);