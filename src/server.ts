import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import path from 'path'
import connectDB from './config/db'

dotenv.config()
connectDB()

const app = express()

// Middleware
app.use(express.json())
app.use(cors())
app.use(helmet())

app.use(express.static(path.join(__dirname, 'public')))

// Route mặc định
app.get('/', (req, res) => {
  res.send('Trang chủ')
})

const PORT = process.env.PORT

// Khởi động máy chủ
app.listen(PORT, () => {
  console.log(`Thành công  http://localhost:${PORT}`)
})
