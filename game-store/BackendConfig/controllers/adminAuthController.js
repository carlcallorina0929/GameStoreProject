const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

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

    return res.json({
      message: "Admin login successful",
      token,
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

module.exports = {
  loginAdmin,
};
