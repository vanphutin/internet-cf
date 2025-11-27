import pool from '../../config/db.conf'

export const TopupModel = {
  // customer gửi yêu cầu
  createRequest(customerId: number, amount: number, cb: (err: Error | null, insertId?: number) => void) {
    const sql = `INSERT INTO topup_request (customer_id, amount, status, created_at) VALUES (?, ?, 'pending', NOW())`
    pool.query(sql, [customerId, amount], (err, res: any) => {
      if (err) return cb(err)
      cb(null, res.insertId)
    })
  },

  // admin duyệt (thêm status param)
  approve(
    requestId: number,
    adminId: number,
    status: 'approved' | 'rejected' = 'approved',
    cb: (err: Error | null, affected?: boolean) => void
  ) {
    const conn = pool as any
    conn.getConnection((e: any, client: any) => {
      if (e) return cb(e)
      client.beginTransaction((err: any) => {
        if (err) return client.rollback(() => cb(err))

        // 1. Update status request
        client.query(
          `UPDATE topup_request SET status=?, approved_by=? WHERE id=?`,
          [status, adminId, requestId],
          (err1: any) => {
            if (err1) return client.rollback(() => cb(err1))
            if (status === 'approved') {
              // 2. Chỉ cộng tiền nếu approved
              client.query(
                `UPDATE Customer SET balance = balance + (SELECT amount FROM topup_request WHERE id=?) WHERE customer_id = (SELECT customer_id FROM topup_request WHERE id=?)`,
                [requestId, requestId],
                (err2: any) => {
                  if (err2) return client.rollback(() => cb(err2))
                  client.commit((err3: any) => {
                    if (err3) return client.rollback(() => cb(err3))
                    cb(null, true)
                  })
                }
              )
            } else {
              // Reject: chỉ commit status
              client.commit((err3: any) => {
                if (err3) return client.rollback(() => cb(err3))
                cb(null, true)
              })
            }
          }
        )
      })
    })
  },

  // lấy 1 request (kèm tên customer)
  getOne(id: number, cb: (err: Error | null, row?: any) => void) {
    const sql = `SELECT r.*, c.name AS customer_name FROM topup_request r JOIN Customer c ON r.customer_id = c.customer_id WHERE r.id = ?`
    pool.query(sql, [id], (err, rows: any[]) => cb(err, rows[0]))
  }
}
