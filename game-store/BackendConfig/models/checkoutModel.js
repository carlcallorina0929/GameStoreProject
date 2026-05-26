const pool = require('../config/db');

// Helper to get a connection with a small retry/backoff for transient network issues
async function getConnectionWithRetry(retries = 3, delayMs = 1000) {
  let attempt = 0;
  while (attempt < retries) {
    try {
      console.log(`DB: acquiring connection (attempt ${attempt + 1})`);
      const conn = await pool.getConnection();
      // optionally ping to ensure connection is alive
      await conn.ping();
      console.log('DB: connection acquired');
      return conn;
    } catch (err) {
      console.error(`DB: getConnection attempt ${attempt + 1} failed:`, err && err.message ? err.message : err);
      attempt++;
      if (attempt >= retries) throw err;
      await new Promise(res => setTimeout(res, delayMs * attempt));
    }
  }
}

class CheckoutModel {
  /**
   * Validate card number (16 digits only)
   */
  validateCardNumber(cardNumber) {
    const cleaned = cardNumber.replace(/\s/g, '');
    return /^\d{16}$/.test(cleaned);
  }

  /**
   * Validate CVV (3 digits)
   */
  validateCVV(cvv) {
    return /^\d{3}$/.test(cvv);
  }

  /**
   * Validate cardholder name (letters and spaces only)
   */
  validateCardholderName(name) {
    const normalized = String(name ?? '').trim();
    return normalized.length > 0 && /^[A-Za-z ]+$/.test(normalized);
  }

  /**
   * Validate expiry (MM/YY format, not in past)
   */
  validateExpiry(expiry) {
    const match = expiry.match(/^(\d{2})\/(\d{2})$/);
    if (!match) return false;

    const month = parseInt(match[1]);
    const year = parseInt(match[2]);

    if (month < 1 || month > 12) return false;

    const now = new Date();
    const currentYear = now.getFullYear() % 100;
    const currentMonth = now.getMonth() + 1;

    if (year < currentYear) return false;
    if (year === currentYear && month < currentMonth) return false;

    return true;
  }

  /**
   * Generate transaction reference (TXN-XXXXXXXX)
   */
  generateTransactionReference() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let ref = 'TXN-';
    for (let i = 0; i < 8; i++) {
      ref += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return ref;
  }

