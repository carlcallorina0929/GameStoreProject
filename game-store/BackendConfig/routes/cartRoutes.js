const express = require('express');
const router = express.Router();

const cartController = require('../controllers/cartController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, cartController.getCart);

router.post('/cart/add', authMiddleware, cartController.addToCart);

module.exports = router;