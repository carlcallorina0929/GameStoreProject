const cartModel = require('../models/cartModel');
const addToCart = async (req, res) => {
  try {
    const userId = req.user.id; // FROM JWT
    const { gameId } = req.body;

    if (!gameId) {
      return res.status(400).json({ message: 'Game Not Found' });
    }

    await cartModel.addToCart(userId, gameId);

    return res.json({
      success: true,
      message: 'Successfully Added to Cart',
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
const removeCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { gameId } = req.params;

    await cartModel.removeItem(userId, gameId);

    res.json({
      message: 'Item removed from cart'
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Failed to remove item'
    });
  }
};
const getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const cart = await cartModel.getCart(userId);

    const cleanedCart = cart.map(item => ({
      game_id: item.game_id,
      title: item.title,
      price: item.original_price,
      discount_percent: item.discount_percent,
      image_url: item.image_url
        ? `${process.env.BASE_URL}${item.image_url}`
        : null
,
      final_price: Number(item.final_price)
    }));

    return res.json(cleanedCart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
module.exports = { addToCart , getCart , removeCartItem };