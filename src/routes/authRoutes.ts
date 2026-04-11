import express from 'express'
import authController from '../controllers/authController'
import { verifyUser } from '../middlewares/authMiddleware'

const router = express.Router()

router.get('/profile', verifyUser, authController.getProfile)

export default router
