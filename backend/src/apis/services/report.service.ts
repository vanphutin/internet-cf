import { ReportModel } from '../models/report.model'

export class ReportService {
  static dashboard(date: string, cb: Function) {
    ReportModel.dashboard(date, cb)
  }
  static revenueDaily(from: string, to: string, cb: Function) {
    ReportModel.revenueDaily(from, to, cb)
  }
  static computersUsage(from: string, to: string, limit: number, cb: Function) {
    ReportModel.computersUsage(from, to, limit, cb)
  }
  static topBalance(limit: number, cb: Function) {
    ReportModel.topBalance(limit, cb)
  }
  static sellingProducts(from: string, to: string, limit: number, cb: Function) {
    ReportModel.sellingProducts(from, to, limit, cb)
  }
  static inventoryAlert(threshold: number, cb: Function) {
    ReportModel.inventoryAlert(threshold, cb)
  }
  static revenueMonthly(year: number, cb: Function) {
    ReportModel.revenueMonthly(year, cb)
  }
  static computersStatus(cb: Function) {
    ReportModel.computersStatus(cb)
  }
  static customersTopSpending(from: string, to: string, limit: number, cb: Function) {
    ReportModel.customersTopSpending(from, to, limit, cb)
  }
  static productsTopSelling(from: string, to: string, limit: number, cb: Function) {
    ReportModel.productsTopSelling(from, to, limit, cb)
  }
  static inventoryLowStock(threshold: number, cb: Function) {
    ReportModel.inventoryLowStock(threshold, cb)
  }
}
