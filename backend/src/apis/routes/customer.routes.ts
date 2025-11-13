import { Router } from 'express'
import { CustomerController } from '../controllers/customer.controller'

const router = Router()
router.get('/', CustomerController.list)
router.get('/:id', CustomerController.getById)
router.post('/', CustomerController.create)
router.put('/:id', CustomerController.update)
router.patch('/:id/balance', CustomerController.topup)
router.delete('/:id', CustomerController.delete)

export default router
