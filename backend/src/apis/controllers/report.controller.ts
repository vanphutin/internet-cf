import { Request, Response } from 'express'
import { ReportService } from '../services/report.service'

export class ReportController {
  static dashboard(req: Request, res: Response): void {
    const date = (req.query.date as string) || new Date().toISOString().slice(0, 10)
    ReportService.dashboard(date, (err: any, data: any) => {
      if (err) return res.status(500).json({ success: false, message: err.message })
      res.json({ success: true, data })
    })
  }

  static revenueDaily(req: Request, res: Response): void {
    const from = (req.query.from as string) || new Date().toISOString().slice(0, 10)
    const to = (req.query.to as string) || from
    ReportService.revenueDaily(from, to, (err: any, data: any) => {
      if (err) return res.status(500).json({ success: false, message: err.message })
      res.json({ success: true, data })
    })
  }

  static computersUsage(req: Request, res: Response): void {
    const from = (req.query.from as string) || new Date().toISOString().slice(0, 10)
    const to = (req.query.to as string) || from
    const limit = Number(req.query.limit) || 10
    ReportService.computersUsage(from, to, limit, (err: any, data: any) => {
      if (err) return res.status(500).json({ success: false, message: err.message })
      res.json({ success: true, data })
    })
  }

  static revenueMonthly(req: Request, res: Response): void {
    const year = Number(req.query.year) || new Date().getFullYear()
    ReportService.revenueMonthly(year, (err: any, data: any) => {
      if (err) return res.status(500).json({ success: false, message: err.message })
      res.json({ success: true, data })
    })
  }

  static computersStatus(req: Request, res: Response): void {
    ReportService.computersStatus((err: any, data: any) => {
      if (err) return res.status(500).json({ success: false, message: err.message })
      res.json({ success: true, data })
    })
  }

  static topBalance(req: Request, res: Response): void {
    const from = (req.query.from as string) || new Date().toISOString().slice(0, 10)
    const to = (req.query.to as string) || from
    const limit = Number(req.query.limit) || 10
    ReportService.customersTopSpending(from, to, limit, (err: any, data: any) => {
      if (err) return res.status(500).json({ success: false, message: err.message })
      res.json({ success: true, data })
    })
  }

  static sellingProducts(req: Request, res: Response): void {
    const from = (req.query.from as string) || new Date().toISOString().slice(0, 10)
    const to = (req.query.to as string) || from
    const limit = Number(req.query.limit) || 10
    ReportService.productsTopSelling(from, to, limit, (err: any, data: any) => {
      if (err) return res.status(500).json({ success: false, message: err.message })
      res.json({ success: true, data })
    })
  }

  static inventoryAlert(req: Request, res: Response): void {
    const threshold = Number(req.query.threshold) || 10
    ReportService.inventoryLowStock(threshold, (err: any, data: any) => {
      if (err) return res.status(500).json({ success: false, message: err.message })
      res.json({ success: true, data })
    })
  }
}
