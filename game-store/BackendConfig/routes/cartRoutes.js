const express = require('express');
const router = express.Router();

const cartController = require('../controllers/cartController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, cartController.getCart);

router.post('/add', authMiddleware, cartController.addToCart);
router.post('/remove/:gameId', authMiddleware, cartController.removeCartItem);


module.exports = router;