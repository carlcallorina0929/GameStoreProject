const db = require("../config/db");

// GET ALL GAMES WITH GENRES + OWNERSHIP
const getAllGames = async (userId) => {
  const [rows] = await db.query(`
    SELECT 
      g.id,
      g.title,
      g.description,
      g.price,
      g.image_url,

      GROUP_CONCAT(ge.name) AS genres,

      CASE 
        WHEN l.game_id IS NOT NULL THEN 1
        ELSE 0
      END AS is_owned

    FROM games g
    LEFT JOIN game_genres gg ON g.id = gg.game_id
    LEFT JOIN genres ge ON ge.id = gg.genre_id
    LEFT JOIN library l 
      ON g.id = l.game_id AND l.user_id = ?

    GROUP BY g.id
  `, [userId]);

  return rows;
};

module.exports = { getAllGames };