const Maintenance = require("../models/Maintanence");
const Vehicle = require("../models/Vehicle");

const AUTO_CLOSE_MS = 15 * 60 * 1000;

const closeMaintenanceRecord = async (maintenanceId) => {
    const maintenance = await Maintenance.findById(maintenanceId).populate("vehicle");

    if (!maintenance || maintenance.status === "Completed") {
        return null;
    }

    maintenance.status = "Completed";
    maintenance.closedAt = new Date();
    await maintenance.save();

    if (maintenance.vehicle && maintenance.vehicle.status !== "Retired") {
        await Vehicle.findByIdAndUpdate(maintenance.vehicle._id, { status: "Available" });
    }

    return maintenance;
};

const scheduleAutoClose = (maintenanceId) => {
    setTimeout(() => {
        closeMaintenanceRecord(maintenanceId).catch(() => null);
    }, AUTO_CLOSE_MS);
};

const getMaintenance = async (req, res) => {
    try {
        const filter = {};
        if (req.query.status && req.query.status !== "all") {
            filter.status = req.query.status;
        }

        const records = await Maintenance.find(filter)
            .populate("vehicle", "registrationNumber vehicleName status")
            .sort({ createdAt: -1 });

        return res.status(200).json({ success: true, count: records.length, data: records });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const createMaintenance = async (req, res) => {
    try {
        const { vehicleId, vehicleRegistrationNumber, maintenanceType, serviceType, cost, date, description } = req.body;

        const vehicle = vehicleId
            ? await Vehicle.findById(vehicleId)
            : await Vehicle.findOne({ registrationNumber: (vehicleRegistrationNumber || "").toUpperCase() });

        if (!vehicle) {
            return res.status(404).json({ success: false, message: "Vehicle not found" });
        }

        const resolvedType = maintenanceType || serviceType;
        if (!resolvedType || cost == null) {
            return res.status(400).json({
                success: false,
                message: "maintenanceType/serviceType and cost are required",
            });
        }

        const maintenance = await Maintenance.create({
            vehicle: vehicle._id,
            maintenanceType: resolvedType,
            cost,
            serviceDate: date || new Date(),
            description,
            status: "Open",
        });

        if (vehicle.status !== "Retired") {
            await Vehicle.findByIdAndUpdate(vehicle._id, { status: "InShop" });
        }

        scheduleAutoClose(maintenance._id);

        const populated = await Maintenance.findById(maintenance._id).populate(
            "vehicle",
            "registrationNumber vehicleName status"
        );

        return res.status(201).json({ success: true, message: "Maintenance record created", data: populated });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const completeMaintenance = async (req, res) => {
    try {
        const maintenance = await closeMaintenanceRecord(req.params.id);

        if (!maintenance) {
            return res.status(404).json({ success: false, message: "Maintenance record not found or already completed" });
        }

        const populated = await Maintenance.findById(maintenance._id).populate(
            "vehicle",
            "registrationNumber vehicleName status"
        );

        return res.status(200).json({ success: true, message: "Maintenance completed", data: populated });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const deleteMaintenance = async (req, res) => {
    try {
        const record = await Maintenance.findByIdAndDelete(req.params.id);
        if (!record) return res.status(404).json({ success: false, message: "Maintenance record not found" });
        return res.status(200).json({ success: true, message: "Maintenance record deleted" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getMaintenance, createMaintenance, completeMaintenance, closeMaintenanceRecord, deleteMaintenance };
