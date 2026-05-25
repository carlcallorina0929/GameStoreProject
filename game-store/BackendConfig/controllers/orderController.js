const Order = require('../models/orderModel');
const Library = require('../models/libraryModel');
const Cart = require('../models/cartModel');

const checkout = async (req, res) => {
  try {
    const userId = req.user.id;
    const paymentStatus = req.body.paymentStatus ? String(req.body.paymentStatus).trim() : 'pending';
    const cartItems = req.body.cartItems || [];

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ message: 'Cart is empty or invalid' });
    }

    const gameIds = cartItems
      .map((item) => Number(item.game_id || item.gameId))
      .filter((id) => !Number.isNaN(id));

    if (gameIds.length === 0) {
      return res.status(400).json({ message: 'No valid games in cart' });
    }

    const orderId = await Order.createOrder(userId, paymentStatus === 'paid' ? 'completed' : 'pending');
    await Order.addOrderItems(orderId, gameIds);
    await Order.createTransaction(orderId, paymentStatus);

    if (paymentStatus === 'paid') {
      await Library.addMultipleGames(userId, gameIds);
      await Cart.clearCart(userId);
    }

    return res.json({
      success: true,
      orderId,
      paymentStatus,
      libraryAdded: paymentStatus === 'paid'
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { checkout };
