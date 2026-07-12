const Driver = require("../models/Driver");
const { mapDriverStatus, mapDriverSafetyStatus } = require("../utils/statusMappers");
const mapDriverSafetyScore = (value) => {

    if (value == null || value === "") return "High";

    const numericScore = Number(value);
    if (!Number.isNaN(numericScore)) {
        if (numericScore >= 80) return "High";
        if (numericScore >= 60) return "Medium";
        return "Low";
    }

    const normalized = value.toString().toLowerCase().replace(/[_\s-]/g, "");
    const scores = {
        low: "Low",
        medium: "Medium",
        med: "Medium",
        high: "High",
    };

    return scores[normalized] || null;
};

const getDrivers = async (_req, res) => {
    try {
        const drivers = await Driver.find().sort({ createdAt: -1 }).lean();
        const data = drivers.map((driver) => ({
            ...driver,
            safetyScore: mapDriverSafetyScore(driver.safetyScore),
        }));

        return res.status(200).json({ success: true, count: data.length, data });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};



const createDriver = async (req, res) => {
    try {
        const {
            name,
            licenseNumber,
            license,
            licenseCategory,
            category,
            licenseExpiry,
            expiry,
            contactNumber,
            contact,
            tripCompletion,
            tripsCompleted,
            safetyScore,
            safety,
            safetyStatus,
            status,
        } = req.body;

        const payload = {
            name,
            licenseNumber: licenseNumber || license,
            licenseCategory: licenseCategory || category,
            licenseExpiry: licenseExpiry || expiry,
            contactNumber: contactNumber || contact,
            tripCompletion: tripCompletion ?? tripsCompleted ?? 0,
        };

        if (!payload.name || !payload.licenseNumber || !payload.licenseCategory || !payload.licenseExpiry || !payload.contactNumber) {
            return res.status(400).json({
                success: false,
                message: "name, licenseNumber, licenseCategory, licenseExpiry and contactNumber are required",
            });
        }

        const existing = await Driver.findOne({ licenseNumber: payload.licenseNumber });
        if (existing) {
            return res.status(409).json({ success: false, message: "Driver license number already exists" });
        }

        const mappedSafetyScore = mapDriverSafetyScore(safetyScore ?? safety);
        if (!mappedSafetyScore) {
            return res.status(400).json({ success: false, message: "Invalid driver safety score" });
        }

        payload.safetyScore = mappedSafetyScore;

        const mappedSafety = mapDriverSafetyStatus(safetyStatus || "Available");
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
        const { status, safetyStatus, safetyScore, safety } = req.body;

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

        if (safetyScore != null || safety != null) {
            const mappedSafetyScore = mapDriverSafetyScore(safetyScore ?? safety);
            if (!mappedSafetyScore) {
                return res.status(400).json({ success: false, message: "Invalid driver safety score" });
            }
            update.safetyScore = mappedSafetyScore;
        }

        if (!Object.keys(update).length) {
            return res.status(400).json({ success: false, message: "status, safetyStatus or safetyScore is required" });
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

const updateDriver = async (req, res) => {
    try {
        const body = req.body;
        const update = {};

        if (body.name) update.name = body.name;
        if (body.licenseNumber || body.license) update.licenseNumber = body.licenseNumber || body.license;
        if (body.licenseCategory || body.category) update.licenseCategory = body.licenseCategory || body.category;
        if (body.licenseExpiry || body.expiry) update.licenseExpiry = body.licenseExpiry || body.expiry;
        if (body.contactNumber || body.contact) update.contactNumber = body.contactNumber || body.contact;
        if (body.tripCompletion != null || body.tripsCompleted != null) update.tripCompletion = body.tripCompletion ?? body.tripsCompleted;

        if (body.safetyScore != null || body.safety != null) {
            const mappedSafetyScore = mapDriverSafetyScore(body.safetyScore ?? body.safety);
            if (!mappedSafetyScore) return res.status(400).json({ success: false, message: "Invalid driver safety score" });
            update.safetyScore = mappedSafetyScore;
        }

        if (body.status) {
            const mappedStatus = mapDriverStatus(body.status);
            if (!mappedStatus) return res.status(400).json({ success: false, message: "Invalid driver status" });
            update.status = mappedStatus;
        }

        if (body.safetyStatus) {
            const mappedSafety = mapDriverSafetyStatus(body.safetyStatus);
            if (!mappedSafety) return res.status(400).json({ success: false, message: "Invalid driver safety status" });
            update.safetyStatus = mappedSafety;
        }

        const driver = await Driver.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
        if (!driver) return res.status(404).json({ success: false, message: "Driver not found" });

        return res.status(200).json({ success: true, message: "Driver updated", data: driver });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const deleteDriver = async (req, res) => {
    try {
        const driver = await Driver.findByIdAndDelete(req.params.id);
        if (!driver) return res.status(404).json({ success: false, message: "Driver not found" });
        return res.status(200).json({ success: true, message: "Driver deleted" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getDrivers, createDriver, updateDriverStatus, updateDriver, deleteDriver };
