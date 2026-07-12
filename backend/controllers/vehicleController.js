const Vehicle = require("../models/Vehicle");
const { mapVehicleStatus } = require("../utils/statusMappers");

const getVehicles = async (req, res) => {
    try {
        const { type, status, region } = req.query;

        const filter = {};
        if (type) filter.vehicleType = type;
        if (status) {
            const mapped = mapVehicleStatus(status);
            if (!mapped) {
                return res.status(400).json({ success: false, message: "Invalid vehicle status" });
            }
            filter.status = mapped;
        }
        if (region) filter.region = region;

        const vehicles = await Vehicle.find(filter).sort({ createdAt: -1 });
        return res.status(200).json({ success: true, count: vehicles.length, data: vehicles });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const createVehicle = async (req, res) => {
    try {
        const {
            registrationNumber,
            regNo,
            vehicleName,
            name,
            vehicleType,
            type,
            maxLoadCapacity,
            capacity,
            odometer,
            averageRunningCost,
            avgCost,
            acquisitionCost,
            status,
            region,
        } = req.body;

        const payload = {
            registrationNumber: (registrationNumber || regNo || "").trim(),
            vehicleName: vehicleName || name,
            vehicleType: vehicleType || type,
            maxLoadCapacity: maxLoadCapacity ?? capacity,
            odometer: odometer ?? 0,
            averageRunningCost: averageRunningCost ?? avgCost ?? 0,
            acquisitionCost: acquisitionCost ?? avgCost ?? 0,
            region: region || "Default",
        };

        if (!payload.registrationNumber || !payload.vehicleName || !payload.vehicleType || payload.maxLoadCapacity == null) {
            return res.status(400).json({
                success: false,
                message: "registrationNumber, vehicleName, vehicleType and maxLoadCapacity are required",
            });
        }

        if (status) {
            const mappedStatus = mapVehicleStatus(status);
            if (!mappedStatus) {
                return res.status(400).json({ success: false, message: "Invalid vehicle status" });
            }
            payload.status = mappedStatus;
        }

        const existing = await Vehicle.findOne({ registrationNumber: payload.registrationNumber.toUpperCase() });
        if (existing) {
            return res.status(409).json({ success: false, message: "Vehicle registration number already exists" });
        }

        const vehicle = await Vehicle.create(payload);
        return res.status(201).json({ success: true, message: "Vehicle added", data: vehicle });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const updateVehicleStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const mapped = mapVehicleStatus(status);

        if (!mapped) {
            return res.status(400).json({ success: false, message: "Invalid vehicle status" });
        }

        const vehicle = await Vehicle.findByIdAndUpdate(
            req.params.id,
            { status: mapped },
            { new: true, runValidators: true }
        );

        if (!vehicle) {
            return res.status(404).json({ success: false, message: "Vehicle not found" });
        }

        return res.status(200).json({ success: true, message: "Vehicle status updated", data: vehicle });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getVehicles, createVehicle, updateVehicleStatus };
