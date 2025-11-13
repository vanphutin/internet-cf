import { Router } from 'express'
import { ComputerController } from '../controllers/computer.controller'

const router = Router()
router.get('/', ComputerController.list)
router.get('/:id', ComputerController.getById)
router.post('/', ComputerController.create)
router.put('/:id', ComputerController.update)
router.delete('/:id', ComputerController.delete)

export default router
