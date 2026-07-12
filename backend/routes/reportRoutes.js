const express = require("express");
const { getAnalytics, getDashboardKpis } = require("../controllers/reportController");
const { allowRoles, protect } = require("../middleware/auth");

const router = express.Router();

router.get("/dashboard/kpis", protect, getDashboardKpis);
router.get("/analytics", protect, allowRoles("FleetManager", "FinancialAnalyst", "SafetyOfficer"), getAnalytics);

module.exports = router;
