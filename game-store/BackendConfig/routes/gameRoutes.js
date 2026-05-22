const express = require("express");
const router = express.Router();

const gameController = require("../controllers/gameController");
const authMiddleware = require("../middleware/authMiddleware");

// GET ALL GAMES (PROTECTED)

router.get("/", authMiddleware, gameController.getGames);

// GET DISCOUNTED GAMES (PROTECTED - NEEDS USER ID FOR OWNERSHIP CHECK)
// Full path: GET /api/discounted-games
router.get("/discounted-games", authMiddleware, gameController.getDiscountedGames);
router.get("/genres", authMiddleware, gameController.getGenres);



module.exports = router;
