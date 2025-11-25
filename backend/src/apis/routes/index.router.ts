import { Application, Router } from 'express'
import authRouter from './auth.routes'
import computersRouter from './computer.routes'
import customerRoutes from './customer.routes'
import reportRoutes from './report.routes'
import menuRoutes from './menu.routes'
import dashboardRoutes from './dashboard.routes'

export default (app: Application) => {
  const router = Router()
  router.use('/auth', authRouter)
  router.use('/computers', computersRouter)
  router.use('/customers', customerRoutes)
  router.use('/reports', reportRoutes)
  router.use('/menu', menuRoutes)
  router.use('/dashboard', dashboardRoutes)

  app.use('/api/v1', router)
}
