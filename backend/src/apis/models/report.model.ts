import pool from '../../config/db.conf'

export const ReportModel = {
  dashboard(date: string, cb: Function) {
    const sql = `
      SELECT
        (SELECT COALESCE(SUM(total_price),0) FROM Orders WHERE DATE(created_at)=?) AS revenue,
        (SELECT COUNT(*) FROM Customer WHERE DATE(created_at)=?) AS newCustomers,
        (SELECT COUNT(*) FROM Computer WHERE status='in-use') AS activeComputers,
        (SELECT COUNT(*) FROM Orders WHERE status='pending' AND DATE(created_at)=?) AS pendingOrders
    `
    pool.query(sql, [date, date, date], (err: any, rows: any[]) => cb(err, rows[0]))
  },

  revenueDaily(from: string, to: string, cb: Function) {
    const sql = `
      SELECT DATE(created_at) AS day, SUM(total_price) AS revenue
      FROM Orders
      WHERE DATE(created_at) BETWEEN ? AND ?
      GROUP BY day
      ORDER BY day
    `
    pool.query(sql, [from, to], (err: any, rows: any[]) => cb(err, rows))
  },

  computersUsage(from: string, to: string, limit: number, cb: Function) {
    const sql = `
      SELECT c.computer_id, c.name,
             COALESCE(SUM(TIMESTAMPDIFF(MINUTE,o.created_at, NOW())),0) AS totalMinutes,
             COALESCE(SUM(o.total_price),0) AS revenue
      FROM Computer c
      LEFT JOIN Orders o ON c.computer_id = o.computer_id
        AND DATE(o.created_at) BETWEEN ? AND ?
      GROUP BY c.computer_id
      ORDER BY totalMinutes DESC
      LIMIT ?
    `
    pool.query(sql, [from, to, limit], (err: any, rows: any[]) => cb(err, rows))
  },

  topBalance(limit: number, cb: Function) {
    const sql = `
      SELECT customer_id, name, balance
      FROM Customer
      ORDER BY balance DESC
      LIMIT ?
    `
    pool.query(sql, [limit], (err: any, rows: any[]) => cb(err, rows))
  },

  sellingProducts(from: string, to: string, limit: number, cb: Function) {
    const sql = `
      SELECT m.menu_id, m.name, SUM(od.quantity) AS qtySold, SUM(od.price * od.quantity) AS revenue
      FROM OrderDetail od
      JOIN Orders o ON od.order_id = o.order_id
      JOIN Menu m ON od.menu_id = m.menu_id
      WHERE DATE(o.created_at) BETWEEN ? AND ?
      GROUP BY m.menu_id
      ORDER BY qtySold DESC
      LIMIT ?
    `
    pool.query(sql, [from, to, limit], (err: any, rows: any[]) => cb(err, rows))
  },

  inventoryAlert(threshold: number, cb: Function) {
    const sql = `
      SELECT i.inventory_id, i.name, i.quantity, m.name AS product
      FROM Inventory i
      LEFT JOIN Menu m ON i.menu_id = m.menu_id
      WHERE i.quantity <= ?
    `
    pool.query(sql, [threshold], (err: any, rows: any[]) => cb(err, rows))
  }
}
