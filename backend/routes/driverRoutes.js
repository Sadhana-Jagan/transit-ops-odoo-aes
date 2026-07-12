const express = require("express");
const { createDriver, getDrivers, updateDriverStatus, updateDriver, deleteDriver } = require("../controllers/driverController");
const { allowRoles, protect } = require("../middleware/auth");

const router = express.Router();

router.get("/", protect, getDrivers);
router.post("/", protect, allowRoles("FleetManager", "SafetyOfficer"), createDriver);
router.patch("/:id/status", protect, allowRoles("FleetManager", "SafetyOfficer", "Dispatcher"), updateDriverStatus);
router.put("/:id", protect, allowRoles("FleetManager", "SafetyOfficer"), updateDriver);
router.delete("/:id", protect, allowRoles("FleetManager", "SafetyOfficer"), deleteDriver);

module.exports = router;
