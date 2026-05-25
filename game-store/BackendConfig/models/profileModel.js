const db = require("../config/db");

const Profile = {
  getUserById: async (id) => {
    const [rows] = await db.query("SELECT * FROM users WHERE id = ? LIMIT 1", [
      id,
    ]);
    return rows[0];
  },

  getSafeProfileById: async (id) => {
    const [rows] = await db.query(
      `SELECT id, username, first_name, last_name, age, email, role, created_at
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [id],
    );
    return rows[0];
  },

  getUserIdByUsername: async (username) => {
    const [rows] = await db.query(
      "SELECT id FROM users WHERE username = ? LIMIT 1",
      [username],
    );
    return rows[0];
  },

  getUserIdByEmail: async (email) => {
    const [rows] = await db.query("SELECT id FROM users WHERE email = ? LIMIT 1", [
      email,
    ]);
    return rows[0];
  },

  getOtherUserIdByUsername: async (username, currentUserId) => {
    const [rows] = await db.query(
      "SELECT id FROM users WHERE username = ? AND id <> ? LIMIT 1",
      [username, currentUserId],
    );
    return rows[0];
  },

  getOtherUserIdByEmail: async (email, currentUserId) => {
    const [rows] = await db.query(
      "SELECT id FROM users WHERE email = ? AND id <> ? LIMIT 1",
      [email, currentUserId],
    );
    return rows[0];
  },

  updateUsernameEmailById: async (id, updates) => {
    const fields = [];
    const values = [];

    if (updates.username !== undefined) {
      fields.push("username = ?");
      values.push(updates.username);
    }

    if (updates.email !== undefined) {
      fields.push("email = ?");
      values.push(updates.email);
    }

    if (fields.length === 0) {
      return { affectedRows: 0 };
    }

    const query = `UPDATE users SET ${fields.join(", ")} WHERE id = ?`;
    values.push(id);

    const [result] = await db.query(query, values);
    return result;
  },

  updatePasswordHashById: async (id, passwordHash) => {
    const [result] = await db.query("UPDATE users SET password = ? WHERE id = ?", [
      passwordHash,
      id,
    ]);
    return result;
  },
};

module.exports = Profile;

