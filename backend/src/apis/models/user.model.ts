import pool from '../../config/db.conf'
import { ResultSetHeader } from 'mysql2'
import { Customer } from '../types'

export const AuthModel = {
  /* Kiểm tra tài khoản tồn tại (cả Customer & Employee) */
  findByUsername(username: string, callback: (err: Error | null, row?: Customer) => void) {
    const sql = `
      SELECT customer_id AS id, username, password, name, role_id, balance, current_computer_id
      FROM Customer WHERE username = ?
      UNION
      SELECT employee_id AS id, username, password, name, role_id, NULL, NULL
      FROM Employee WHERE username = ?
      LIMIT 1
    `
    pool.query(sql, [username, username], (err, rows: any[]) => {
      if (err) return callback(err)
      callback(null, rows[0] || undefined)
    })
  },

  /* Tạo khách hàng mới (role_id mặc định 3) */
  createCustomer(
    data: {
      name: string
      username: string
      password: string
      phone?: string
      email?: string
    },
    callback: (err: Error | null, insertId?: number) => void
  ) {
    const { name, username, password, phone, email } = data
    const sql =
      'INSERT INTO Customer (name, username, password, phone, email, role_id, balance) VALUES (?, ?, ?, ?, ?, 3, 0)'
    pool.query(sql, [name, username, password, phone || null, email || null], (err, res: ResultSetHeader) => {
      if (err) return callback(err)
      callback(null, res.insertId)
    })
  }
}
