import pool from '../../config/db.conf'

export const DashboardModel = {
  summary(date: string, cb: Function) {
    const sql = `
      SELECT
        (SELECT COALESCE(SUM(total_price),0)
         FROM Orders
         WHERE DATE(created_at) = ?) AS revenueToday,

        (SELECT COUNT(*)
         FROM Customer
         WHERE current_computer_id IS NOT NULL) AS onlineCustomers,

        (SELECT COUNT(*)
         FROM Computer
         WHERE status = 'in-use') AS inUseComputers,

        (SELECT COUNT(*)
         FROM Computer
         WHERE status = 'maintenance') AS maintenanceComputers
    `
    pool.query(sql, [date], (err: any, rows: any[]) => {
      if (err) return cb(err)
      const stats = rows[0]

      // 5 hoạt động gần đây (order mới nhất)
      const actSql = `
        SELECT created_at AS time, CONCAT('Đơn hàng #', order_id, ' - ', total_price, '₫') AS text
        FROM Orders
        WHERE DATE(created_at) = ?
        ORDER BY created_at DESC
        LIMIT 5
      `
      pool.query(actSql, [date], (e: any, acts: any[]) => {
        if (e) return cb(e)
        cb(null, {
          revenueToday: stats.revenueToday,
          onlineCustomers: stats.onlineCustomers,
          inUseComputers: stats.inUseComputers,
          maintenanceComputers: stats.maintenanceComputers,
          activities: acts.map((a: any) => ({
            time: a.time.toLocaleTimeString('vi-VN'),
            text: a.text
          }))
        })
      })
    })
  }
}
