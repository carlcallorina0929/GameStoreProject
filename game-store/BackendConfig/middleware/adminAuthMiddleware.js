const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }
    return res.status(403).json({ error: "Invalid token" });
  }
};

const verifyAdminRole = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const userId = req.user.userId ?? req.user.id;
    const adminUser = await User.getUserById(userId);
    if (!adminUser || adminUser.role !== "admin" || !adminUser.isActive) {
      return res.status(403).json({ error: "Forbidden" });
    }

    next();
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  verifyToken,
  verifyAdminRole,
};
