const Game = require("../models/gameModel");


// GET GAMES
const getGames = async (req, res) => {
  try {
    const userId = req.user.id;
    const {genre} = req.query;

    const games = await Game.getAllFilteredGames(userId , genre);

    // FORMAT IMAGE URL
    const formattedGames = games.map(game => ({
      ...game,
       price: Number(game.price),
      final_price: Number(game.final_price),
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
   
    const userId = req.user.id;

    const games = await Game.getDiscountedGames(userId);

    // FORMAT IMAGE URL
   
    const formattedGames = games.map(game => ({
      ...game,
      price: Number(game.price),
      final_price: Number(game.final_price),
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

const getGenres = async (req, res) => {
  try {
    const genres = await Game.getAllGenres();
    res.json(genres);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};




module.exports = { getGames, getDiscountedGames, getGenres };
