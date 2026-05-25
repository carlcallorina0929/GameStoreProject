const db = require("../config/db");

const Settings = {
  getSafeProfileById: async (userId) => {
    const [rows] = await db.query(
      `SELECT id, username, first_name, last_name, age, email, role, created_at
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [userId],
    );
    return rows[0];
  },

  getOtherUserIdByUsername: async (username, userId) => {
    const [rows] = await db.query(
      "SELECT id FROM users WHERE username = ? AND id <> ? LIMIT 1",
      [username, userId],
    );
    return rows[0];
  },

  getOtherUserIdByEmail: async (email, userId) => {
    const [rows] = await db.query(
      "SELECT id FROM users WHERE email = ? AND id <> ? LIMIT 1",
      [email, userId],
    );
    return rows[0];
  },

  updateProfileById: async (userId, updates) => {
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

    if (updates.password !== undefined) {
      fields.push("password = ?");
      values.push(updates.password);
    }

    if (fields.length === 0) {
      return { affectedRows: 0 };
    }

    values.push(userId);
    const [result] = await db.query(
      `UPDATE users SET ${fields.join(", ")} WHERE id = ?`,
      values,
    );
    return result;
  },

  getTransactionsByUserId: async (userId) => {
    const [rows] = await db.query(
      `SELECT
          t.id,
          t.order_id,
          o.total_amount AS total_paid,
          t.payment_method,
          t.payment_status,
          t.card_last4,
          t.transaction_reference,
          t.paid_at,
          t.created_at,
          GROUP_CONCAT(g.title ORDER BY g.title SEPARATOR ', ') AS games_bought
       FROM orders o
       INNER JOIN transactions t ON t.order_id = o.id
       LEFT JOIN order_items oi ON oi.order_id = o.id
       LEFT JOIN games g ON g.id = oi.game_id
       WHERE o.user_id = ?
       GROUP BY
          t.id,
          t.order_id,
          o.total_amount,
          t.payment_method,
          t.payment_status,
          t.card_last4,
          t.transaction_reference,
          t.paid_at,
          t.created_at
       ORDER BY COALESCE(t.paid_at, t.created_at) DESC, t.id DESC`,
      [userId],
    );
    return rows;
  },
};

module.exports = Settings;
