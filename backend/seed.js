/**
 * Seed script — creates demo users + sample fleet data.
 * Run with:  npm run seed
 */
const dotenv = require("dotenv");
const mongoose = require("mongoose");

const connectDB = require("./config/db");
const User = require("./models/User");
const Vehicle = require("./models/Vehicle");
const Driver = require("./models/Driver");
const Trip = require("./models/Trip");
const Maintenance = require("./models/Maintanence");
const FuelLog = require("./models/FuelLog");
const Expense = require("./models/Expense");

dotenv.config();

const daysFromNow = (n) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d;
};

const demoUsers = [
    { name: "Morgan Reed", email: "manager@transitops.io", password: "demo123", role: "FleetManager" },
    { name: "Alex Turner", email: "driver@transitops.io", password: "demo123", role: "Driver" },
    { name: "Sam Okoye", email: "safety@transitops.io", password: "demo123", role: "SafetyOfficer" },
    { name: "Priya Nair", email: "finance@transitops.io", password: "demo123", role: "FinancialAnalyst" },
    { name: "Dana Cole", email: "dispatch@transitops.io", password: "demo123", role: "Dispatcher" },
];

const vehicles = [
    { registrationNumber: "VAN-05", vehicleName: "Ford Transit", vehicleType: "Van", maxLoadCapacity: 500, odometer: 84200, acquisitionCost: 32000, revenue: 21000, region: "North", status: "Available" },
    { registrationNumber: "TRK-11", vehicleName: "Volvo FH16", vehicleType: "Truck", maxLoadCapacity: 24000, odometer: 152300, acquisitionCost: 128000, revenue: 96000, region: "East", status: "OnTrip" },
    { registrationNumber: "BUS-02", vehicleName: "Mercedes Sprinter", vehicleType: "Bus", maxLoadCapacity: 3500, odometer: 62100, acquisitionCost: 68000, revenue: 44000, region: "West", status: "InShop" },
    { registrationNumber: "VAN-08", vehicleName: "Renault Master", vehicleType: "Van", maxLoadCapacity: 1200, odometer: 41000, acquisitionCost: 29000, revenue: 15000, region: "North", status: "Available" },
    { registrationNumber: "TRK-21", vehicleName: "Scania R450", vehicleType: "Truck", maxLoadCapacity: 18000, odometer: 210500, acquisitionCost: 115000, revenue: 132000, region: "South", status: "Retired" },
    { registrationNumber: "PKP-03", vehicleName: "Toyota Hilux", vehicleType: "Pickup", maxLoadCapacity: 1000, odometer: 33400, acquisitionCost: 34000, revenue: 12000, region: "East", status: "Available" },
];

const drivers = [
    { name: "Alex Turner", licenseNumber: "DL-88213", licenseCategory: "C", licenseExpiry: daysFromNow(220), contactNumber: "+91 98765 43210", tripCompletion: 128, safetyScore: "High", status: "OnTrip", safetyStatus: "OnTrip" },
    { name: "Jordan Blake", licenseNumber: "DL-77410", licenseCategory: "B", licenseExpiry: daysFromNow(40), contactNumber: "+91 98220 11983", tripCompletion: 74, safetyScore: "High", status: "Available", safetyStatus: "Available" },
    { name: "Casey Lin", licenseNumber: "DL-55102", licenseCategory: "D", licenseExpiry: daysFromNow(-12), contactNumber: "+91 90011 22110", tripCompletion: 45, safetyScore: "Medium", status: "Available", safetyStatus: "Available" },
    { name: "Devon Marsh", licenseNumber: "DL-93021", licenseCategory: "C", licenseExpiry: daysFromNow(510), contactNumber: "+91 99887 71770", tripCompletion: 203, safetyScore: "High", status: "Available", safetyStatus: "Available" },
    { name: "Riley Cross", licenseNumber: "DL-31288", licenseCategory: "B", licenseExpiry: daysFromNow(15), contactNumber: "+91 98111 65650", tripCompletion: 12, safetyScore: "Medium", status: "Suspended", safetyStatus: "Suspended" },
    { name: "Taylor Quinn", licenseNumber: "DL-44900", licenseCategory: "C", licenseExpiry: daysFromNow(300), contactNumber: "+91 97654 32100", tripCompletion: 88, safetyScore: "High", status: "OffDuty", safetyStatus: "Available" },
];

const run = async () => {
    await connectDB();

    await Promise.all([
        User.deleteMany({}),
        Vehicle.deleteMany({}),
        Driver.deleteMany({}),
        Trip.deleteMany({}),
        Maintenance.deleteMany({}),
        FuelLog.deleteMany({}),
        Expense.deleteMany({}),
    ]);

    // Users must be created individually so the pre-save hook hashes passwords
    for (const u of demoUsers) {
        // eslint-disable-next-line no-await-in-loop
        await User.create(u);
    }

    const createdVehicles = await Vehicle.create(vehicles);
    const createdDrivers = await Driver.create(drivers);

    const vByReg = Object.fromEntries(createdVehicles.map((v) => [v.registrationNumber, v]));
    const dByLic = Object.fromEntries(createdDrivers.map((d) => [d.licenseNumber, d]));

    const trips = await Trip.create([
        { source: "Chicago Depot", destination: "Detroit Hub", vehicle: vByReg["TRK-11"]._id, driver: dByLic["DL-88213"]._id, cargoWeight: 15000, plannedDistance: 460, status: "Dispatched", dispatchTime: new Date() },
        { source: "Boston DC", destination: "Albany Warehouse", vehicle: vByReg["VAN-05"]._id, driver: dByLic["DL-93021"]._id, cargoWeight: 420, plannedDistance: 270, actualDistance: 270, revenue: 4200, fuelConsumed: 34, finalOdometer: 84200, status: "Completed", completionTime: daysFromNow(-3) },
        { source: "Newark Port", destination: "Philadelphia", vehicle: vByReg["VAN-08"]._id, driver: dByLic["DL-77410"]._id, cargoWeight: 900, plannedDistance: 150, status: "Draft" },
    ]);

    await Maintenance.create([
        { vehicle: vByReg["BUS-02"]._id, maintenanceType: "Engine Overhaul", cost: 2400, serviceDate: daysFromNow(-2), description: "Coolant leak + belts", status: "Open" },
        { vehicle: vByReg["VAN-05"]._id, maintenanceType: "Oil Change", cost: 180, serviceDate: daysFromNow(-20), description: "Routine service", status: "Completed", closedAt: daysFromNow(-20) },
    ]);

    await FuelLog.create([
        { vehicle: vByReg["VAN-05"]._id, liters: 34, cost: 61, date: daysFromNow(-3) },
        { vehicle: vByReg["TRK-11"]._id, liters: 180, cost: 320, date: daysFromNow(-1) },
        { vehicle: vByReg["VAN-08"]._id, liters: 40, cost: 72, date: daysFromNow(-5) },
    ]);

    await Expense.create([
        { trip: trips[0]._id, vehicle: vByReg["TRK-11"]._id, tollFee: 450, otherFee: 200, maintenanceCost: 0, totalCost: 650, remarks: "I-94 tolls", date: daysFromNow(-1) },
        { trip: trips[1]._id, vehicle: vByReg["VAN-05"]._id, tollFee: 120, otherFee: 80, maintenanceCost: 0, totalCost: 200, remarks: "Overnight parking", date: daysFromNow(-3) },
    ]);

    console.log("Seed complete. Demo login: manager@transitops.io / demo123");
    await mongoose.connection.close();
    process.exit(0);
};

run().catch((err) => {
    console.error(err);
    process.exit(1);
});

