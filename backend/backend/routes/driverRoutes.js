const express = require("express");
const { createDriver, getDrivers, updateDriverStatus } = require("../controllers/driverController");
const { allowRoles, protect } = require("../middleware/auth");

const router = express.Router();

router.get("/", protect, getDrivers);
router.post("/", protect, allowRoles("FleetManager", "SafetyOfficer"), createDriver);
router.patch("/:id/status", protect, allowRoles("FleetManager", "SafetyOfficer", "Dispatcher"), updateDriverStatus);

module.exports = router;
