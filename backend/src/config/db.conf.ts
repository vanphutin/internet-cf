import mysql, { Pool } from 'mysql2'
import config from './config'

const pool: Pool = mysql.createPool({
  queueLimit: 10,
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.pass,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: 2
})

export default pool
