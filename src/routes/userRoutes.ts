import express from 'express'
import { verifyUser } from '../middlewares/authMiddleware'
import authController from '../controllers/authController'
import {
  createBooking,
  getBookingById,
  getUserBookings,
  cancelBooking,
} from '../controllers/bookingController'
import { confirmPayment } from '../services/paymentService'

const router = express.Router()
const requireAuth = [verifyUser]
router.use(requireAuth)

router.get('/profile', authController.getProfile)
router.put('/profile', authController.updateUser)
// router.put('/profile/change-password', authController.changePassword)

// Booking routes
router.post('/bookings/create', createBooking)
router.get('/bookings', getUserBookings)
router.get('/bookings/:id', getBookingById)
router.delete('/bookings/:id', cancelBooking)

// Payment routes
router.post('/bookings/confirm-payment', confirmPayment)

export default router
