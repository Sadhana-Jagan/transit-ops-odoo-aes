const express = require("express");
const { addExpense, addFuelLog, getFuelLogs, getExpenses, deleteFuelLog, deleteExpense } = require("../controllers/fuelExpenseController");
const { allowRoles, protect } = require("../middleware/auth");

const router = express.Router();

router.get("/fuel-logs", protect, getFuelLogs);
router.post("/fuel-logs", protect, allowRoles("FleetManager", "Dispatcher", "FinancialAnalyst"), addFuelLog);
router.delete("/fuel-logs/:id", protect, allowRoles("FleetManager", "FinancialAnalyst"), deleteFuelLog);

router.get("/expenses", protect, getExpenses);
router.post("/expenses", protect, allowRoles("FleetManager", "FinancialAnalyst"), addExpense);
router.delete("/expenses/:id", protect, allowRoles("FleetManager", "FinancialAnalyst"), deleteExpense);

module.exports = router;
