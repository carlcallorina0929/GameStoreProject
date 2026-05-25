const db = require("../config/db");

const getTotalRevenue = async () => {
  const [rows] = await db.query(
    `SELECT COALESCE(SUM(o.total_amount), 0) AS total_revenue
     FROM transactions t
     INNER JOIN orders o ON o.id = t.order_id
     WHERE t.payment_status = 'paid'`,
  );

  return Number(rows[0]?.total_revenue ?? 0);
};

const getSalesVolumeOverTime = async () => {
  const [rows] = await db.query(
    `SELECT
      DATE(COALESCE(t.paid_at, t.created_at)) AS sale_date,
      COUNT(DISTINCT o.id) AS orders_count,
      COALESCE(SUM(o.total_amount), 0) AS revenue
     FROM transactions t
     INNER JOIN orders o ON o.id = t.order_id
     WHERE t.payment_status = 'paid'
     GROUP BY DATE(COALESCE(t.paid_at, t.created_at))
     ORDER BY sale_date ASC`,
  );

  return rows;
};

module.exports = {
  getTotalRevenue,
  getSalesVolumeOverTime,
};
