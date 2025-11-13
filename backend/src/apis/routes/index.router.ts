import { Application, Router } from 'express'
import authRouter from './auth.routes'

export default (app: Application) => {
  const router = Router()
  router.use('/auth', authRouter)
  // router.use('/users', userRouter) // thêm các router khác nếu có

  app.use('/api/v1', router)
}
