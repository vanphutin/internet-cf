import dotenv from 'dotenv'
dotenv.config({ path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development' })

import express, { Application, Request, Response } from 'express'
import database from './config/db.conf'
import routers from './apis/routes/index.router'

const PORT: number = Number(process.env.PORT) || 5000
const app: Application = express()

// Middleware xử lý JSON và URL-encoded data
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Dùng router chính
routers(app)

// Kiểm tra server
app.get('/', (req: Request, res: Response) => {
  res.send('Server is running!')
})

// Kết nối Database & khởi động server
database.getConnection((error, connection) => {
  if (error) {
    console.error('❌ Lỗi kết nối database:', error.message)
    process.exit(1)
  }

  console.log(`✅ Kết nối MySQL thành công! Host: ${connection.config.host}, Port: ${connection.config.port}`)

  connection.release()

  app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy trên port ${PORT} | Environment: ${process.env.NODE_ENV}`)
  })
})
