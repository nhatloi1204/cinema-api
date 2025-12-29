import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import path from 'path'
import connectDB from './configs/db'
import adminRoutes from './routes/adminRoutes'
import userRoutes from './routes/userRoutes'
import authRoutes from './routes/authRoutes'
import publicRoutes from './routes/publicRoutes'
import cookieParser from 'cookie-parser'
import swaggerUi from 'swagger-ui-express'
import YAML from 'yamljs'

dotenv.config()
connectDB()

const app = express()
const swaggerDocument = YAML.load('src/openapi.yaml')

// Middleware
app.use(express.json())
app.use(cookieParser())
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
)
app.use(helmet())

app.use(express.static(path.join(__dirname, 'public')))

// Route
app.use('/public', publicRoutes)
app.use('/user', userRoutes)
app.use('/admin', adminRoutes)
app.use('/auth', authRoutes)

app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, { explorer: true }),
)

const PORT = Number(process.env.PORT)
const HOST = process.env.HOST || 'localhost'

// Khởi động máy chủ
app.listen(PORT, HOST, () => {
  console.log(`Thành công  http://${HOST}:${PORT}`)
  console.log(`Swagger Docs: http://${HOST}:${PORT}/api-docs`)
})
