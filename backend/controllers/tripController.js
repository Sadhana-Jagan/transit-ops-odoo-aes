const Driver = require("../models/Driver");
const Trip = require("../models/Trip");
const Vehicle = require("../models/Vehicle");
const FuelLog = require("../models/FuelLog");
const { mapTripStatus } = require("../utils/statusMappers");

const ensureDriverAndVehicleAvailable = async (driver, vehicle) => {
    if (["Retired", "InShop"].includes(vehicle.status)) {
        return "Retired or In Shop vehicles cannot be dispatched";
    }

    if (vehicle.status !== "Available") {
        return "Vehicle is not available";
    }

    if (driver.status !== "Available" || driver.safetyStatus === "Suspended") {
        return "Driver is not available for dispatch";
    }

    if (new Date(driver.licenseExpiry) < new Date()) {
        return "Driver license is expired";
    }

    return null;
};

const getTrips = async (_req, res) => {
    try {
        const trips = await Trip.find()
            .populate("vehicle", "registrationNumber vehicleName status maxLoadCapacity")
            .populate("driver", "name licenseNumber status safetyStatus")
            .sort({ createdAt: -1 });

        return res.status(200).json({ success: true, count: trips.length, data: trips });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const createTrip = async (req, res) => {
    try {
        const {
            source,
            destination,
            vehicleId,
            vehicleRegistrationNumber,
            driverId,
            driverLicenseNumber,
            cargoWeight,
            plannedDistance,
            status,
        } = req.body;

        if (!source || !destination || !cargoWeight || !plannedDistance) {
            return res.status(400).json({
                success: false,
                message: "source, destination, cargoWeight and plannedDistance are required",
            });
        }

        const vehicle = vehicleId
            ? await Vehicle.findById(vehicleId)
            : await Vehicle.findOne({ registrationNumber: (vehicleRegistrationNumber || "").toUpperCase() });

        const driver = driverId
            ? await Driver.findById(driverId)
            : await Driver.findOne({ licenseNumber: driverLicenseNumber });

        if (!vehicle) return res.status(404).json({ success: false, message: "Vehicle not found" });
        if (!driver) return res.status(404).json({ success: false, message: "Driver not found" });

        if (Number(cargoWeight) > Number(vehicle.maxLoadCapacity)) {
            return res.status(400).json({
                success: false,
                message: "Cargo weight exceeds vehicle maximum load capacity",
            });
        }

        const targetStatus = mapTripStatus(status || "Dispatched");
        if (!targetStatus) {
            return res.status(400).json({ success: false, message: "Invalid trip status" });
        }

        if (targetStatus === "Dispatched") {
            const reason = await ensureDriverAndVehicleAvailable(driver, vehicle);
            if (reason) {
                return res.status(400).json({ success: false, message: reason });
            }

            const activeAssignment = await Trip.findOne({
                status: "Dispatched",
                $or: [{ vehicle: vehicle._id }, { driver: driver._id }],
            });

            if (activeAssignment) {
                return res.status(400).json({
                    success: false,
                    message: "Driver or vehicle is already assigned to another active trip",
                });
            }
        }

        const trip = await Trip.create({
            source,
            destination,
            vehicle: vehicle._id,
            driver: driver._id,
            cargoWeight,
            plannedDistance,
            status: targetStatus,
            dispatchTime: targetStatus === "Dispatched" ? new Date() : null,
        });

        if (targetStatus === "Dispatched") {
            await Vehicle.findByIdAndUpdate(vehicle._id, { status: "OnTrip" });
            await Driver.findByIdAndUpdate(driver._id, { status: "OnTrip", safetyStatus: "OnTrip" });
        }

        const populated = await Trip.findById(trip._id)
            .populate("vehicle", "registrationNumber vehicleName status")
            .populate("driver", "name licenseNumber status");

        return res.status(201).json({ success: true, message: "Trip created", data: populated });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const updateTripStatus = async (req, res) => {
    try {
        const { status, finalOdometer, fuelConsumed, actualDistance, revenue } = req.body;

        const mappedStatus = mapTripStatus(status);
        if (!mappedStatus) {
            return res.status(400).json({ success: false, message: "Invalid trip status" });
        }

        const trip = await Trip.findById(req.params.id).populate("vehicle").populate("driver");
        if (!trip) {
            return res.status(404).json({ success: false, message: "Trip not found" });
        }

        if (["Completed", "Cancelled"].includes(trip.status)) {
            return res.status(400).json({ success: false, message: `Trip is already ${trip.status}` });
        }

        if (mappedStatus === "Dispatched") {
            if (trip.status !== "Draft") {
                return res.status(400).json({ success: false, message: "Only Draft trips can be dispatched" });
            }

            const reason = await ensureDriverAndVehicleAvailable(trip.driver, trip.vehicle);
            if (reason) {
                return res.status(400).json({ success: false, message: reason });
            }

            trip.status = "Dispatched";
            trip.dispatchTime = new Date();
            await trip.save();

            await Vehicle.findByIdAndUpdate(trip.vehicle._id, { status: "OnTrip" });
            await Driver.findByIdAndUpdate(trip.driver._id, { status: "OnTrip", safetyStatus: "OnTrip" });

            return res.status(200).json({ success: true, message: "Trip dispatched", data: trip });
        }

        if (mappedStatus === "Completed") {
            trip.status = "Completed";
            trip.completionTime = new Date();
            if (finalOdometer != null) trip.finalOdometer = finalOdometer;
            if (fuelConsumed != null) trip.fuelConsumed = fuelConsumed;
            if (actualDistance != null) trip.actualDistance = actualDistance;
            if (revenue != null) trip.revenue = revenue;
            await trip.save();

            await Vehicle.findByIdAndUpdate(trip.vehicle._id, {
                status: trip.vehicle.status === "Retired" ? "Retired" : "Available",
                ...(finalOdometer != null ? { odometer: finalOdometer } : {}),
            });

            await Driver.findByIdAndUpdate(trip.driver._id, {
                status: "Available",
                safetyStatus: "Available",
                $inc: { tripCompletion: 1 },
            });

            // Record fuel usage as a fuel log so analytics stay consistent regardless of caller role.
            if (fuelConsumed != null && Number(fuelConsumed) > 0) {
                await FuelLog.create({
                    vehicle: trip.vehicle._id,
                    trip: trip._id,
                    liters: Number(fuelConsumed),
                    cost: Math.round(Number(fuelConsumed) * 1.8),
                });
            }

            return res.status(200).json({ success: true, message: "Trip completed", data: trip });
        }

        if (mappedStatus === "Cancelled") {
            trip.status = "Cancelled";
            await trip.save();

            await Vehicle.findByIdAndUpdate(trip.vehicle._id, {
                status: trip.vehicle.status === "Retired" ? "Retired" : "Available",
            });
            await Driver.findByIdAndUpdate(trip.driver._id, { status: "Available", safetyStatus: "Available" });

            return res.status(200).json({ success: true, message: "Trip cancelled", data: trip });
        }

        return res.status(400).json({ success: false, message: "Unsupported status transition" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getTrips, createTrip, updateTripStatus };
