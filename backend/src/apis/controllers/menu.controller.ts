import { Request, Response } from 'express'
import { MenuService } from '../services/menu.service'

export class MenuController {
  static getAll(req: Request, res: Response): void {
    MenuService.getAll((err, rows) => {
      if (err) return res.status(500).json({ success: false, message: err.message })
      res.json({ success: true, data: rows })
    })
  }
}
