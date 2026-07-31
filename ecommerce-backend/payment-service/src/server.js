const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const morgan = require("morgan");
const serverless = require("serverless-http");

dotenv.config({
  path: path.resolve(__dirname, "../../.env")
});

process.env.PORT = process.env.PAYMENT_PORT || 5004;

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/api/payments", require("./routes/paymentRoutes"));

app.get("/health", (req, res) => {
  res.json({
    success: true,
    service: "payment-service"
  });
});
//update for payment service

app.get("/test", (req, res) => {
  res.send("Payment Service Working");
});

// Local development only
// const PORT = process.env.PORT || 5004;
// app.listen(PORT, () => {
//   console.log(`Payment Service Running On Port ${PORT}`);
// });

module.exports.handler = serverless(app);