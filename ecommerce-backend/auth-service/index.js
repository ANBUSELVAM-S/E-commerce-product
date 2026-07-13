require("dotenv").config();

const express = require("express");
const cors = require("cors");
const serverless = require("serverless-http");

const authRoutes = require("./src/routes/authRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    service: "auth-service"
  });
});

// For Lambda
module.exports.handler = serverless(app);

// For Local Development
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5005;
  app.listen(PORT, () => {
    console.log(`Auth Service running on ${PORT}`);
  });
}