const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const libraryController = require('../controllers/libraryController');

router.get('/', authMiddleware, libraryController.getLibrary);
router.post('/add', authMiddleware, libraryController.addGameToLibrary);
router.post('/from-order', authMiddleware, libraryController.addGamesFromOrder);

module.exports = router;
