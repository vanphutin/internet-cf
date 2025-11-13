import { Router } from 'express'
import { ReportController } from '../controllers/report.controller'
const router = Router()

router.get('/dashboard', ReportController.dashboard)
router.get('/revenue/daily', ReportController.revenueDaily)
router.get('/computers/usage', ReportController.computersUsage)
router.get('/customers/top-balance', ReportController.topBalance)
router.get('/products/selling', ReportController.sellingProducts)
router.get('/inventory/alert', ReportController.inventoryAlert)

export default router
