import express from 'express'
import { verifyUser } from '../middlewares/authMiddleware'

const router = express.Router()
const requireAuth = [verifyUser]
router.use(requireAuth)

export default router
