const express = require("express");
const { createTrip, getTrips, updateTripStatus } = require("../controllers/tripController");
const { allowRoles, protect } = require("../middleware/auth");

const router = express.Router();

router.get("/", protect, getTrips);
router.post("/", protect, allowRoles("Dispatcher", "Driver"), createTrip);
router.patch("/:id/status", protect, allowRoles("Dispatcher", "Driver"), updateTripStatus);

module.exports = router;
