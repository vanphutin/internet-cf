import dotenv from 'dotenv'

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development'
dotenv.config({ path: envFile })
interface DBConfig {
  host: string
  user: string
  pass: string
  database: string
  port: number
}

interface AppConfig {
  port: number
  db: DBConfig
  debug: boolean
}

const env: string = process.env.NODE_ENV || 'development'
const config: Record<string, AppConfig> = {
  development: {
    port: Number(process.env.PORT) || 3000,
    db: {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      pass: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'my_database',
      port: Number(process.env.DB_PORT) || 3306
    },
    debug: true
  },
  production: {
    port: Number(process.env.PORT) || 8080,
    db: {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      pass: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'my_database',
      port: Number(process.env.DB_PORT) || 3306
    },
    debug: false
  }
}
export default config[env]
