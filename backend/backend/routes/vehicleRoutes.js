const express = require("express");
const { createVehicle, getVehicles, updateVehicleStatus } = require("../controllers/vehicleController");
const { allowRoles, protect } = require("../middleware/auth");

const router = express.Router();

router.get("/", protect, getVehicles);
router.post("/", protect, allowRoles("FleetManager"), createVehicle);
router.patch("/:id/status", protect, allowRoles("FleetManager", "Dispatcher"), updateVehicleStatus);

module.exports = router;
