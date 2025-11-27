import { Router } from 'express'
import { MessageController } from '../controllers/message.controller'

const router = Router()
router.get('/', MessageController.list)

export default router
