const db = require('../config/db');

const addToCart = async (userId, gameId) => {
  return await db.query(`
    INSERT INTO cart (user_id, game_id)
    VALUES (?, ?)
    ON DUPLICATE KEY UPDATE game_id = game_id
  `, [userId, gameId]);
};
const removeItem = async (userId, gameId) => {
  return await db.query(`
    DELETE FROM cart
    WHERE user_id = ? AND game_id = ?
  `, [userId, gameId]);
};
const getCart = async (userId) => {
  const [rows] = await db.query(`
    SELECT
      c.game_id,
      g.title,
      g.description,
      g.price,
      g.image_url,
      g.discount_percent,
      (g.price - (g.price * g.discount_percent / 100)) AS final_price
    FROM cart c
    JOIN games g ON g.id = c.game_id
    WHERE c.user_id = ?
  `, [userId]);

  return rows;
};
module.exports = { addToCart, getCart , removeItem };