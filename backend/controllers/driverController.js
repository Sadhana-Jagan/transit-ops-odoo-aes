const Driver = require("../models/Driver");
const { mapDriverStatus, mapDriverSafetyStatus } = require("../utils/statusMappers");

const getDrivers = async (_req, res) => {
    try {
        const drivers = await Driver.find().sort({ createdAt: -1 });
        return res.status(200).json({ success: true, count: drivers.length, data: drivers });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const createDriver = async (req, res) => {
    try {
        const {
            name,
            licenseNumber,
            licenseCategory,
            licenseExpiry,
            contactNumber,
            tripCompletion,
            safetyScore,
            safetyStatus,
            safety,
            status,
        } = req.body;

        if (!name || !licenseNumber || !licenseCategory || !licenseExpiry || !contactNumber) {
            return res.status(400).json({
                success: false,
                message: "name, licenseNumber, licenseCategory, licenseExpiry and contactNumber are required",
            });
        }

        const existing = await Driver.findOne({ licenseNumber });
        if (existing) {
            return res.status(409).json({ success: false, message: "Driver license number already exists" });
        }

        const payload = {
            name,
            licenseNumber,
            licenseCategory,
            licenseExpiry,
            contactNumber,
            tripCompletion: tripCompletion ?? 0,
            safetyScore: safetyScore ?? 100,
        };

        const mappedSafety = mapDriverSafetyStatus(safetyStatus || safety || "Available");
        if (!mappedSafety) {
            return res.status(400).json({ success: false, message: "Invalid driver safety status" });
        }
        payload.safetyStatus = mappedSafety;

        if (status) {
            const mappedStatus = mapDriverStatus(status);
            if (!mappedStatus) {
                return res.status(400).json({ success: false, message: "Invalid driver status" });
            }
            payload.status = mappedStatus;
        }

        const driver = await Driver.create(payload);
        return res.status(201).json({ success: true, message: "Driver added", data: driver });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const updateDriverStatus = async (req, res) => {
    try {
        const { status, safetyStatus } = req.body;

        const update = {};
        if (status) {
            const mappedStatus = mapDriverStatus(status);
            if (!mappedStatus) {
                return res.status(400).json({ success: false, message: "Invalid driver status" });
            }
            update.status = mappedStatus;
        }

        if (safetyStatus) {
            const mappedSafety = mapDriverSafetyStatus(safetyStatus);
            if (!mappedSafety) {
                return res.status(400).json({ success: false, message: "Invalid driver safety status" });
            }
            update.safetyStatus = mappedSafety;
        }

        if (!Object.keys(update).length) {
            return res.status(400).json({ success: false, message: "status or safetyStatus is required" });
        }

        const driver = await Driver.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
        if (!driver) {
            return res.status(404).json({ success: false, message: "Driver not found" });
        }

        return res.status(200).json({ success: true, message: "Driver updated", data: driver });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getDrivers, createDriver, updateDriverStatus };
