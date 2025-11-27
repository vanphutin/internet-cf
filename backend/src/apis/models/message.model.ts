import pool from '../../config/db.conf'
import { UserRole } from '../types'

export const MessageModel = {
  create(
    data: { senderId: number; senderRole: UserRole; receiverId: number; receiverRole: UserRole; content: string },
    cb: (err: Error | null, insertId?: number) => void
  ) {
    const sql = `INSERT INTO Message (sender_id, sender_role, receiver_id, receiver_role, content) VALUES (?,?,?,?,?)`
    pool.query(
      sql,
      [data.senderId, data.senderRole, data.receiverId, data.receiverRole, data.content],
      (err, res: any) => {
        if (err) {
          console.error('Message insert SQL err:', err.message, 'SQL:', sql, 'Params:', [
            data.senderId,
            data.senderRole,
            data.receiverId,
            data.receiverRole,
            data.content
          ]) // Debug full
          return cb(err)
        }
        cb(null, res.insertId)
      }
    )
  },

  getHistory(userId: number, role: UserRole, limit: number, cb: (err: Error | null, rows?: any[]) => void) {
    const sql = `
      SELECT m.message_id, m.sender_id, m.sender_role, m.receiver_id, m.receiver_role, m.content, m.sent_at,
             s.name  AS sender_name,
             r.name  AS receiver_name
      FROM Message m
      LEFT JOIN Customer s ON m.sender_id   = s.customer_id AND m.sender_role   = 'customer'
      LEFT JOIN Customer r ON m.receiver_id = r.customer_id AND m.receiver_role = 'customer'
      LEFT JOIN Employee sa ON m.sender_id   = sa.employee_id AND m.sender_role   = 'employee'
      LEFT JOIN Employee ra ON m.receiver_id = ra.employee_id AND m.receiver_role = 'employee'
      WHERE (m.sender_id = ? AND m.sender_role = ?) OR (m.receiver_id = ? AND m.receiver_role = ?)
      ORDER BY m.sent_at DESC
      LIMIT ?
    `
    pool.query(sql, [userId, role, userId, role, limit], (err, rows: any[]) => {
      if (err) return cb(err)
      cb(null, rows)
    })
  },

  // trả về danh sách tin nhắn (mới nhất trước) - dùng cho admin list
  list(limit = 200, cb: (err: Error | null, rows?: any[]) => void) {
    const sql = `
      SELECT m.message_id, m.sender_id, m.sender_role, m.receiver_id, m.receiver_role, m.content, m.sent_at,
             COALESCE(s.name, sa.name) AS sender_name,
             COALESCE(r.name, ra.name) AS receiver_name
      FROM Message m
      LEFT JOIN Customer s ON m.sender_id   = s.customer_id   AND m.sender_role   = 'customer'
      LEFT JOIN Customer r ON m.receiver_id = r.customer_id  AND m.receiver_role = 'customer'
      LEFT JOIN Employee sa ON m.sender_id   = sa.employee_id AND m.sender_role   = 'employee'
      LEFT JOIN Employee ra ON m.receiver_id = ra.employee_id AND m.receiver_role = 'employee'
      ORDER BY m.sent_at DESC
      LIMIT ?
    `
    pool.query(sql, [limit], (err, rows: any[]) => {
      if (err) return cb(err)
      cb(null, rows)
    })
  },

  // lấy hội thoại của 1 customer với employee (trả theo thứ tự thời gian tăng)
  getConversation(customerId: number, limit = 1000, cb: (err: Error | null, rows?: any[]) => void) {
    const sql = `
      SELECT m.message_id, m.sender_id, m.sender_role, m.receiver_id, m.receiver_role, m.content, m.sent_at,
             COALESCE(s.name, sa.name) AS sender_name,
             COALESCE(r.name, ra.name) AS receiver_name
      FROM Message m
      LEFT JOIN Customer s ON m.sender_id   = s.customer_id   AND m.sender_role   = 'customer'
      LEFT JOIN Customer r ON m.receiver_id = r.customer_id  AND m.receiver_role = 'customer'
      LEFT JOIN Employee sa ON m.sender_id   = sa.employee_id AND m.sender_role   = 'employee'
      LEFT JOIN Employee ra ON m.receiver_id = ra.employee_id AND m.receiver_role = 'employee'
      WHERE (m.sender_role = 'customer' AND m.sender_id = ?)
         OR (m.receiver_role = 'customer' AND m.receiver_id = ?)
      ORDER BY m.sent_at ASC
      LIMIT ?
    `
    pool.query(sql, [customerId, customerId, limit], (err, rows: any[]) => {
      if (err) return cb(err)
      cb(null, rows)
    })
  }
}
