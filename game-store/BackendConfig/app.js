const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const path = require("path");

const userRoutes = require("./routes/userRoutes");

const app = express();

app.use("/images", express.static(path.join(__dirname, "images")));

app.use(cors());
app.use(morgan("dev"));
app.use(bodyParser.json());



// Health check
app.get("/", (req, res) => {
  res.send("API is running...");
});

app.use("/api/users", userRoutes);

module.exports = app;