  /**
   * Main checkout function with transaction handling
   * FLOW:
   * 1. Validate card
   * 2. BEGIN TRANSACTION
   * 3. Create order (status = pending)
   * 4. Create order items
   * 5. Create transaction
   * 6. Add games to library
   * 7. Clear cart
   * 8. Update order status to completed
   * 9. COMMIT
   * If any step fails: ROLLBACK
   */
  async checkout(userId, cardData) {
    const validationError = this.validateCardData(cardData);
    if (validationError) {
      return {
        success: false,
        paymentStatus: 'failed',
        errorCode: validationError.errorCode,
        error: validationError.error,
        transactionReference: null
      };
    }

  let connection;

  try {
    connection = await getConnectionWithRetry(3, 1000);

    console.log('Checkout: checking for pending order for user', userId);

    // Reuse a pending order if one exists (created by startCheckout)
    const [pendingOrders] = await connection.query(
      `SELECT * FROM orders WHERE user_id = ? AND status = 'pending' ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );

    let orderId = null;
    let cartItems = [];
    let totalAmount = 0;

    if (pendingOrders.length) {
      orderId = pendingOrders[0].id;
      console.log('Checkout: found pending order', orderId);

      const [items] = await connection.query(`SELECT oi.game_id, oi.price AS final_price FROM order_items oi WHERE oi.order_id = ?`, [orderId]);
      cartItems = items;
      totalAmount = pendingOrders[0].total_amount;
    } else {
      console.log('Checkout: no pending order, fetching cart items for user', userId);
      const [items] = await connection.query(
        `SELECT 
            c.game_id,
            g.title,
            g.price,
            g.discount_percent,
            (g.price - (g.price * g.discount_percent / 100)) AS final_price
         FROM cart c
         JOIN games g ON c.game_id = g.id
         WHERE c.user_id = ?`,
        [userId]
      );

      if (!items.length) {
        return { success: false, paymentStatus: 'failed', error: 'Cart is empty' };
      }

      cartItems = items;
      totalAmount = cartItems.reduce((sum, item) => sum + Number(item.final_price), 0);

      await connection.query('START TRANSACTION');

      // create order and order_items snapshot
      const [orderResult] = await connection.query(
        `INSERT INTO orders (user_id, total_amount, status) VALUES (?, ?, ?)`,
        [userId, totalAmount, 'pending']
      );
      orderId = orderResult.insertId;

      for (const item of cartItems) {
        await connection.query(
          `INSERT INTO order_items (order_id, game_id, price) VALUES (?, ?, ?)`,
          [orderId, item.game_id, item.final_price]
        );
      }
    }

    // proceed to create/update transaction and finalize
    await connection.query('START TRANSACTION');

    // If transaction exists for this order and is pending, update it; otherwise insert a new transaction
    const [existingTxn] = await connection.query(`SELECT * FROM transactions WHERE order_id = ? ORDER BY created_at DESC LIMIT 1`, [orderId]);
    // Prefer a reference created at startCheckout() so pending/paid share the same reference.
    const txnRef =
      existingTxn.length && existingTxn[0].transaction_reference
        ? existingTxn[0].transaction_reference
        : this.generateTransactionReference();
    const cardLast4 = cardData.cardNumber.slice(-4);

    if (existingTxn.length && existingTxn[0].payment_status === 'pending') {
      await connection.query(
        `UPDATE transactions SET payment_status = ?, card_last4 = ?, transaction_reference = ?, paid_at = ? WHERE id = ?`,
        ['paid', cardLast4, txnRef, new Date(), existingTxn[0].id]
      );
    } else {
      await connection.query(
        `INSERT INTO transactions (order_id, payment_method, payment_status, card_last4, transaction_reference, paid_at) VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, 'credit_card', 'paid', cardLast4, txnRef, new Date()]
      );
    }

    // add to library
    for (const item of cartItems) {
      await connection.query(
        `INSERT IGNORE INTO library (user_id, game_id, purchased_at) VALUES (?, ?, ?)`,
        [userId, item.game_id, new Date()]
      );
    }

    // clear cart
    await connection.query(`DELETE FROM cart WHERE user_id = ?`, [userId]);

    // mark order completed
    await connection.query(`UPDATE orders SET status = 'completed' WHERE id = ?`, [orderId]);

    await connection.query('COMMIT');

