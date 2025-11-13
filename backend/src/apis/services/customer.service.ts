import { CustomerModel } from '../models/customer.model'
import { hashPwd } from '../utils/bcrypt.util'
import { Customer } from '../types'

export class CustomerService {
  static list = CustomerModel.list
  static getById = CustomerModel.findById

  static create(
    data: Pick<Customer, 'name' | 'username' | 'password' | 'phone' | 'email'>,
    callback: (err: Error | null, insertId?: number) => void
  ) {
    hashPwd(data.password)
      .then((hash) => CustomerModel.create({ ...data, password: hash }, callback))
      .catch((e) => callback(e))
  }

  static update = CustomerModel.update

  static topup(id: number, amount: number, callback: (err: Error | null) => void) {
    if (amount === 0) return callback(new Error('Số tiền không hợp lệ'))
    CustomerModel.updateBalance(id, amount, callback)
  }

  static delete = CustomerModel.delete
}
