const normalize = (value = "") => value.toString().toLowerCase().replace(/[_\s-]/g, "");

const vehicleStatusMap = {
    available: "Available",
    ontrip: "OnTrip",
    inshop: "InShop",
    retired: "Retired",
};

const driverStatusMap = {
    available: "Available",
    ontrip: "OnTrip",
    offduty: "OffDuty",
    suspended: "Suspended",
};

const driverSafetyStatusMap = {
    available: "Available",
    ontrip: "OnTrip",
    suspended: "Suspended",
};

const tripStatusMap = {
    draft: "Draft",
    dispatched: "Dispatched",
    completed: "Completed",
    cancelled: "Cancelled",
};

const maintenanceStatusMap = {
    open: "Open",
    completed: "Completed",
};

const mapStatus = (value, map) => map[normalize(value)] || null;

module.exports = {
    mapVehicleStatus: (value) => mapStatus(value, vehicleStatusMap),
    mapDriverStatus: (value) => mapStatus(value, driverStatusMap),
    mapDriverSafetyStatus: (value) => mapStatus(value, driverSafetyStatusMap),
    mapTripStatus: (value) => mapStatus(value, tripStatusMap),
    mapMaintenanceStatus: (value) => mapStatus(value, maintenanceStatusMap),
};