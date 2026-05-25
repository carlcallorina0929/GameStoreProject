const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const checkoutController = require('../controllers/checkoutController');

const router = express.Router();

// POST /api/checkout/process - Process payment
router.post('/process', authMiddleware, (req, res) => {
  checkoutController.processCheckout(req, res);
});

// POST /api/checkout/start - Create pending order
router.post('/start', authMiddleware, (req, res) => {
  checkoutController.startCheckout(req, res);
});

// POST /api/checkout/cancel - Cancel pending order
router.post('/cancel', authMiddleware, (req, res) => {
  checkoutController.cancelCheckout(req, res);
});

// GET /api/checkout/order/:orderId - Get order details
router.get('/order/:orderId', authMiddleware, (req, res) => {
  checkoutController.getOrderDetails(req, res);
});

module.exports = router;
