const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const path = require("path");

const userRoutes = require("./routes/userRoutes");
const cartRoutes = require("./routes/cartRoutes");
const app = express();

// MAKE UPLOADS FOLDER PUBLIC (for images)
app.use("/uploads", express.static("uploads"));

app.use(cors());
app.use(morgan("dev"));
app.use(bodyParser.json());

// ROUTES
const gameRoutes = require("./routes/gameRoutes");
app.use("/api/games", gameRoutes);
app.use("/api/cart", cartRoutes);


// Health check
app.get("/", (req, res) => {
  res.send("API is running...");
});

app.use("/api/users", userRoutes);

module.exports = app;
