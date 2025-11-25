import { Request, Response } from 'express'
import { ComputerService } from '../services/computer.service'

export class ComputerController {
  static list(req: Request, res: Response): void {
    const filters = {
      status: req.query.status as any,
      location: req.query.location as string,
      q: req.query.q as string,
      limit: Number(req.query.limit) || 50,
      offset: Number(req.query.offset) || 0
    }

    ComputerService.list(filters, (err, rows) => {
      if (err) return res.status(500).json({ success: false, message: err.message })
      res.json({ success: true, data: rows })
    })
  }

  static getById(req: Request, res: Response): void {
    const id = Number(req.params.id)
    ComputerService.getById(id, (err, row) => {
      if (err) return res.status(500).json({ success: false, message: err.message })
      if (!row) return res.status(404).json({ success: false, message: 'Không tìm thấy máy' })
      res.json({ success: true, data: row })
    })
  }

  static create(req: Request, res: Response): void {
    const { name, status, ip_address, location } = req.body
    if (!name || !ip_address) {
      res.status(400).json({ success: false, message: 'Thiếu name hoặc ip_address' })
      return
    }
    ComputerService.create({ name, status, ip_address, location }, (err, insertId) => {
      if (err) return res.status(500).json({ success: false, message: err.message })
      res.status(201).json({ success: true, insertId })
    })
  }

  static update(req: Request, res: Response): void {
    const id = Number(req.params.id)
    ComputerService.update(id, req.body, (err) => {
      if (err) return res.status(500).json({ success: false, message: err.message })
      res.json({ success: true, message: 'Cập nhật thành công' })
    })
  }

  static delete(req: Request, res: Response): void {
    const id = Number(req.params.id)
    ComputerService.delete(id, (err) => {
      if (err) return res.status(500).json({ success: false, message: err.message })
      res.json({ success: true, message: 'Đã xóa' })
    })
  }
}
