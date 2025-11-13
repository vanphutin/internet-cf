import { Application, Router } from 'express'
import authRouter from './auth.routes'
import computersRouter from './computer.routes'
import customerRoutes from './customer.routes'
import reportRoutes from './report.routes'

export default (app: Application) => {
  const router = Router()
  router.use('/auth', authRouter)
  router.use('/computers', computersRouter)
  router.use('/customers', customerRoutes)
  router.use('/reports', reportRoutes)

  app.use('/api/v1', router)
}
