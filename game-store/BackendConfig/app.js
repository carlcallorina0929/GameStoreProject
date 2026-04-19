const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const bodyParser = require("body-parser");

const userRoutes = require("./routes/userRoutes");

const app = express();

app.use(cors());
app.use(morgan("dev"));
app.use(bodyParser.json());

// app.use("/api/users", userRoutes);

// Health check
app.get("/", (req, res) => {
  res.send("API is running...");
});

module.exports = app;