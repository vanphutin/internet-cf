import pool from '../../config/db.conf'
import { Customer } from '../types'

export const CustomerModel = {
  list(
    filters: { username?: string; phone?: string; limit?: number; offset?: number },
    callback: (err: Error | null, rows?: Customer[]) => void
  ) {
    let sql = `SELECT customer_id, name, username, balance, phone, email, role_id, current_computer_id, created_at FROM Customer`
    const where: string[] = []
    const params: any[] = []

    if (filters.username) {
      where.push('username LIKE ?')
      params.push(`%${filters.username}%`)
    }
    if (filters.phone) {
      where.push('phone = ?')
      params.push(filters.phone)
    }
    if (where.length) sql += ' WHERE ' + where.join(' AND ')

    sql += ' LIMIT ? OFFSET ?'
    params.push(filters.limit || 10, filters.offset || 0)

    pool.query(sql, params, (err, rows: any[]) => {
      if (err) return callback(err)
      callback(null, rows)
    })
  },

  findById(id: number, callback: (err: Error | null, row?: Customer) => void) {
    pool.query(
      `SELECT customer_id, name, username, balance, phone, email, role_id, current_computer_id, created_at
       FROM Customer WHERE customer_id = ?`,
      [id],
      (err, rows: any[]) => {
        if (err) return callback(err)
        callback(null, rows[0] || null)
      }
    )
  },

  create(
    data: Pick<Customer, 'name' | 'username' | 'password' | 'phone' | 'email'>,
    callback: (err: Error | null, insertId?: number) => void
  ) {
    const { name, username, password, phone, email } = data
    pool.query(
      `INSERT INTO Customer (name, username, password, phone, email, role_id, balance)
       VALUES (?, ?, ?, ?, ?, 3, 0)`,
      [name, username, password, phone || null, email || null],
      (err, res: any) => {
        if (err) return callback(err)
        callback(null, res.insertId)
      }
    )
  },

  update(id: number, body: Partial<Pick<Customer, 'name' | 'phone' | 'email'>>, callback: (err: Error | null) => void) {
    const fields: string[] = []
    const values: any[] = []
    if (body.name !== undefined) {
      fields.push('name = ?')
      values.push(body.name)
    }
    if (body.phone !== undefined) {
      fields.push('phone = ?')
      values.push(body.phone)
    }
    if (body.email !== undefined) {
      fields.push('email = ?')
      values.push(body.email)
    }
    if (!fields.length) return callback(new Error('Không có gì để cập nhật'))
    values.push(id)
    pool.query(`UPDATE Customer SET ${fields.join(', ')} WHERE customer_id = ?`, values, (err) => callback(err))
  },

  updateBalance(id: number, amount: number, callback: (err: Error | null) => void) {
    pool.query(`UPDATE Customer SET balance = balance + ? WHERE customer_id = ?`, [amount, id], (err) => callback(err))
  },

  delete(id: number, callback: (err: Error | null) => void) {
    pool.query('DELETE FROM Customer WHERE customer_id = ?', [id], (err) => callback(err))
  }
}
