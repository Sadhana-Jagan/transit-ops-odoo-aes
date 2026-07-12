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
            cost,
            revenue,
            status,
            region,
        } = req.body;

        const payload = {
            registrationNumber: (registrationNumber || regNo || "").trim(),
            vehicleName: vehicleName || name,
            vehicleType: vehicleType || type,
            maxLoadCapacity: maxLoadCapacity ?? capacity,
            odometer: odometer ?? 0,
            averageRunningCost: averageRunningCost ?? avgCost ?? cost ?? 0,
            acquisitionCost: acquisitionCost ?? avgCost ?? cost ?? 0,
            revenue: revenue ?? 0,
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

const updateVehicle = async (req, res) => {
    try {
        const body = req.body;
        const update = {};

        if (body.registrationNumber || body.regNo || body.reg) update.registrationNumber = (body.registrationNumber || body.regNo || body.reg).trim();
        if (body.vehicleName || body.name) update.vehicleName = body.vehicleName || body.name;
        if (body.vehicleType || body.type) update.vehicleType = body.vehicleType || body.type;
        if (body.maxLoadCapacity != null || body.capacity != null) update.maxLoadCapacity = body.maxLoadCapacity ?? body.capacity;
        if (body.odometer != null) update.odometer = body.odometer;
        if (body.acquisitionCost != null || body.cost != null) update.acquisitionCost = body.acquisitionCost ?? body.cost;
        if (body.averageRunningCost != null || body.cost != null) update.averageRunningCost = body.averageRunningCost ?? body.cost;
        if (body.revenue != null) update.revenue = body.revenue;
        if (body.region) update.region = body.region;
        if (body.status) {
            const mapped = mapVehicleStatus(body.status);
            if (!mapped) return res.status(400).json({ success: false, message: "Invalid vehicle status" });
            update.status = mapped;
        }

        const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
        if (!vehicle) return res.status(404).json({ success: false, message: "Vehicle not found" });

        return res.status(200).json({ success: true, message: "Vehicle updated", data: vehicle });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const deleteVehicle = async (req, res) => {
    try {
        const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
        if (!vehicle) return res.status(404).json({ success: false, message: "Vehicle not found" });
        return res.status(200).json({ success: true, message: "Vehicle deleted" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getVehicles, createVehicle, updateVehicleStatus, updateVehicle, deleteVehicle };
