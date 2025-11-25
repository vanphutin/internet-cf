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
  },
  revenueMonthly(year: number, cb: Function) {
    const sql = `
      SELECT MONTH(created_at) AS month, SUM(total_price) AS revenue
      FROM Orders
      WHERE YEAR(created_at) = ?
      GROUP BY month
      ORDER BY month
    `
    pool.query(sql, [year], (err: any, rows: any[]) => {
      if (err) return cb(err)
      // trả về 12 tháng, tháng nào không có thì 0
      const months = Array.from({ length: 12 }, (_, i) => i + 1)
      const map = new Map(rows.map((r: any) => [r.month, r.revenue]))
      const data = months.map((m) => map.get(m) || 0)
      cb(null, { labels: months, data })
    })
  },

  // 2. Trạng thái máy realtime
  computersStatus(cb: Function) {
    const sql = `
      SELECT status, COUNT(*) AS count
      FROM Computer
      GROUP BY status
    `
    pool.query(sql, [], (err: any, rows: any[]) => {
      if (err) return cb(err)
      const init = { available: 0, inUse: 0, maintenance: 0 }
      rows.forEach((r: any) => {
        const key = r.status === 'in-use' ? 'inUse' : r.status
        init[key as keyof typeof init] = r.count
      })
      cb(null, init)
    })
  },

  // 3. Khách hàng chi tiêu nhiều nhất trong khoảng thời gian
  customersTopSpending(from: string, to: string, limit: number, cb: Function) {
    const sql = `
      SELECT c.customer_id, c.name, c.username, SUM(o.total_price) AS totalSpending
      FROM Orders o
      JOIN Customer c ON o.customer_id = c.customer_id
      WHERE DATE(o.created_at) BETWEEN ? AND ?
      GROUP BY c.customer_id
      ORDER BY totalSpending DESC
      LIMIT ?
    `
    pool.query(sql, [from, to, limit], (err: any, rows: any[]) => cb(err, rows))
  },

  // 4. Sản phẩm bán chạy nhất
  productsTopSelling(from: string, to: string, limit: number, cb: Function) {
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

  // 5. Tồn kho dưới ngưỡng
  inventoryLowStock(threshold: number, cb: Function) {
    const sql = `
      SELECT inventory_id, name, quantity, ? AS threshold
      FROM Inventory
      WHERE quantity <= ?
    `
    pool.query(sql, [threshold, threshold], (err: any, rows: any[]) => cb(err, rows))
  }
}
