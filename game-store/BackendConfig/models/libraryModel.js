const db = require('../config/db');

const addGameToLibrary = async (userId, gameId) => {
  return await db.query(
    `INSERT IGNORE INTO library (user_id, game_id, purchased_at)
     VALUES (?, ?, NOW())`,
    [userId, gameId]
  );
};

const addMultipleGames = async (userId, gameIds) => {
  if (!Array.isArray(gameIds) || gameIds.length === 0) return;

  const values = gameIds.map((gameId) => [userId, gameId, new Date()]);

  return await db.query(
    `INSERT IGNORE INTO library (user_id, game_id, purchased_at)
     VALUES ?`,
    [values]
  );
};

const getUserLibrary = async (userId) => {
  const [rows] = await db.query(
    `SELECT
      l.game_id AS id,
      g.title,
      g.description,
      g.image_url,
      g.price AS original_price,
      g.discount_percent,
      (g.price - (g.price * COALESCE(g.discount_percent, 0) / 100)) AS final_price,
      l.purchased_at
    FROM library l
    JOIN games g ON g.id = l.game_id
    WHERE l.user_id = ?
    ORDER BY l.purchased_at DESC`,
    [userId]
  );

  return rows;
};

const checkGameExists = async (userId, gameId) => {
  const [rows] = await db.query(
    `SELECT 1 FROM library WHERE user_id = ? AND game_id = ? LIMIT 1`,
    [userId, gameId]
  );

  return rows.length > 0;
};

module.exports = {
  addGameToLibrary,
  addMultipleGames,
  getUserLibrary,
  checkGameExists,
};
