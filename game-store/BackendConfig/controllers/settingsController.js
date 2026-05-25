const bcrypt = require("bcrypt");
const Settings = require("../models/settingsModel");
const {
  usernameRegex,
  emailRegex,
  passwordRegex,
} = require("../utils/validationPatterns");

const getUserId = (req) => {
  const userId = Number(req.user?.id);
  if (!Number.isFinite(userId) || userId <= 0) return null;
  return userId;
};

const getProfile = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const user = await Settings.getSafeProfileById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    return res.json({ user });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const usernameRaw = req.body?.username;
    const emailRaw = req.body?.email;
    const passwordRaw = req.body?.password;

    const username =
      usernameRaw === undefined ? undefined : String(usernameRaw).trim();
    const email = emailRaw === undefined ? undefined : String(emailRaw).trim();
    const password =
      passwordRaw === undefined ? undefined : String(passwordRaw).trim();

    if (username === undefined && email === undefined && password === undefined) {
      return res.status(400).json({
        error: "At least one field is required (username, email, password)",
      });
    }

    const updates = {};

    if (username !== undefined) {
      if (!usernameRegex.test(username)) {
        return res.status(400).json({ error: "username is invalid" });
      }

      const usernameOwner = await Settings.getOtherUserIdByUsername(
        username,
        userId,
      );
      if (usernameOwner) {
        return res.status(400).json({ error: "Username already exists" });
      }

      updates.username = username;
    }

    if (email !== undefined) {
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "email is invalid" });
      }

      const emailOwner = await Settings.getOtherUserIdByEmail(email, userId);
      if (emailOwner) {
        return res.status(400).json({ error: "Email already exists" });
      }

      updates.email = email;
    }

    if (password !== undefined) {
      if (!passwordRegex.test(password)) {
        return res.status(400).json({
          error:
            "Password must be at least 8 characters and include at least 1 capital letter and 1 number",
        });
      }
      updates.password = await bcrypt.hash(password, 10);
    }

    await Settings.updateProfileById(userId, updates);
    const user = await Settings.getSafeProfileById(userId);

    return res.json({
      message: "Profile updated",
      user,
    });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getTransactions = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const transactions = await Settings.getTransactionsByUserId(userId);
    return res.json({ transactions });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getTransactions,
};
