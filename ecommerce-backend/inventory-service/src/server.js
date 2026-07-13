const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const path = require("path");
const serverless = require("serverless-http");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

process.env.PORT = process.env.INVENTORY_PORT || 5007;

const inventoryRoutes = require("./routes/inventoryRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/api/inventory", inventoryRoutes);

// Health Check
app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        service: "inventory-service"
    });
});

// Test Route
app.get("/test", (req, res) => {
    res.send("Inventory Service Working");
});

const PORT = process.env.PORT || 5007;

// Local Development
if (process.env.IS_LOCAL === "true") {
    app.listen(PORT, () => {
        console.log(`Inventory service running on port ${PORT}`);
    });
}

// Export for Local
module.exports = app;

// Export for AWS Lambda
module.exports.handler = serverless(app);