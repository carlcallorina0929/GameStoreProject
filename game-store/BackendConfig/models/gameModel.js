const db = require("../config/db");

// GET ALL GAMES WITH GENRES + OWNERSHIP
const getAllFilteredGames = async (userId) => {
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

// GET DISCOUNTED GAMES (ONLY ACTIVE DISCOUNTS)
// - discount_percent must be > 0
// - discount must be active "right now"
// - discount_start/discount_end can be NULL for permanent discounts
// - final_price is calculated in SQL so the API response is ready to use
// - is_owned is calculated using a LEFT JOIN to the library table for the current user
const getDiscountedGames = async (userId) => {
  const [rows] = await db.query(`
    SELECT
      g.id,
      g.title,
      g.description,
      g.price,
      g.image_url,
      g.discount_percent,
      g.discount_start,
      g.discount_end,
      (g.price - (g.price * g.discount_percent / 100)) AS final_price,
      CASE
        WHEN l.game_id IS NOT NULL THEN TRUE
        ELSE FALSE
      END AS is_owned
    FROM games g
    -- LEFT JOIN keeps ALL discounted games, even if the user does NOT own them.
    -- If the user owns the game, l.game_id will be non-NULL.
    LEFT JOIN library l
      ON g.id = l.game_id
      AND l.user_id = ?
    WHERE g.discount_percent > 0
      AND (g.discount_start IS NULL OR NOW() >= g.discount_start)
      AND (g.discount_end IS NULL OR NOW() <= g.discount_end)
    ORDER BY g.discount_percent DESC
  `, [userId]);

  return rows;
};

module.exports = { getAllFilteredGames, getDiscountedGames };
