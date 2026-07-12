const Driver = require("../models/Driver");
const Expense = require("../models/Expense");
const FuelLog = require("../models/FuelLog");
const Maintenance = require("../models/Maintanence");
const Trip = require("../models/Trip");
const Vehicle = require("../models/Vehicle");

const getDashboardKpis = async (_req, res) => {
    try {
        const [activeVehicles, availableVehicles, vehiclesInMaintenance, activeTrips, pendingTrips, driversOnDuty, totalVehicles] =
            await Promise.all([
                Vehicle.countDocuments({ status: { $in: ["Available", "OnTrip", "InShop"] } }),
                Vehicle.countDocuments({ status: "Available" }),
                Vehicle.countDocuments({ status: "InShop" }),
                Trip.countDocuments({ status: "Dispatched" }),
                Trip.countDocuments({ status: "Draft" }),
                Driver.countDocuments({ status: "OnTrip" }),
                Vehicle.countDocuments({ status: { $ne: "Retired" } }),
            ]);

        const onTripVehicles = await Vehicle.countDocuments({ status: "OnTrip" });
        const fleetUtilization = totalVehicles ? Number(((onTripVehicles / totalVehicles) * 100).toFixed(2)) : 0;

        return res.status(200).json({
            success: true,
            data: {
                activeVehicles,
                availableVehicles,
                vehiclesInMaintenance,
                activeTrips,
                pendingTrips,
                driversOnDuty,
                fleetUtilization,
            },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const getAnalytics = async (_req, res) => {
    try {
        const [vehicles, completedTrips, fuelLogs, expenses, maintenanceLogs] = await Promise.all([
            Vehicle.find(),
            Trip.find({ status: "Completed" }),
            FuelLog.find(),
            Expense.find(),
            Maintenance.find(),
        ]);

        const tripDistanceByVehicle = new Map();
        const tripRevenueByVehicle = new Map();

        completedTrips.forEach((trip) => {
            const vehicleId = trip.vehicle.toString();
            const totalDistance = (tripDistanceByVehicle.get(vehicleId) || 0) + Number(trip.actualDistance || trip.plannedDistance || 0);
            tripDistanceByVehicle.set(vehicleId, totalDistance);

            const totalRevenue = (tripRevenueByVehicle.get(vehicleId) || 0) + Number(trip.revenue || 0);
            tripRevenueByVehicle.set(vehicleId, totalRevenue);
        });

        const fuelByVehicle = new Map();
        const fuelCostByVehicle = new Map();
        fuelLogs.forEach((log) => {
            const vehicleId = log.vehicle.toString();
            fuelByVehicle.set(vehicleId, (fuelByVehicle.get(vehicleId) || 0) + Number(log.liters || 0));
            fuelCostByVehicle.set(vehicleId, (fuelCostByVehicle.get(vehicleId) || 0) + Number(log.cost || 0));
        });

        const maintenanceByVehicle = new Map();
        maintenanceLogs.forEach((m) => {
            const vehicleId = m.vehicle.toString();
            maintenanceByVehicle.set(vehicleId, (maintenanceByVehicle.get(vehicleId) || 0) + Number(m.cost || 0));
        });

        const otherExpenseByVehicle = new Map();
        expenses.forEach((e) => {
            const vehicleId = e.vehicle.toString();
            otherExpenseByVehicle.set(vehicleId, (otherExpenseByVehicle.get(vehicleId) || 0) + Number(e.totalCost || 0));
        });

        const fuelEfficiency = vehicles.map((vehicle) => {
            const id = vehicle._id.toString();
            const distance = tripDistanceByVehicle.get(id) || 0;
            const liters = fuelByVehicle.get(id) || 0;
            return {
                vehicleId: vehicle._id,
                registrationNumber: vehicle.registrationNumber,
                distance,
                liters,
                kmPerLiter: liters ? Number((distance / liters).toFixed(2)) : 0,
            };
        });

        const activeVehicles = vehicles.filter((v) => v.status !== "Retired").length;
        const onTripVehicles = vehicles.filter((v) => v.status === "OnTrip").length;
        const fleetUtilization = activeVehicles ? Number(((onTripVehicles / activeVehicles) * 100).toFixed(2)) : 0;

        const operationalCostByVehicle = vehicles.map((vehicle) => {
            const id = vehicle._id.toString();
            const fuelCost = fuelCostByVehicle.get(id) || 0;
            const maintenanceCost = maintenanceByVehicle.get(id) || 0;
            const otherCost = otherExpenseByVehicle.get(id) || 0;
            return {
                vehicleId: vehicle._id,
                registrationNumber: vehicle.registrationNumber,
                fuelCost,
                maintenanceCost,
                otherCost,
                totalOperationalCost: Number((fuelCost + maintenanceCost + otherCost).toFixed(2)),
            };
        });

        const vehicleRoi = vehicles.map((vehicle) => {
            const id = vehicle._id.toString();
            const revenue = tripRevenueByVehicle.get(id) || 0;
            const maintenanceCost = maintenanceByVehicle.get(id) || 0;
            const fuelCost = fuelCostByVehicle.get(id) || 0;
            const acquisitionCost = Number(vehicle.acquisitionCost || 0);
            const roi = acquisitionCost
                ? Number(((revenue - (maintenanceCost + fuelCost)) / acquisitionCost).toFixed(4))
                : 0;

            return {
                vehicleId: vehicle._id,
                registrationNumber: vehicle.registrationNumber,
                revenue,
                maintenanceCost,
                fuelCost,
                acquisitionCost,
                roi,
            };
        });

        return res.status(200).json({
            success: true,
            data: {
                fuelEfficiency,
                fleetUtilization,
                operationalCost: operationalCostByVehicle,
                vehicleROI: vehicleRoi,
            },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getDashboardKpis, getAnalytics };
