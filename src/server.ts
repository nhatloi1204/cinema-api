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
import { handleStripeWebhook } from './services/paymentService'
import { startBookingCleanupScheduler } from './services/bookingCleanupService'

dotenv.config()
connectDB()

const app = express()
app.set('trust proxy', 1)
const swaggerDocument = YAML.load('src/openapi.yaml')

// Webhook route (must be before express.json() middleware)
app.post(
  '/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  handleStripeWebhook,
)

// Middleware
app.use(express.json())
app.use(cookieParser())
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
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

// Start booking cleanup scheduler
startBookingCleanupScheduler()

// Khởi động máy chủ
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📚 Swagger Docs: /api-docs`)
})
