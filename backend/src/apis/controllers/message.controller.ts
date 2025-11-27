import { Request, Response } from 'express'
import { MessageModel } from '../models/message.model'

export class MessageController {
  // GET /api/v1/messages
  // optional query: customerId => conversation for that customer
  static async list(req: Request, res: Response): Promise<void> {
    try {
      const customerId = req.query.customerId ? Number(req.query.customerId) : null
      const limit = Number(req.query.limit) || (customerId ? 1000 : 200)

      if (customerId) {
        MessageModel.getConversation(customerId, limit, (err, rows) => {
          if (err) return res.status(500).json({ success: false, message: err.message })
          res.json({ success: true, data: rows || [] })
        })
      } else {
        MessageModel.list(limit, (err, rows) => {
          if (err) return res.status(500).json({ success: false, message: err.message })
          res.json({ success: true, data: rows || [] })
        })
      }
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message })
    }
  }
}
