import express from 'express'
import authController from '../controllers/authController'
import { verifyUser } from '../middlewares/authMiddleware'

const router = express.Router()

// Define the routes for login and logout
// router.post('/login', authController.login) // Handle login
// router.post('/logout', authController.logout) // Handle logout
router.get('/profile', verifyUser, authController.getProfile) // Get user profile

export default router
