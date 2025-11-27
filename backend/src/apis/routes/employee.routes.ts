import { Router } from 'express'
import { EmployeeController } from '../controllers/employee.controller'

const router = Router()
router.get('/', EmployeeController.list)

export default router
