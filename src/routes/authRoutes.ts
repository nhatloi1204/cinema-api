import express from 'express'
import authController from '../controllers/authController'
import { verifyUser } from '../middlewares/authMiddleware'

const router = express.Router()

router.post('/login/google', authController.loginWithGoogle)
router.get('/profile', verifyUser, authController.getProfile)
router.post('/register', authController.register)
router.get('/login', authController.login)
router.get('/callback', authController.callback)
router.get('/logout', authController.logout)

export default router
