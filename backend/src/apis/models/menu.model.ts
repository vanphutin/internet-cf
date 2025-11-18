import pool from '../../config/db.conf'
import { Menu } from '../types'

export const MenuModel = {
  // đã có list phân trang, thêm riêng lấy all
  getAll(callback: (err: Error | null, rows?: Menu[]) => void) {
    const sql = `SELECT menu_id, name, description, price, stock, created_at FROM Menu ORDER BY name`
    pool.query(sql, (err, rows: any[]) => {
      if (err) return callback(err)
      callback(null, rows)
    })
  }
}
