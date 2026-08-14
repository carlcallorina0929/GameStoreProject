const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const { setAuthCookie, clearAuthCookie } = require("../utils/jwtCookie");

const loginAdmin = async (req, res) => {
  try {
    const username = String(req.body.username ?? "").trim();
    const password = String(req.body.password ?? "");

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const adminUser = await User.getAdminByUsername(username);
    if (!adminUser) {
      return res.status(401).json({ error: "Invalid Username or Password" });
    }

    const isPasswordValid = await bcrypt.compare(password, adminUser.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid Username or Password" });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: "Server misconfiguration: JWT_SECRET is not set" });
    }

    const token = jwt.sign(
      { userId: adminUser.id, role: adminUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    );

    setAuthCookie(res, "admin_token", token);

    return res.json({
      message: "Admin login successful",
      user: {
        id: adminUser.id,
        username: adminUser.username,
        role: adminUser.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getCurrentAdmin = async (req, res) => {
  try {
    const adminUser = await User.getUserById(req.user?.userId ?? req.user?.id);
    if (!adminUser || adminUser.role !== "admin" || !adminUser.isActive) {
      return res.status(403).json({ error: "Forbidden" });
    }

    return res.json({
      user: {
        id: adminUser.id,
        username: adminUser.username,
        role: adminUser.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

const logoutAdmin = async (req, res) => {
  clearAuthCookie(res, "admin_token");
  return res.json({ message: "Logged out successfully" });
};

module.exports = {
  loginAdmin,
  getCurrentAdmin,
  logoutAdmin,
};