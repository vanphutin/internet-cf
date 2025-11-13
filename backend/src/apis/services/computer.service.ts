import { ComputerModel } from '../models/computer.model'
import { Computer, ComputerStatus } from '../types'

export class ComputerService {
  static list(
    filters: { status?: ComputerStatus; location?: string; limit?: number; offset?: number },
    callback: (err: Error | null, rows?: Computer[]) => void
  ) {
    ComputerModel.list(filters, callback)
  }

  static getById(id: number, callback: (err: Error | null, row?: Computer) => void) {
    ComputerModel.findById(id, callback)
  }

  static create(
    data: Pick<Computer, 'name' | 'status' | 'ip_address' | 'location'>,
    callback: (err: Error | null, insertId?: number) => void
  ) {
    ComputerModel.create(data, callback)
  }

  static update(
    id: number,
    data: Partial<Pick<Computer, 'name' | 'status' | 'ip_address' | 'location'>>,
    callback: (err: Error | null) => void
  ) {
    ComputerModel.update(id, data, callback)
  }

  static delete(id: number, callback: (err: Error | null) => void) {
    ComputerModel.delete(id, callback)
  }
}
