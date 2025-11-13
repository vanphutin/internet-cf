import pool from '../../config/db.conf'
import { Computer, ComputerStatus } from '../types'

export const ComputerModel = {
  list(
    filters: { status?: ComputerStatus; location?: string; limit?: number; offset?: number },
    callback: (err: Error | null, rows?: Computer[]) => void
  ) {
    let sql = `SELECT computer_id, name, status, ip_address, location, created_at FROM Computer`
    const where: string[] = []
    const params: any[] = []

    if (filters.status) {
      where.push('status = ?')
      params.push(filters.status)
    }
    if (filters.location) {
      where.push('location LIKE ?')
      params.push(`%${filters.location}%`)
    }
    if (where.length) sql += ' WHERE ' + where.join(' AND ')

    sql += ' LIMIT ? OFFSET ?'
    params.push(filters.limit || 10, filters.offset || 0)

    pool.query(sql, params, (err, rows: any[]) => {
      if (err) return callback(err)
      callback(null, rows)
    })
  },

  findById(id: number, callback: (err: Error | null, row?: Computer) => void) {
    pool.query(
      `SELECT computer_id, name, status, ip_address, location, created_at
       FROM Computer WHERE computer_id = ?`,
      [id],
      (err, rows: any[]) => {
        if (err) return callback(err)
        callback(null, rows[0] || null)
      }
    )
  },

  create(
    body: Pick<Computer, 'name' | 'status' | 'ip_address' | 'location'>,
    callback: (err: Error | null, insertId?: number) => void
  ) {
    const { name, status = 'available', ip_address, location } = body
    pool.query(
      `INSERT INTO Computer  (name, status, ip_address, location)
       VALUES (?, ?, ?, ?)`,
      [name, status, ip_address, location || null],
      (err, res: any) => {
        if (err) return callback(err)
        callback(null, res.insertId)
      }
    )
  },

  update(
    id: number,
    body: Partial<Pick<Computer, 'name' | 'status' | 'ip_address' | 'location'>>,
    callback: (err: Error | null) => void
  ) {
    const fields: string[] = []
    const values: any[] = []

    if (body.name !== undefined) {
      fields.push('name = ?')
      values.push(body.name)
    }
    if (body.status !== undefined) {
      fields.push('status = ?')
      values.push(body.status)
    }
    if (body.ip_address !== undefined) {
      fields.push('ip_address = ?')
      values.push(body.ip_address)
    }
    if (body.location !== undefined) {
      fields.push('location = ?')
      values.push(body.location)
    }
    if (!fields.length) return callback(new Error('Không có gì để cập nhật'))

    values.push(id)
    pool.query(`UPDATE Computer  SET ${fields.join(', ')} WHERE computer_id = ?`, values, (err) => callback(err))
  },

  delete(id: number, callback: (err: Error | null) => void) {
    pool.query('DELETE FROM Computer  WHERE computer_id = ?', [id], (err) => callback(err))
  }
}
