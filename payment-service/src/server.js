const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const morgan = require("morgan");
const path = require("path");
const serverless = require("serverless-http");

dotenv.config({
    path: path.resolve(__dirname, "../../.env")
});

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

module.exports.handler = serverless(app);