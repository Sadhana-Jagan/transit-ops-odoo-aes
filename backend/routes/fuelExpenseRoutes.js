const express = require("express");
const { addExpense, addFuelLog } = require("../controllers/fuelExpenseController");
const { allowRoles, protect } = require("../middleware/auth");

const router = express.Router();

router.post("/fuel-logs", protect, allowRoles("FleetManager", "Dispatcher", "FinancialAnalyst"), addFuelLog);
router.post("/expenses", protect, allowRoles("FleetManager", "FinancialAnalyst"), addExpense);

module.exports = router;