    return {
      success: true,
      paymentStatus: 'paid',
      transactionReference: txnRef,
      orderId,
      totalAmount,
      itemCount: cartItems.length
    };

  } catch (error) {
    console.error('Checkout error:', error);

    if (connection) {
      await connection.query('ROLLBACK');
    }

    return {
      success: false,
      paymentStatus: 'failed',
      error: 'Payment processing failed'
    };
  } finally {
    if (connection) connection.release();
  }

  }

  /**
   * Create a pending order by snapshotting user's cart and creating a pending transaction
   */
  async startCheckout(userId) {
    let connection;
    try {
      connection = await getConnectionWithRetry(3, 1000);

      const [cartItems] = await connection.query(
        `SELECT 
            c.game_id,
            g.title,
            g.price,
            g.discount_percent,
            (g.price - (g.price * g.discount_percent / 100)) AS final_price
         FROM cart c
         JOIN games g ON c.game_id = g.id
         WHERE c.user_id = ?`,
        [userId]
      );

      if (!cartItems.length) {
        return { success: false, error: 'Cart is empty' };
      }

      const totalAmount = cartItems.reduce((sum, item) => sum + Number(item.final_price), 0);

      await connection.query('START TRANSACTION');

      const [orderResult] = await connection.query(
        `INSERT INTO orders (user_id, total_amount, status) VALUES (?, ?, ?)`,
        [userId, totalAmount, 'pending']
      );

      const orderId = orderResult.insertId;

      for (const item of cartItems) {
        await connection.query(
          `INSERT INTO order_items (order_id, game_id, price) VALUES (?, ?, ?)`,
          [orderId, item.game_id, item.final_price]
        );
      }

      // create pending transaction record
      const txnRef = this.generateTransactionReference();
      await connection.query(
        `INSERT INTO transactions (order_id, payment_method, payment_status, transaction_reference, created_at) VALUES (?, ?, ?, ?, ?)`,
        [orderId, 'credit_card', 'pending', txnRef, new Date()]
      );

      await connection.query('COMMIT');

      console.log('startCheckout: created order', { orderId, userId, totalAmount, itemCount: cartItems.length });
      return { success: true, orderId, totalAmount, itemCount: cartItems.length };
    } catch (err) {
      console.error('startCheckout error:', err);
      if (connection) await connection.query('ROLLBACK');
      return { success: false, error: 'Failed to create pending order' };
    } finally {
      if (connection) connection.release();
    }
  }
  /**
   * Validate card data
   */
  validateCardData(cardData) {
    if (!cardData.cardholderName || !this.validateCardholderName(cardData.cardholderName)) {
      return {
        errorCode: 'INVALID_NAME',
        error: 'Invalid cardholder name. Use letters and spaces only.'
      };
    }

    if (!cardData.cardNumber || !this.validateCardNumber(cardData.cardNumber)) {
      return {
        errorCode: 'INVALID_CARD',
        error: 'Invalid card number. Must be 16 digits.'
      };
    }

    if (!cardData.expiry || !this.validateExpiry(cardData.expiry)) {
      return {
        errorCode: 'INVALID_EXPIRY',
        error: 'Invalid or expired expiry date. Use MM/YY format and a non-expired card.'
      };
    }

    if (!cardData.cvv || !this.validateCVV(cardData.cvv)) {
      return {
        errorCode: 'INVALID_CVV',
        error: 'Invalid CVV. Must be 3 digits.'
      };
    }

    return null;
  }

  /**
   * Get order details
   */
  async getOrder(orderId) {
    const [rows] = await pool.query(
      `SELECT * FROM orders WHERE id = ?`,
      [orderId]
    );
    return rows[0] || null;
  }

  /**
   * Get order items
   */
  async getOrderItems(orderId) {
    const [rows] = await pool.query(
      `SELECT * FROM order_items WHERE order_id = ?`,
      [orderId]
    );
    return rows;
  }

  /**
   * Get transaction
   */
  async getTransaction(orderId) {
    const [rows] = await pool.query(
      `SELECT * FROM transactions WHERE order_id = ?`,
      [orderId]
    );
    return rows[0] || null;
  }

  /**
   * Cancel a pending order and mark transaction as failed
   */
  async cancelCheckout(orderId, userId) {
    let connection;
    try {
      connection = await getConnectionWithRetry(3, 1000);

      const [orders] = await connection.query(`SELECT * FROM orders WHERE id = ?`, [orderId]);
      const order = orders[0];
      if (!order || order.user_id !== userId) {
        return { success: false, error: 'Order not found' };
      }

      if (order.status !== 'pending') {
        return { success: false, error: 'Order cannot be cancelled' };
      }

      await connection.query('START TRANSACTION');

      await connection.query(`UPDATE orders SET status = 'cancelled' WHERE id = ?`, [orderId]);
      await connection.query(`UPDATE transactions SET payment_status = ? WHERE order_id = ?`, ['failed', orderId]);

      await connection.query('COMMIT');

      return { success: true };
    } catch (err) {
      console.error('cancelCheckout error:', err);
      if (connection) await connection.query('ROLLBACK');
      return { success: false, error: 'Failed to cancel order' };
    } finally {
      if (connection) connection.release();
    }
  }
}

module.exports = new CheckoutModel();
