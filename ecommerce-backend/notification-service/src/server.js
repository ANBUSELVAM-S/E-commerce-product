const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const path = require("path");
const serverless = require("serverless-http");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const notificationRoutes = require("./routes/notificationRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/api/notifications", notificationRoutes);

app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        service: "notification-service"
    });
});

//file created......

app.get("/test", (req, res) => {
    res.send("Notification Service Working");
});

// Local testing
if (process.env.IS_LOCAL === "true") {
    const PORT = process.env.NOTIFICATION_PORT || 5006;

    app.listen(PORT, () => {
        console.log(`Notification Service running on port ${PORT}`);
    });
}

module.exports = app;
module.exports.handler = serverless(app);
