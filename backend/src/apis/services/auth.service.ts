import { AuthModel } from '../models/user.model'
import { hashPwd, comparePwd } from '../utils/bcrypt.util'
import { signToken } from '../utils/jwt.util'

export class AuthService {
  static register(
    dto: {
      name: string
      username: string
      password: string
      phone?: string
      email?: string
    },
    callback: (err: Error | null, insertId?: number) => void
  ): void {
    AuthModel.findByUsername(dto.username, (err, row) => {
      if (err) return callback(err)
      if (row) return callback(new Error('Tên tài khoản đã tồn tại'))

      hashPwd(dto.password)
        .then((hash) => {
          AuthModel.createCustomer({ ...dto, password: hash }, callback)
        })
        .catch(callback)
    })
  }

  static login(
    username: string,
    password: string,
    callback: (err: Error | null, token?: string, user?: any) => void
  ): void {
    AuthModel.findByUsername(username, (err, user) => {
      if (err) return callback(err)
      if (!user) return callback(new Error('Sai tài khoản hoặc mật khẩu'))

      comparePwd(password, user.password)
        .then((ok) => {
          if (!ok) return callback(new Error('Sai tài khoản hoặc mật khẩu'))
          const token = signToken({
            id: user.employee_id,
            role: user.role_id,
            username: user.username
          })
          const { password, ...safeUser } = user

          callback(null, token, safeUser)
        })
        .catch(callback)
    })
  }

  static loginCustomer(
    username: string,
    password: string,
    callback: (err: Error | null, token?: string, user?: any) => void
  ): void {
    AuthModel.findByUsernameCustomer(username, (err, user) => {
      if (err) return callback(err)
      if (!user) return callback(new Error('Sai tài khoản hoặc mật khẩu'))

      comparePwd(password, user.password)
        .then((ok) => {
          if (!ok) return callback(new Error('Sai tài khoản hoặc mật khẩu'))
          const token = signToken({
            id: user.customer_id,
            role: user.role_id,
            username: user.username
          })
          const { password, ...safeUser } = user

          callback(null, token, safeUser)
        })
        .catch(callback)
    })
  }
}
