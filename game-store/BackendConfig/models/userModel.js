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
};

module.exports = User;