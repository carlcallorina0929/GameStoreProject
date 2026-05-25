const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const path = require("path");

const userRoutes = require("./routes/userRoutes");
const cartRoutes = require("./routes/cartRoutes");
const profileRoutes = require("./routes/profileRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const app = express();

// MAKE UPLOADS FOLDER PUBLIC (for images)
app.use("/uploads", express.static("uploads"));

// Enable CORS and explicitly allow Authorization header and credentials
app.use(cors({
  origin: true,
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan("dev"));
app.use(bodyParser.json());

// ROUTES
const gameRoutes = require("./routes/gameRoutes");
const libraryRoutes = require("./routes/libraryRoutes");
const orderRoutes = require("./routes/orderRoutes");
const checkoutRoutes = require("./routes/checkoutRoutes");
app.use("/api/users", userRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/settings", settingsRoutes);

app.use("/api/games", gameRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/library", libraryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/checkout", checkoutRoutes);

// Health check
app.get("/", (req, res) => {
  res.send("API is running...");
});



module.exports = app;
