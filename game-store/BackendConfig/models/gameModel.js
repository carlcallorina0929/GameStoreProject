const db = require("../config/db");

// GET ALL GAMES WITH GENRES + OWNERSHIP
const getAllFilteredGames = async (userId, filters = {}) => {
  const { search, genre, price, sort } = filters;

  let sql = `
SELECT 
  g.id,
  g.title,
  g.description,
  g.price,
  g.image_url,
  g.discount_percent,
  g.discount_start,
  g.discount_end,
  (g.price - (g.price * COALESCE(g.discount_percent, 0) / 100)) AS final_price,
  GROUP_CONCAT(DISTINCT ge.name) AS genres,
  CASE 
    WHEN l.game_id IS NOT NULL THEN 1
    ELSE 0
  END AS is_owned,
  CASE 
    WHEN c.game_id IS NOT NULL THEN 1
    ELSE 0
  END AS is_in_cart
FROM games g
LEFT JOIN game_genres gg ON g.id = gg.game_id
LEFT JOIN genres ge ON ge.id = gg.genre_id
LEFT JOIN library l 
  ON g.id = l.game_id AND l.user_id = ?
LEFT JOIN cart c 
  ON g.id = c.game_id AND c.user_id = ?
WHERE 1=1
  `;

  const params = [userId, userId];

  if (genre) {
    sql += `
  AND EXISTS (
    SELECT 1
    FROM game_genres gg2
    INNER JOIN genres ge2 ON gg2.genre_id = ge2.id
    WHERE gg2.game_id = g.id
      AND ge2.name = ?
  )
    `;
    params.push(genre);
  }

  if (search) {
    const searchTerm = `%${search.toLowerCase()}%`;
    sql += `
  AND (
    LOWER(g.title) LIKE ?
    OR LOWER(g.description) LIKE ?
    OR LOWER(ge.name) LIKE ?
  )
    `;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  if (price === 'free') {
    sql += `
  AND (g.price - (g.price * COALESCE(g.discount_percent, 0) / 100)) = 0
    `;
  } else if (price === 'paid') {
    sql += `
  AND (g.price - (g.price * COALESCE(g.discount_percent, 0) / 100)) > 0
    `;
  } else if (price === 'discounted') {
    sql += `
  AND g.discount_percent > 0
    `;
  }

  sql += `
GROUP BY g.id
    `;

  if (sort === 'price_asc') {
    sql += 'ORDER BY final_price ASC';
  } else if (sort === 'price_desc') {
    sql += 'ORDER BY final_price DESC';
  } else if (sort === 'most_discounted') {
    sql += 'ORDER BY g.discount_percent DESC';
  } else if (sort === 'newest') {
    sql += 'ORDER BY g.id DESC';
  } else {
    sql += 'ORDER BY g.title ASC';
  }

  const [rows] = await db.query(sql, params);
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
      END AS is_owned,

      CASE
        WHEN c.game_id IS NOT NULL THEN TRUE
        ELSE FALSE
      END AS is_in_cart

    FROM games g

    -- OWNERSHIP CHECK
    LEFT JOIN library l
      ON g.id = l.game_id
      AND l.user_id = ?

    -- CART CHECK
    LEFT JOIN cart c
      ON g.id = c.game_id
      AND c.user_id = ?

    WHERE g.discount_percent > 0
      AND (g.discount_start IS NULL OR NOW() >= g.discount_start)
      AND (g.discount_end IS NULL OR NOW() <= g.discount_end)

    ORDER BY g.discount_percent DESC
  `, [userId, userId]);

  return rows;
};
//GET GENRES
const getAllGenres = async () => {
  const [rows] = await db.query(`
    SELECT id, name
    FROM genres
    ORDER BY name ASC
  `);

  return rows;
};


module.exports = { getAllFilteredGames, getDiscountedGames, getAllGenres };
