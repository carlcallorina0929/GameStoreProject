const Game = require("../models/gameModel");

// GET GAMES
const getGames = async (req, res) => {
  try {
    const userId = req.user.id;
    const search = req.query.search ? String(req.query.search).trim() : '';
    const genre = req.query.genre ? String(req.query.genre).trim() : null;
    const price = req.query.price ? String(req.query.price).trim() : 'all';
    const sort = req.query.sort ? String(req.query.sort).trim() : 'az';

    const games = await Game.getAllFilteredGames(userId, {
      search,
      genre,
      price,
      sort
    });

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
