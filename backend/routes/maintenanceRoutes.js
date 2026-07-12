const express = require("express");
const {
    completeMaintenance,
    createMaintenance,
    getMaintenance,
} = require("../controllers/maintenanceController");
const { allowRoles, protect } = require("../middleware/auth");

const router = express.Router();

router.get("/", protect, getMaintenance);
router.post("/", protect, allowRoles("FleetManager"), createMaintenance);
router.patch("/:id/complete", protect, allowRoles("FleetManager"), completeMaintenance);

module.exports = router;
