const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const registerUser = async (req, res) => {
  try {
    const { username, first_name, last_name, age, email, password } = req.body;

    // Validate input
    if (!username || !first_name || !last_name || !age || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }
        // Email validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  return res.status(400).json({ error: "Please enter a valid email address" });
}
// Password validation
const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
if (!passwordRegex.test(password)) {
  return res.status(400).json({ error: "Password must be at least 8 characters and include a capital letter and a number" });
}

    // Check if user already exists
    const existingUser = await User.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const existingUsername = await User.getUserByUsername(username);
    if (existingUsername) {
      return res.status(400).json({ error: "Username already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userData = {
      username,
      first_name,
      last_name,
      age,
      email,
      password: hashedPassword
    };

    await User.createUser(userData);

    // Generate JWT token
    const token = jwt.sign(
      { email, username },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: { username, email, first_name, last_name}
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { registerUser };