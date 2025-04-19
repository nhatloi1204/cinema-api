import express from 'express'
import adminController from '../controllers/adminController'
import { verifyUser } from '../middlewares/authMiddleware'
import { checkRole } from '../middlewares/checkRole'

const router = express.Router()

router.post(
  '/movies',
  verifyUser,
  checkRole('admin'),
  adminController.createMovie,
)
router.put(
  '/movie/:movieId',
  verifyUser,
  checkRole('admin'),
  adminController.updateMovie,
)
router.delete(
  '/movie/:movieId',
  verifyUser,
  checkRole('admin'),
  adminController.deleteMovie,
)

router.post(
  '/showtimes',
  verifyUser,
  checkRole('admin'),
  adminController.createShowtime,
)
router.put(
  '/showtime/:showtimeId',
  verifyUser,
  checkRole('admin'),
  adminController.updateShowtime,
)
router.delete(
  '/showtime/:showtimeId',
  verifyUser,
  checkRole('admin'),
  adminController.deleteShowtime,
)

router.post(
  '/theater',
  verifyUser,
  checkRole('admin'),
  adminController.createTheater,
)
router.put(
  '/theater/:theaterId',
  verifyUser,
  checkRole('admin'),
  adminController.updateTheater,
)
router.delete(
  '/theater/:theaterId',
  verifyUser,
  checkRole('admin'),
  adminController.deleteTheater,
)

export default router
