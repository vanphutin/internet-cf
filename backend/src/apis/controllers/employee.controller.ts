import { Request, Response } from 'express'
import pool from '../../config/db.conf' // Assume path

export class EmployeeController {
  static async list(req: Request, res: Response): Promise<void> {
    try {
      pool.query('SELECT employee_id, name, email FROM Employee LIMIT 10', (err: any, rows: any[]) => {
        if (err) return res.status(500).json({ success: false, message: err.message })
        res.json({ success: true, data: rows })
      })
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message })
    }
  }
}
