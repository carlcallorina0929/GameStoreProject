const Game = require("../models/gameModel");

// GET GAMES
const getGames = async (req, res) => {
  try {
    const userId = req.user.id;

    const games = await Game.getAllGames(userId);

    // FORMAT IMAGE URL
    const formattedGames = games.map(game => ({
      ...game,
      image_url: game.image_url
        ? `http://localhost:3000${game.image_url}`
        : null
    }));

    res.json(formattedGames);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getGames };