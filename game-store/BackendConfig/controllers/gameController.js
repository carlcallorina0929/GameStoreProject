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

module.exports = { getGames };