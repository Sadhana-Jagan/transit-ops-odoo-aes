const Expense = require("../models/Expense");
const FuelLog = require("../models/FuelLog");
const Maintenance = require("../models/Maintanence");
const Trip = require("../models/Trip");
const Vehicle = require("../models/Vehicle");

const resolveVehicle = async (vehicleId, vehicleRegistrationNumber) => {
    if (vehicleId) return Vehicle.findById(vehicleId);
    if (vehicleRegistrationNumber) {
        return Vehicle.findOne({ registrationNumber: vehicleRegistrationNumber.toUpperCase() });
    }
    return null;
};

const addFuelLog = async (req, res) => {
    try {
        const { vehicleId, vehicleRegistrationNumber, tripId, liters, fuelCost, cost, date } = req.body;

        const vehicle = await resolveVehicle(vehicleId, vehicleRegistrationNumber);
        if (!vehicle) {
            return res.status(404).json({ success: false, message: "Vehicle not found" });
        }

        if (liters == null || (fuelCost == null && cost == null)) {
            return res.status(400).json({ success: false, message: "liters and fuelCost are required" });
        }

        let trip = null;
        if (tripId) {
            trip = await Trip.findById(tripId);
            if (!trip) {
                return res.status(404).json({ success: false, message: "Trip not found" });
            }
        }

        const fuelLog = await FuelLog.create({
            vehicle: vehicle._id,
            trip: trip?._id,
            liters,
            cost: fuelCost ?? cost,
            date: date || new Date(),
        });

        return res.status(201).json({ success: true, message: "Fuel log added", data: fuelLog });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const addExpense = async (req, res) => {
    try {
        const { tripId, vehicleId, vehicleRegistrationNumber, tollFee = 0, otherFee = 0, maintenanceCost, remarks, date } = req.body;

        const vehicle = await resolveVehicle(vehicleId, vehicleRegistrationNumber);
        if (!vehicle) {
            return res.status(404).json({ success: false, message: "Vehicle not found" });
        }

        let trip = null;
        if (tripId) {
            trip = await Trip.findById(tripId);
            if (!trip) {
                return res.status(404).json({ success: false, message: "Trip not found" });
            }
        }

        let resolvedMaintenanceCost = maintenanceCost;
        if (resolvedMaintenanceCost == null) {
            const maintenanceAgg = await Maintenance.aggregate([
                { $match: { vehicle: vehicle._id } },
                { $group: { _id: null, total: { $sum: "$cost" } } },
            ]);
            resolvedMaintenanceCost = maintenanceAgg[0]?.total || 0;
        }

        const totalCost = Number(tollFee) + Number(otherFee) + Number(resolvedMaintenanceCost);

        const expense = await Expense.create({
            trip: trip?._id,
            vehicle: vehicle._id,
            tollFee,
            otherFee,
            maintenanceCost: resolvedMaintenanceCost,
            totalCost,
            remarks,
            date: date || new Date(),
        });

        return res.status(201).json({ success: true, message: "Expense added", data: expense });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const getFuelLogs = async (_req, res) => {
    try {
        const logs = await FuelLog.find()
            .populate("vehicle", "registrationNumber vehicleName")
            .sort({ createdAt: -1 });
        return res.status(200).json({ success: true, count: logs.length, data: logs });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const getExpenses = async (_req, res) => {
    try {
        const expenses = await Expense.find()
            .populate("vehicle", "registrationNumber vehicleName")
            .populate("trip", "source destination")
            .sort({ createdAt: -1 });
        return res.status(200).json({ success: true, count: expenses.length, data: expenses });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const deleteFuelLog = async (req, res) => {
    try {
        const log = await FuelLog.findByIdAndDelete(req.params.id);
        if (!log) return res.status(404).json({ success: false, message: "Fuel log not found" });
        return res.status(200).json({ success: true, message: "Fuel log deleted" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const deleteExpense = async (req, res) => {
    try {
        const expense = await Expense.findByIdAndDelete(req.params.id);
        if (!expense) return res.status(404).json({ success: false, message: "Expense not found" });
        return res.status(200).json({ success: true, message: "Expense deleted" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { addFuelLog, addExpense, getFuelLogs, getExpenses, deleteFuelLog, deleteExpense };
