import { Request, Response } from 'express'
import { DashboardService } from '../services/dashboard.service'

export class DashboardController {
  static summary(req: Request, res: Response): void {
    const date = (req.query.date as string) || new Date().toISOString().slice(0, 10)
    DashboardService.summary(date, (err: any, data: any) => {
      if (err) return res.status(500).json({ success: false, message: err.message })
      res.json({ success: true, data })
    })
  }
}
