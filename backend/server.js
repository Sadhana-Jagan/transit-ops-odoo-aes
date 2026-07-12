const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const vehicleRoutes = require("./routes/vehicleRoutes");
const driverRoutes = require("./routes/driverRoutes");
const tripRoutes = require("./routes/tripRoutes");
const maintenanceRoutes = require("./routes/maintenanceRoutes");
const fuelExpenseRoutes = require("./routes/fuelExpenseRoutes");
const reportRoutes = require("./routes/reportRoutes");

dotenv.config();

const app = express();

connectDB();

app.use(
    cors({
        origin: true,
        credentials: true,
    })
);

app.use(express.json());

app.use(cookieParser());

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "TransitOps Backend Running..."
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/ops", fuelExpenseRoutes);
app.use("/api/reports", reportRoutes);

app.use((req, res) => {
    res.status(404).json({ success: false, message: "Route not found" });
});

app.use((err, _req, res, _next) => {
    res.status(err.status || 500).json({ success: false, message: err.message || "Server error" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});