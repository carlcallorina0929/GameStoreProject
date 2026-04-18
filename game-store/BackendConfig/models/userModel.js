
const db = require("../config/db");

const User = {
  testConnection: async () => {
    await db.query("SELECT 1");
  },

  getUsers: async () => {
    const [rows] = await db.query("SELECT * FROM users");
    return rows;
  },
};

module.exports = User;