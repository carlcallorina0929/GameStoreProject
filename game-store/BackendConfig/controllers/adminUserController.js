const bcrypt = require("bcrypt");
const User = require("../models/userModel");
const {
  usernameRegex,
  nameRegex,
  emailRegex,
  passwordRegex,
} = require("../utils/validationPatterns");

const parseBoolean = (value, fallback = false) => {
  if (value === undefined || value === null) return fallback;
  return String(value).toLowerCase() === "true" || String(value) === "1";
};

const normalizeRole = (value) => {
  const role = String(value ?? "user").trim().toLowerCase();
  return role === "admin" ? "admin" : "user";
};

const listUsers = async (req, res) => {
  try {
    const page = Math.max(Number.parseInt(String(req.query.page ?? "1"), 10) || 1, 1);
    const limit = Math.min(
      Math.max(Number.parseInt(String(req.query.limit ?? "10"), 10) || 10, 1),
      100,
    );
    const includeInactive = parseBoolean(req.query.includeInactive, true);
    const search = String(req.query.search ?? "").trim();

    const result = await User.getUsersPaginated({ page, limit, includeInactive, search });

    return res.json({
      data: result.users,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit) || 1,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

const createUser = async (req, res) => {
  try {
    const username = String(req.body.username ?? "").trim();
    const first_name = String(req.body.first_name ?? "").trim();
    const last_name = String(req.body.last_name ?? "").trim();
    const age = Number.parseInt(String(req.body.age ?? ""), 10);
    const email = String(req.body.email ?? "").trim();
    const password = String(req.body.password ?? "");
    const role = normalizeRole(req.body.role);

    if (!username || !first_name || !last_name || !email || !password || Number.isNaN(age)) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (!usernameRegex.test(username)) {
      return res.status(400).json({ error: "Invalid username format" });
    }
    if (!nameRegex.test(first_name) || !nameRegex.test(last_name)) {
      return res.status(400).json({ error: "Names must contain letters only" });
    }
    if (age < 1 || age > 120) {
      return res.status(400).json({ error: "Age must be between 1 and 120" });
    }
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        error: "Password must be at least 8 chars and include 1 uppercase and 1 number",
      });
    }

    const existingEmail = await User.getUserByEmail(email);
    if (existingEmail) {
      return res.status(400).json({ error: "Email already exists" });
    }
    const existingUsername = await User.getUserByUsername(username);
    if (existingUsername) {
      return res.status(400).json({ error: "Username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await User.createAdminUser({
      username,
      first_name,
      last_name,
      age,
      email,
      password: hashedPassword,
      role,
    });

    return res.status(201).json({
      message: "User created successfully",
      userId: result.insertId,
    });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

const updateUser = async (req, res) => {
  try {
    const userId = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user id" });
    }

    const existing = await User.getUserById(userId);
    if (!existing) {
      return res.status(404).json({ error: "User not found" });
    }

    const payload = {};

    if (req.body.username !== undefined) {
      const username = String(req.body.username).trim();
      if (!usernameRegex.test(username)) {
        return res.status(400).json({ error: "Invalid username format" });
      }
      const usernameOwner = await User.getUserByUsername(username);
      if (usernameOwner && usernameOwner.id !== userId) {
        return res.status(400).json({ error: "Username already exists" });
      }
      payload.username = username;
    }

    if (req.body.first_name !== undefined) {
      const first_name = String(req.body.first_name).trim();
      if (!nameRegex.test(first_name)) {
        return res.status(400).json({ error: "First name must contain letters only" });
      }
      payload.first_name = first_name;
    }

    if (req.body.last_name !== undefined) {
      const last_name = String(req.body.last_name).trim();
      if (!nameRegex.test(last_name)) {
        return res.status(400).json({ error: "Last name must contain letters only" });
      }
      payload.last_name = last_name;
    }

    if (req.body.age !== undefined) {
      const age = Number.parseInt(String(req.body.age), 10);
      if (Number.isNaN(age) || age < 1 || age > 120) {
        return res.status(400).json({ error: "Age must be between 1 and 120" });
      }
      payload.age = age;
    }

    if (req.body.email !== undefined) {
      const email = String(req.body.email).trim();
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }
      const emailOwner = await User.getUserByEmail(email);
      if (emailOwner && emailOwner.id !== userId) {
        return res.status(400).json({ error: "Email already exists" });
      }
      payload.email = email;
    }

    if (req.body.role !== undefined) {
      payload.role = normalizeRole(req.body.role);
    }

    if (req.body.isActive !== undefined) {
      payload.isActive = parseBoolean(req.body.isActive, true);
    }

    if (req.body.password !== undefined && String(req.body.password).length > 0) {
      const password = String(req.body.password);
      if (!passwordRegex.test(password)) {
        return res.status(400).json({
          error: "Password must be at least 8 chars and include 1 uppercase and 1 number",
        });
      }
      payload.password = await bcrypt.hash(password, 10);
    }

    await User.updateUserById(userId, payload);
    return res.json({ message: "User updated successfully" });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

const softDeleteUser = async (req, res) => {
  try {
    const userId = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user id" });
    }

    const existing = await User.getUserById(userId);
    if (!existing) {
      return res.status(404).json({ error: "User not found" });
    }

    await User.softDeleteUserById(userId);
    return res.json({ message: "User soft deleted successfully" });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  listUsers,
  createUser,
  updateUser,
  softDeleteUser,
};
