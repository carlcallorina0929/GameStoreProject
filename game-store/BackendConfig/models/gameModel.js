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
  AND g.isActive = TRUE
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
      AND g.isActive = TRUE
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

const getAdminGamesPaginated = async ({
  page = 1,
  limit = 10,
  includeInactive = true,
  search = "",
} = {}) => {
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];

  if (!includeInactive) {
    conditions.push("g.isActive = TRUE");
  }

  if (search) {
    conditions.push("(g.title LIKE ? OR g.description LIKE ?)");
    const term = `%${search}%`;
    params.push(term, term);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const [rows] = await db.query(
    `SELECT
      g.id,
      g.title,
      g.description,
      g.price,
      g.image_url,
      g.discount_percent,
      g.discount_start,
      g.discount_end,
      g.isActive,
      g.created_at,
      GROUP_CONCAT(DISTINCT ge.name) AS genres,
      GROUP_CONCAT(DISTINCT ge.id) AS genre_ids
    FROM games g
    LEFT JOIN game_genres gg ON g.id = gg.game_id
    LEFT JOIN genres ge ON ge.id = gg.genre_id
    ${whereClause}
    GROUP BY g.id
    ORDER BY g.created_at DESC
    LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );

  const [countRows] = await db.query(
    `SELECT COUNT(*) AS total
     FROM games g
     ${whereClause}`,
    params,
  );

  return {
    games: rows,
    total: countRows[0]?.total ?? 0,
  };
};

const createGame = async (gameData) => {
  const {
    title,
    description,
    price,
    image_url,
    discount_percent,
    discount_start,
    discount_end,
    isActive = true,
  } = gameData;

  const [result] = await db.query(
    `INSERT INTO games
      (title, description, price, image_url, discount_percent, discount_start, discount_end, isActive)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      title,
      description,
      price,
      image_url ?? null,
      discount_percent ?? 0,
      discount_start ?? null,
      discount_end ?? null,
      isActive,
    ],
  );

  return result;
};

const getGameById = async (id) => {
  const [rows] = await db.query("SELECT * FROM games WHERE id = ?", [id]);
  return rows[0];
};

const updateGameById = async (id, gameData) => {
  const {
    title,
    description,
    price,
    image_url,
    discount_percent,
    discount_start,
    discount_end,
    isActive,
  } = gameData;

  const fields = [];
  const params = [];

  if (title !== undefined) {
    fields.push("title = ?");
    params.push(title);
  }
  if (description !== undefined) {
    fields.push("description = ?");
    params.push(description);
  }
  if (price !== undefined) {
    fields.push("price = ?");
    params.push(price);
  }
  if (image_url !== undefined) {
    fields.push("image_url = ?");
    params.push(image_url);
  }
  if (discount_percent !== undefined) {
    fields.push("discount_percent = ?");
    params.push(discount_percent);
  }
  if (discount_start !== undefined) {
    fields.push("discount_start = ?");
    params.push(discount_start);
  }
  if (discount_end !== undefined) {
    fields.push("discount_end = ?");
    params.push(discount_end);
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
    `UPDATE games SET ${fields.join(", ")} WHERE id = ?`,
    params,
  );
  return result;
};

const softDeleteGameById = async (id) => {
  const [result] = await db.query("UPDATE games SET isActive = FALSE WHERE id = ?", [id]);
  return result;
};

const getTotalGamesCount = async () => {
  const [rows] = await db.query("SELECT COUNT(*) AS total_games FROM games");
  return rows[0]?.total_games ?? 0;
};

const getTopFreeGamesByLibrary = async (limit = 10) => {
  const [rows] = await db.query(
    `SELECT
      g.id AS game_id,
      g.title,
      COUNT(l.id) AS owners_count
    FROM library l
    INNER JOIN games g ON g.id = l.game_id
    WHERE g.price = 0
    GROUP BY g.id, g.title
    ORDER BY owners_count DESC, g.title ASC
    LIMIT ?`,
    [limit],
  );

  return rows;
};

const getGenreIdsByIds = async (genreIds = []) => {
  if (!genreIds.length) return [];
  const [rows] = await db.query(
    `SELECT id FROM genres WHERE id IN (?)`,
    [genreIds],
  );
  return rows.map((row) => row.id);
};

const setGameGenres = async (gameId, genreIds = []) => {
  await db.query("DELETE FROM game_genres WHERE game_id = ?", [gameId]);
  if (!genreIds.length) return;

  const values = genreIds.map((genreId) => [gameId, genreId]);
  await db.query(
    "INSERT INTO game_genres (game_id, genre_id) VALUES ?",
    [values],
  );
};


module.exports = {
  getAllFilteredGames,
  getDiscountedGames,
  getAllGenres,
  getAdminGamesPaginated,
  createGame,
  getGameById,
  updateGameById,
  softDeleteGameById,
  getTotalGamesCount,
  getTopFreeGamesByLibrary,
  getGenreIdsByIds,
  setGameGenres,
};
