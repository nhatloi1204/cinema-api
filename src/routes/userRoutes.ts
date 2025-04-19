import express from 'express'
import userController from '../controllers/userController'
import { verifyUser } from '../middlewares/authMiddleware'

const router = express.Router()

router.get('/movies', userController.getMovies)
router.get('/movie/:movieId', userController.getMovieDetails)
router.get('/theaters', userController.getTheaters)
router.get('/showtimes', userController.getShowtimes)
router.get('/seat/:showtimeId', userController.getSeats)

// Require login
router.post('/book', verifyUser, userController.bookSeats)
router.get('/profile', verifyUser, userController.getUserProfile)
router.put('/profile', verifyUser, userController.updateUserProfile)

export default router
