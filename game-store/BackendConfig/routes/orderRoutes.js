const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const orderController = require('../controllers/orderController');

router.post('/checkout', authMiddleware, orderController.checkout);

module.exports = router;
