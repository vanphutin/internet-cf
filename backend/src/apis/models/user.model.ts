import pool from '../../config/db.conf'
import { ResultSetHeader } from 'mysql2'
import { Customer, Employee } from '../types'

export const AuthModel = {
  findByUsername(username: string, callback: (err: Error | null, row?: Employee & { role_name: string }) => void) {
    const sql = `
    SELECT 
      e.employee_id AS id,
      e.username,
      e.password,
      e.name,
      e.phone,
      e.email,
      e.role_id,
      r.role_name
    FROM Employee e
    JOIN UserRole r ON e.role_id = r.role_id
    WHERE e.username = ?
    LIMIT 1
  `

    pool.query(sql, [username], (err, rows: any[]) => {
      if (err) return callback(err)
      callback(null, rows[0] || undefined)
    })
  },

  findByUsernameCustomer(username: string, callback: (err: Error | null, row?: Customer) => void) {
    const sql = ` SELECT c.customer_id AS id, c.username, c.password, c.name,  balance, c.current_computer_id, r.role_name, c.phone, c.email, c.created_at
     FROM Customer c
     JOIN UserRole r ON c.role_id = r.role_id
     WHERE c.username = ? 
     LIMIT 1 `

    pool.query(sql, [username], (err, rows: any[]) => {
      if (err) return callback(err)
      callback(null, rows[0] || undefined)
    })
  },
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
