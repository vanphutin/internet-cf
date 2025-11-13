import { Request, Response } from 'express'
import { CustomerService } from '../services/customer.service'

export class CustomerController {
  static list(req: Request, res: Response): void {
    const filters = {
      username: req.query.username as string,
      phone: req.query.phone as string,
      limit: Number(req.query.limit) || 10,
      offset: Number(req.query.offset) || 0
    }
    CustomerService.list(filters, (err, rows) => {
      if (err) return res.status(500).json({ success: false, message: err.message })
      res.json({ success: true, data: rows })
    })
  }

  static getById(req: Request, res: Response): void {
    const id = Number(req.params.id)
    CustomerService.getById(id, (err, row) => {
      if (err) return res.status(500).json({ success: false, message: err.message })
      if (!row) return res.status(404).json({ success: false, message: 'Không tìm thấy khách' })
      res.json({ success: true, data: row })
    })
  }

  static create(req: Request, res: Response): void {
    const { name, username, password, phone, email } = req.body
    if (!name || !username || !password) {
      res.status(400).json({ success: false, message: 'Thiếu trường bắt buộc' })
      return
    }
    CustomerService.create({ name, username, password, phone, email }, (err, insertId) => {
      if (err) return res.status(400).json({ success: false, message: err.message })
      res.status(201).json({ success: true, insertId })
    })
  }

  static update(req: Request, res: Response): void {
    const id = Number(req.params.id)
    CustomerService.update(id, req.body, (err) => {
      if (err) return res.status(500).json({ success: false, message: err.message })
      res.json({ success: true, message: 'Cập nhật thành công' })
    })
  }

  static topup(req: Request, res: Response): void {
    const id = Number(req.params.id)
    const amount = Number(req.body.amount)
    if (!amount) {
      res.status(400).json({ success: false, message: 'Thiếu hoặc sai amount' })
      return
    }
    CustomerService.topup(id, amount, (err) => {
      if (err) return res.status(400).json({ success: false, message: err.message })
      res.json({ success: true, message: 'Nạp tiền thành công' })
    })
  }

  static delete(req: Request, res: Response): void {
    const id = Number(req.params.id)
    CustomerService.delete(id, (err) => {
      if (err) return res.status(500).json({ success: false, message: err.message })
      res.json({ success: true, message: 'Đã xóa khách' })
    })
  }
}
