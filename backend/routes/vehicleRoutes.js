const express = require("express");
const { createVehicle, getVehicles, updateVehicleStatus, updateVehicle, deleteVehicle } = require("../controllers/vehicleController");
const { allowRoles, protect } = require("../middleware/auth");

const router = express.Router();

router.get("/", protect, getVehicles);
router.post("/", protect, allowRoles("FleetManager"), createVehicle);
router.patch("/:id/status", protect, allowRoles("FleetManager", "Dispatcher"), updateVehicleStatus);
router.put("/:id", protect, allowRoles("FleetManager"), updateVehicle);
router.delete("/:id", protect, allowRoles("FleetManager"), deleteVehicle);

module.exports = router;
