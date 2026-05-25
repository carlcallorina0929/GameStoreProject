const checkoutModel = require('../models/checkoutModel');

class CheckoutController {
  /**
   * POST /api/checkout/process
   * Process payment and complete checkout
   */
  async processCheckout(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      const cardNumber = String(req.body.cardNumber ?? '').trim();
      const expiry = String(req.body.expiry ?? '').trim();
      const cvv = String(req.body.cvv ?? '').trim();
      const cardholderName = String(req.body.cardholderName ?? '').trim();

      if (!cardNumber || !expiry || !cvv || !cardholderName) {
        return res.status(400).json({
          success: false,
          errorCode: 'INVALID_DATA',
          error: 'Missing required payment information'
        });
      }

      // Simulate processing delay (1-2 seconds)
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

      // Process checkout
      const result = await checkoutModel.checkout(userId, {
        cardNumber,
        expiry,
        cvv,
        cardholderName
      });

      if (!result.success) {
        return res.status(400).json({
          success: false,
          paymentStatus: result.paymentStatus,
          errorCode: result.errorCode,
          error: result.error,
          transactionReference: result.transactionReference
        });
      }

      return res.status(200).json({
        success: true,
        paymentStatus: 'paid',
        transactionReference: result.transactionReference,
        orderId: result.orderId,
        totalAmount: result.totalAmount,
        itemCount: result.itemCount
      });

    } catch (error) {
      console.error('Checkout error:', error);
      return res.status(500).json({
        success: false,
        error: 'Payment processing failed'
      });
    }
  }

  /**
   * GET /api/checkout/order/:orderId
   * Get order details
   */
  async getOrderDetails(req, res) {
    try {
      const { orderId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const order = await checkoutModel.getOrder(orderId);
      if (!order || order.user_id !== userId) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const items = await checkoutModel.getOrderItems(orderId);
      const transaction = await checkoutModel.getTransaction(orderId);

      return res.status(200).json({
        order,
        items,
        transaction
      });

    } catch (error) {
      console.error('Error fetching order:', error);
      return res.status(500).json({ error: 'Failed to fetch order' });
    }
  }

  // POST /api/checkout/start
  async startCheckout(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

      console.log('StartCheckout: userId', userId);
      const result = await checkoutModel.startCheckout(userId);
      console.log('StartCheckout result:', result);

      if (!result.success) return res.status(400).json({ success: false, error: result.error || 'Failed to start checkout' });

      return res.status(200).json({ success: true, orderId: result.orderId, totalAmount: result.totalAmount, itemCount: result.itemCount });
    } catch (err) {
      console.error('startCheckout controller error:', err);
      return res.status(500).json({ success: false, error: 'Failed to start checkout' });
    }
  }

  // POST /api/checkout/cancel
  async cancelCheckout(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

      const orderId = Number(req.body.orderId || 0);
      if (!orderId) return res.status(400).json({ success: false, error: 'orderId required' });

      console.log('CancelCheckout: userId', userId, 'orderId', orderId);
      const result = await checkoutModel.cancelCheckout(orderId, userId);
      console.log('CancelCheckout result:', result);

      if (!result.success) return res.status(400).json({ success: false, error: result.error || 'Cancel failed' });

      return res.status(200).json({ success: true });
    } catch (err) {
      console.error('cancelCheckout controller error:', err);
      return res.status(500).json({ success: false, error: 'Failed to cancel order' });
    }
  }
}

module.exports = new CheckoutController();
