import { Router } from 'express'
import { ReportController } from '../controllers/report.controller'
const router = Router()

router.get('/dashboard', ReportController.dashboard)
router.get('/revenue/daily', ReportController.revenueDaily)
router.get('/computers/usage', ReportController.computersUsage)
router.get('/customers/top-balance', ReportController.topBalance)
router.get('/products/selling', ReportController.sellingProducts)
router.get('/inventory/alert', ReportController.inventoryAlert)
router.get('/revenue/monthly', ReportController.revenueMonthly)
router.get('/computers/status', ReportController.computersStatus)
router.get('/customers/top', ReportController.topBalance)
router.get('/products/top', ReportController.sellingProducts)
router.get('/inventory/low-stock', ReportController.inventoryAlert)
export default router
