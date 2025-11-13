import dotenv from 'dotenv'

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development'
dotenv.config({ path: envFile })

import express, { Application, Request, Response } from 'express'
import cors from 'cors'
import database from './config/db.conf'

const PORT: number = Number(process.env.PORT) || 5000
const app: Application = express()

// Middleware requestLogger
// Cấu hình CORS
const whitelist: string[] = ['http://localhost:3000', 'http://localhost:4000']

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    console.log(`CORS request from: ${origin}`) // Debug origin

    if (!origin || whitelist.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error(`Not allowed by CORS: ${origin}`), false)
    }
  }
}

app.use(cors(corsOptions))

// Middleware xử lý JSON và URL-encoded data
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

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
