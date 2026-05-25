const bcrypt = require("bcrypt");
const Profile = require("../models/profileModel");
const {
  usernameRegex,
  emailRegex,
  passwordRegex,
} = require("../utils/validationPatterns");

const getAuthedUserId = (req) => {
  const userId = req.user?.id;
  if (!userId || !Number.isFinite(Number(userId))) return null;
  return Number(userId);
};

const getProfile = async (req, res) => {
  try {
    const userId = getAuthedUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const profile = await Profile.getSafeProfileById(userId);
    if (!profile) return res.status(404).json({ error: "User not found" });

    return res.json({ user: profile });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = getAuthedUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const rawUsername = req.body?.username;
    const rawEmail = req.body?.email;

    const username =
      rawUsername === undefined ? undefined : String(rawUsername).trim();
    const email = rawEmail === undefined ? undefined : String(rawEmail).trim();

    if (username === undefined && email === undefined) {
      return res
        .status(400)
        .json({ error: "At least one field (username/email) is required" });
    }

    const updates = {};

    if (username !== undefined) {
      if (!username) return res.status(400).json({ error: "username is required" });
      if (!usernameRegex.test(username)) {
        return res.status(400).json({ error: "username is invalid" });
      }
      const conflict = await Profile.getOtherUserIdByUsername(username, userId);
      if (conflict) return res.status(400).json({ error: "Username already exists" });
      updates.username = username;
    }

    if (email !== undefined) {
      if (!email) return res.status(400).json({ error: "email is required" });
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "email is invalid" });
      }
      const conflict = await Profile.getOtherUserIdByEmail(email, userId);
      if (conflict) return res.status(400).json({ error: "Email already exists" });
      updates.email = email;
    }

    await Profile.updateUsernameEmailById(userId, updates);

    const profile = await Profile.getSafeProfileById(userId);
    return res.json({ message: "Profile updated", user: profile });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

const changePassword = async (req, res) => {
  try {
    const userId = getAuthedUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const currentPassword = String(req.body?.currentPassword ?? "");
    const newPassword = String(req.body?.newPassword ?? "");

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "currentPassword and newPassword are required" });
    }

    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        error:
          "Password must be at least 8 characters and include at least 1 capital letter and 1 number",
      });
    }

    const user = await Profile.getUserById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) return res.status(401).json({ error: "Current password is incorrect" });

    const newHash = await bcrypt.hash(newPassword, 10);
    await Profile.updatePasswordHashById(userId, newHash);

    return res.json({ message: "Password updated" });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
};
