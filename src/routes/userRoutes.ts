import express from 'express'
import { verifyUser } from '../middlewares/authMiddleware'
import authController from '../controllers/authController'

const router = express.Router()
const requireAuth = [verifyUser]
router.use(requireAuth)

router.get('/profile', authController.getProfile)
router.put('/profile', authController.updateUser)
// router.put('/profile/change-password', authController.changePassword)

export default router
