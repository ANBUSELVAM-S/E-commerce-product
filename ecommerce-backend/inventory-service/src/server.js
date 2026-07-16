const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const path = require("path");
const serverless = require("serverless-http");

// Load environment variables from root .env file
dotenv.config({
  path: path.resolve(__dirname, "../../.env")
});

const inventoryRoutes = require("./routes/inventoryRoutes");

const app = express();

// ----------------------------------------------------
// Middleware
// ----------------------------------------------------
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// ----------------------------------------------------
// Inventory Routes
// ----------------------------------------------------
app.use("/api/inventory", inventoryRoutes);

// ----------------------------------------------------
// Health Check
// GET /health
// ----------------------------------------------------
app.get("/health", (req, res) => {
  return res.status(200).json({
    status: "ok",
    service: "inventory-service"
  });
});

// ----------------------------------------------------
// Test Route
// GET /test
// ----------------------------------------------------
app.get("/test", (req, res) => {
  return res.status(200).send(
    "Inventory Service Working"
  );
});

// ----------------------------------------------------
// Local Development
// ----------------------------------------------------
const PORT =
  process.env.INVENTORY_PORT || 5007;

if (process.env.IS_LOCAL === "true") {
  app.listen(PORT, () => {
    console.log(
      `Inventory service running on port ${PORT}`
    );
  });
}

// ----------------------------------------------------
// Local Export
// ----------------------------------------------------
module.exports = app;

// ----------------------------------------------------
// AWS Lambda Export
// Lambda handler: server.handler
// ----------------------------------------------------
module.exports.handler = serverless(app);