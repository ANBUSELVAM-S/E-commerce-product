const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const path = require("path");
const serverless = require("serverless-http");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

process.env.PORT = process.env.ORDER_PORT || 5003;

const orderRoutes = require("./routes/orderRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Routes
app.use("/api/orders", orderRoutes);

// Health Check
app.get("/health", (req, res) => {
  res.json({
    success: true,
    service: "order-service",
  });
});

// Local Development
if (process.env.IS_LOCAL === "true") {
  const PORT = process.env.PORT || 5003;

  app.listen(PORT, () => {
    console.log(`Order Service Running On Port ${PORT}`);
  });
}

// Lambda Export
module.exports.handler = serverless(app);

//order successfully running.......