const Game = require("../models/gameModel");

const parseBoolean = (value, fallback = false) => {
  if (value === undefined || value === null) return fallback;
  return String(value).toLowerCase() === "true" || String(value) === "1";
};

const toOptionalNumber = (value, fallback) => {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? NaN : parsed;
};

const normalizeImagePath = (file) => (file ? `/uploads/games/${file.filename}` : undefined);
const parseGenreIds = (value) => {
  if (value === undefined || value === null || value === "") return [];
  if (Array.isArray(value)) return value.map((v) => Number(v)).filter((v) => Number.isInteger(v));
  try {
    const parsed = JSON.parse(String(value));
    if (Array.isArray(parsed)) {
      return parsed.map((v) => Number(v)).filter((v) => Number.isInteger(v));
    }
  } catch (_error) {
    const split = String(value)
      .split(",")
      .map((v) => Number(v.trim()))
      .filter((v) => Number.isInteger(v));
    return split;
  }
  return [];
};

const toIsoOrNull = (value, allowUndefined = false) => {
  if (value === undefined) return allowUndefined ? undefined : null;
  if (value === null || value === "") return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return NaN;
  return parsed.toISOString().slice(0, 19).replace("T", " ");
};

const listGames = async (req, res) => {
  try {
    const page = Math.max(Number.parseInt(String(req.query.page ?? "1"), 10) || 1, 1);
    const limit = Math.min(
      Math.max(Number.parseInt(String(req.query.limit ?? "10"), 10) || 10, 1),
      100,
    );
    const includeInactive = parseBoolean(req.query.includeInactive, true);
    const search = String(req.query.search ?? "").trim();

    const result = await Game.getAdminGamesPaginated({ page, limit, includeInactive, search });

    const data = result.games.map((game) => ({
      ...game,
      price: Number(game.price),
      discount_percent: Number(game.discount_percent),
      image_url: game.image_url ? `${process.env.BASE_URL}${game.image_url}` : null,
    }));

    return res.json({
      data,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit) || 1,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

const createGame = async (req, res) => {
  try {
    const title = String(req.body.title ?? "").trim();
    const description = String(req.body.description ?? "").trim();
    const price = toOptionalNumber(req.body.price, NaN);
    const discount_percent = toOptionalNumber(req.body.discount_percent, 0);
    const genreIds = parseGenreIds(req.body.genre_ids);
    const discount_start = toIsoOrNull(req.body.discount_start);
    const discount_end = toIsoOrNull(req.body.discount_end);

    if (!title || !description || Number.isNaN(price)) {
      return res.status(400).json({ error: "Title, description, and price are required" });
    }
    if (!req.file) {
      return res.status(400).json({ error: "Game image is required" });
    }
    if (price < 0) {
      return res.status(400).json({ error: "Price cannot be negative" });
    }
    if (Number.isNaN(discount_percent) || discount_percent < 0 || discount_percent > 100) {
      return res.status(400).json({ error: "Discount percent must be between 0 and 100" });
    }
    if (Number.isNaN(discount_start) || Number.isNaN(discount_end)) {
      return res.status(400).json({ error: "Invalid discount date format" });
    }
    if (discount_start && discount_end && discount_start > discount_end) {
      return res.status(400).json({ error: "Discount start cannot be after discount end" });
    }
    const existingGenreIds = await Game.getGenreIdsByIds(genreIds);
    if (existingGenreIds.length !== genreIds.length) {
      return res.status(400).json({ error: "One or more selected genres are invalid" });
    }

    const image_url = normalizeImagePath(req.file) ?? null;
    const result = await Game.createGame({
      title,
      description,
      price,
      image_url,
      discount_percent,
      discount_start,
      discount_end,
      isActive: true,
    });
    await Game.setGameGenres(result.insertId, existingGenreIds);

    return res.status(201).json({ message: "Game created successfully", gameId: result.insertId });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

const updateGame = async (req, res) => {
  try {
    const gameId = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(gameId)) {
      return res.status(400).json({ error: "Invalid game id" });
    }

    const existingGame = await Game.getGameById(gameId);
    if (!existingGame) {
      return res.status(404).json({ error: "Game not found" });
    }

    const payload = {};
    let parsedGenreIds = null;

    if (req.body.title !== undefined) {
      const title = String(req.body.title).trim();
      if (!title) return res.status(400).json({ error: "Title cannot be empty" });
      payload.title = title;
    }

    if (req.body.description !== undefined) {
      const description = String(req.body.description).trim();
      if (!description) return res.status(400).json({ error: "Description cannot be empty" });
      payload.description = description;
    }

    if (req.body.price !== undefined) {
      const price = toOptionalNumber(req.body.price, NaN);
      if (Number.isNaN(price) || price < 0) {
        return res.status(400).json({ error: "Price must be a valid non-negative number" });
      }
      payload.price = price;
    }

    if (req.body.discount_percent !== undefined) {
      const discount_percent = toOptionalNumber(req.body.discount_percent, NaN);
      if (Number.isNaN(discount_percent) || discount_percent < 0 || discount_percent > 100) {
        return res.status(400).json({ error: "Discount percent must be between 0 and 100" });
      }
      payload.discount_percent = discount_percent;
    }

    if (req.body.discount_start !== undefined) {
      const discount_start = toIsoOrNull(req.body.discount_start, true);
      if (Number.isNaN(discount_start)) {
        return res.status(400).json({ error: "Invalid discount_start format" });
      }
      payload.discount_start = discount_start;
    }

    if (req.body.discount_end !== undefined) {
      const discount_end = toIsoOrNull(req.body.discount_end, true);
      if (Number.isNaN(discount_end)) {
        return res.status(400).json({ error: "Invalid discount_end format" });
      }
      payload.discount_end = discount_end;
    }

    if (payload.discount_start !== undefined || payload.discount_end !== undefined) {
      const start = payload.discount_start ?? existingGame.discount_start;
      const end = payload.discount_end ?? existingGame.discount_end;
      if (start && end && start > end) {
        return res.status(400).json({ error: "Discount start cannot be after discount end" });
      }
    }

    if (req.body.isActive !== undefined) {
      payload.isActive = parseBoolean(req.body.isActive, true);
    }

    const imageUrl = normalizeImagePath(req.file);
    if (imageUrl !== undefined) {
      payload.image_url = imageUrl;
    }

    if (req.body.genre_ids !== undefined) {
      parsedGenreIds = parseGenreIds(req.body.genre_ids);
      const existingGenreIds = await Game.getGenreIdsByIds(parsedGenreIds);
      if (existingGenreIds.length !== parsedGenreIds.length) {
        return res.status(400).json({ error: "One or more selected genres are invalid" });
      }
      parsedGenreIds = existingGenreIds;
    }

    await Game.updateGameById(gameId, payload);
    if (parsedGenreIds !== null) {
      await Game.setGameGenres(gameId, parsedGenreIds);
    }
    return res.json({ message: "Game updated successfully" });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

const listGenres = async (req, res) => {
  try {
    const genres = await Game.getAllGenres();
    return res.json(genres);
  } catch (_error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

const softDeleteGame = async (req, res) => {
  try {
    const gameId = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(gameId)) {
      return res.status(400).json({ error: "Invalid game id" });
    }

    const existingGame = await Game.getGameById(gameId);
    if (!existingGame) {
      return res.status(404).json({ error: "Game not found" });
    }

    await Game.softDeleteGameById(gameId);
    return res.json({ message: "Game soft deleted successfully" });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  listGames,
  createGame,
  updateGame,
  softDeleteGame,
  listGenres,
};
