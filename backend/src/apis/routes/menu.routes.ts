import { Router } from 'express'
import { MenuController } from '../controllers/menu.controller'

const router = Router()
router.get('/', MenuController.getAll)
// thêm các apis như thêm món, xoá món
export default router
