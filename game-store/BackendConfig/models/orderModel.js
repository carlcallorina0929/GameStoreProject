const db = require('../config/db');

const createOrder = async (userId, status = 'completed') => {
  const [result] = await db.query(
    `INSERT INTO orders (user_id, status) VALUES (?, ?)`,
    [userId, status]
  );

  return result.insertId;
};

const addOrderItems = async (orderId, gameIds) => {
  if (!Array.isArray(gameIds) || gameIds.length === 0) return;

  const values = gameIds.map((gameId) => [orderId, gameId]);

  return await db.query(
    `INSERT INTO order_items (order_id, game_id) VALUES ?`,
    [values]
  );
};

const createTransaction = async (orderId, paymentStatus) => {
  return await db.query(
    `INSERT INTO transactions (order_id, payment_status) VALUES (?, ?)`,
    [orderId, paymentStatus]
  );
};

const getOrderItems = async (orderId) => {
  const [rows] = await db.query(
    `SELECT game_id FROM order_items WHERE order_id = ?`,
    [orderId]
  );
  return rows;
};

const getOrderById = async (orderId) => {
  const [rows] = await db.query(
    `SELECT id, user_id, status FROM orders WHERE id = ? LIMIT 1`,
    [orderId]
  );
  return rows[0];
};

module.exports = {
  createOrder,
  addOrderItems,
  createTransaction,
  getOrderItems,
  getOrderById,
};
