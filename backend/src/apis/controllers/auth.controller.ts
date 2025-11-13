import { Request, Response } from 'express'
import { AuthService } from '../services/auth.service'

export class AuthController {
  static register(req: Request, res: Response): void {
    const { username, password, rePassword, name, phone, email } = req.body
    if (!username || !password || !rePassword) {
      res.status(400).json({ success: false, message: 'Thiếu trường bắt buộc' })
      return
    }
    if (password !== rePassword) {
      res.status(400).json({ success: false, message: 'Mật khẩu nhập lại không khớp' })
      return
    }

    AuthService.register({ name, username, password, phone, email }, (err, insertId) => {
      if (err) return res.status(400).json({ success: false, message: err.message })
      res.status(201).json({ success: true, message: 'Đăng ký thành công', id: insertId })
    })
  }

  static login(req: Request, res: Response): void {
    const { username, password } = req.body
    if (!username || !password) {
      res.status(400).json({ success: false, message: 'Thiếu tài khoản hoặc mật khẩu' })
      return
    }

    AuthService.login(username, password, (err, token, user) => {
      if (err) return res.status(401).json({ success: false, message: err.message })
      res.json({ success: true, token, user })
    })
  }
}
