const express = require("express");
const router = express.Router();

const gameController = require("../controllers/gameController");
const authMiddleware = require("../middleware/authMiddleware");

// GET ALL GAMES (PROTECTED)
router.get("/games", authMiddleware, gameController.getGames);

module.exports = router;