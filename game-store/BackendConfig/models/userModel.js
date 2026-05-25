const db = require("../config/db");

const User = {
  testConnection: async () => {
    await db.query("SELECT 1");
  },

  getUsers: async () => {
    const [rows] = await db.query("SELECT * FROM users");
    return rows;
  },

  createUser: async (userData) => {
    const { username, first_name, last_name, age, email, password } = userData;
    const query = `INSERT INTO users (username, first_name, last_name, age, email, password) 
                   VALUES (?, ?, ?, ?, ?, ?)`;
    const [result] = await db.query(query, [username, first_name, last_name, age, email, password]);
    return result;
  },

  getUserByEmail: async (email) => {
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    return rows[0];
  },
  getUserByUsername: async (username) => {
    const [rows] = await db.query("SELECT * FROM users WHERE username = ?", [username]);
    return rows[0];
  },

  getUserById: async (id) => {
    const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [id]);
    return rows[0];
  },

  getAdminByUsername: async (username) => {
    const [rows] = await db.query(
      "SELECT * FROM users WHERE username = ? AND role = 'admin' AND isActive = TRUE LIMIT 1",
      [username],
    );
    return rows[0];
  },

  getUsersPaginated: async ({ page = 1, limit = 10, includeInactive = true, search = "" }) => {
    const offset = (page - 1) * limit;
    const conditions = ["role = 'user'"];
    const params = [];

    if (!includeInactive) {
      conditions.push("isActive = TRUE");
    }

    if (search) {
      conditions.push(
        "(username LIKE ? OR email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)",
      );
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const [rows] = await db.query(
      `SELECT id, username, first_name, last_name, age, email, role, isActive, created_at
       FROM users
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );

    const [countRows] = await db.query(
      `SELECT COUNT(*) AS total
       FROM users
       ${whereClause}`,
      params,
    );

    return {
      users: rows,
      total: countRows[0]?.total ?? 0,
    };
  },

  createAdminUser: async (userData) => {
    const { username, first_name, last_name, age, email, password, role } = userData;
    const [result] = await db.query(
      `INSERT INTO users (username, first_name, last_name, age, email, password, role, isActive)
       VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [username, first_name, last_name, age, email, password, role],
    );
    return result;
  },

  updateUserById: async (id, userData) => {
    const {
      username,
      first_name,
      last_name,
      age,
      email,
      role,
      password,
      isActive,
    } = userData;

    const fields = [];
    const params = [];

    if (username !== undefined) {
      fields.push("username = ?");
      params.push(username);
    }
    if (first_name !== undefined) {
      fields.push("first_name = ?");
      params.push(first_name);
    }
    if (last_name !== undefined) {
      fields.push("last_name = ?");
      params.push(last_name);
    }
    if (age !== undefined) {
      fields.push("age = ?");
      params.push(age);
    }
    if (email !== undefined) {
      fields.push("email = ?");
      params.push(email);
    }
    if (role !== undefined) {
      fields.push("role = ?");
      params.push(role);
    }
    if (password !== undefined) {
      fields.push("password = ?");
      params.push(password);
    }
    if (isActive !== undefined) {
      fields.push("isActive = ?");
      params.push(isActive);
    }

    if (!fields.length) {
      return { affectedRows: 0 };
    }

    params.push(id);
    const [result] = await db.query(
      `UPDATE users SET ${fields.join(", ")} WHERE id = ?`,
      params,
    );
    return result;
  },

  softDeleteUserById: async (id) => {
    const [result] = await db.query(
      "UPDATE users SET isActive = FALSE WHERE id = ?",
      [id],
    );
    return result;
  },

  getTotalUsersCount: async () => {
    const [rows] = await db.query("SELECT COUNT(*) AS total_users FROM users");
    return rows[0]?.total_users ?? 0;
  },

  getUserRegistrationTrends: async () => {
    const [rows] = await db.query(
      `SELECT DATE(created_at) AS register_date, COUNT(*) AS registrations
       FROM users
       GROUP BY DATE(created_at)
       ORDER BY register_date ASC`,
    );
    return rows;
  },
};

module.exports = User;
