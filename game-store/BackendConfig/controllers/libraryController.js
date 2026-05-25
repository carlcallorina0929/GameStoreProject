const Library = require('../models/libraryModel');
const Order = require('../models/orderModel');
const Cart = require('../models/cartModel');

const getLibrary = async (req, res) => {
  try {
    const userId = Number(req.params.userId);

    if (req.user.id !== userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const libraryItems = await Library.getUserLibrary(userId);

    const formatted = libraryItems.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      imageUrl: item.image_url
        ? `${process.env.BASE_URL}${item.image_url}`
        : null,
      originalPrice: Number(item.original_price),
      finalPrice: Number(item.final_price),
      discountPercent: Number(item.discount_percent || 0),
      purchasedAt: item.purchased_at
    }));

    return res.json(formatted);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

const addGameToLibrary = async (req, res) => {
  try {
    const userId = req.user.id;
    const { gameId } = req.body;

    if (!gameId) {
      return res.status(400).json({ message: 'Missing gameId' });
    }

    await Library.addGameToLibrary(userId, Number(gameId));

    return res.json({
      success: true,
      message: 'Game added to library'
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

const addGamesFromOrder = async (req, res) => {
  try {
    const bodyUserId = req.body.userId ? Number(req.body.userId) : null;
    const orderId = req.body.orderId ? Number(req.body.orderId) : null;
    const userId = bodyUserId || req.user.id;

    if (!orderId) {
      return res.status(400).json({ message: 'Missing orderId' });
    }

    if (userId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const order = await Order.getOrderById(orderId);

    if (!order || order.user_id !== userId) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status !== 'completed') {
      return res.status(400).json({ message: 'Order must be completed before adding to library' });
    }

    const orderItems = await Order.getOrderItems(orderId);
    const gameIds = orderItems.map((item) => Number(item.game_id)).filter(Boolean);

    await Library.addMultipleGames(userId, gameIds);
    await Cart.clearCart(userId);

    return res.json({
      success: true,
      message: 'Games added to library',
      addedCount: gameIds.length
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getLibrary, addGameToLibrary, addGamesFromOrder };
