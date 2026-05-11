const Game = require("../models/gameModel");

// GET GAMES
const getGames = async (req, res) => {
  try {
    const userId = req.user.id;

    const games = await Game.getAllFilteredGames(userId);

    // FORMAT IMAGE URL
    const formattedGames = games.map(game => ({
      ...game,
      image_url: game.image_url
        ? `${process.env.BASE_URL}${game.image_url}`
        : null
    }));

    res.json(formattedGames);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET DISCOUNTED GAMES (HOMEPAGE HERO SLIDER)
// Returns ONLY games that have an active discount right now.
const getDiscountedGames = async (req, res) => {
  try {
    // authMiddleware attaches the decoded JWT payload to req.user
    // so we can safely read the currently logged-in user's id here.
    const userId = req.user.id;

    const games = await Game.getDiscountedGames(userId);

    // FORMAT IMAGE URL
    // Example:
    // image_url in DB: "/uploads/games/halo.jpg"
    // BASE_URL: "http://localhost:5000"
    // final: "http://localhost:5000/uploads/games/halo.jpg"
    const formattedGames = games.map(game => ({
      ...game,
      image_url: game.image_url
        ? `${process.env.BASE_URL}${game.image_url}`
        : null
    }));

    res.json(formattedGames);
  } catch (err) {
    console.error("Error fetching discounted games:", err);
    res.status(500).json({ error: "Failed to fetch discounted games" });
  }
};

module.exports = { getGames, getDiscountedGames };
