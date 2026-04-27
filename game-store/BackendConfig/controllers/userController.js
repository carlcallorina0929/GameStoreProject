const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const usernameRegex = /^[A-Za-z0-9_]{6,30}$/;
const nameRegex = /^[A-Za-z]+$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,64}$/;

const checkUsernameAvailability = async (req, res) => {
  try {
    const username = String(req.query.username ?? "").trim();
    if (!username) {
      return res.status(400).json({ error: "username query param is required" });
    }

    if (!usernameRegex.test(username)) {
      return res.status(400).json({ error: "username is invalid" });
    }

    const user = await User.getUserByUsername(username);
    return res.json({ available: !user });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

const checkEmailAvailability = async (req, res) => {
  try {
    const email = String(req.query.email ?? "").trim();
    if (!email) {
      return res.status(400).json({ error: "email query param is required" });
    }

    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "email is invalid" });
    }

    const user = await User.getUserByEmail(email);
    return res.json({ available: !user });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

const registerUser = async (req, res) => {
  try {
    const {
      username,
      first_name,
      last_name,
      firstName,
      lastName,
      age,
      email,
      password,
    } = req.body;

    const normalizedUsername = String(username ?? "").trim();
    const normalizedFirstName = String(first_name ?? firstName ?? "").trim();
    const normalizedLastName = String(last_name ?? lastName ?? "").trim();
    const normalizedEmail = String(email ?? "").trim();
    const normalizedPassword = String(password ?? "");
    const normalizedAge =
      typeof age === "string" ? Number.parseInt(age, 10) : age;

    if (
      !normalizedUsername ||
      !normalizedFirstName ||
      !normalizedLastName ||
      normalizedAge === undefined ||
      normalizedAge === null ||
      Number.isNaN(normalizedAge) ||
      !normalizedEmail ||
      !normalizedPassword
    ) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (!usernameRegex.test(normalizedUsername)) {
      return res.status(400).json({
        error:
          "Username must be 3-20 characters and can only contain letters, numbers, and underscores",
      });
    }

    if (!nameRegex.test(normalizedFirstName)) {
      return res.status(400).json({
        error: "First name must contain letters only (1-50)",
      });
    }

    if (!nameRegex.test(normalizedLastName)) {
      return res.status(400).json({
        error: "Last name must contain letters only (1-50)",
      });
    }

    if (normalizedAge < 1 || normalizedAge > 120) {
      return res.status(400).json({ error: "Age must be between 1 and 120" });
    }

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    if (!passwordRegex.test(normalizedPassword)) {
      return res.status(400).json({
        error:
          "Password must be at least 8 characters and include at least 1 capital letter and 1 number",
      });
    }

    const existingUser = await User.getUserByEmail(normalizedEmail);
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const existingUsername = await User.getUserByUsername(normalizedUsername);
    if (existingUsername) {
      return res.status(400).json({ error: "Username already exists" });
    }

    const hashedPassword = await bcrypt.hash(normalizedPassword, 10);

    const userData = {
      username: normalizedUsername,
      first_name: normalizedFirstName,
      last_name: normalizedLastName,
      age: normalizedAge,
      email: normalizedEmail,
      password: hashedPassword,
    };

    const result = await User.createUser(userData);
    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: result.insertId,
        username: normalizedUsername,
        first_name: normalizedFirstName,
        last_name: normalizedLastName,
        age: normalizedAge,
        email: normalizedEmail,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

const loginUser = async (req, res) => {
  try {
    const username = String(req.body.username ?? "").trim();
    const password = String(req.body.password ?? "");

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const user = await User.getUserByUsername(username);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid Username or Password" });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: "Server misconfiguration: JWT_SECRET is not set" });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.json({ message: "Login successful", token });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  checkUsernameAvailability,
  checkEmailAvailability,
};
