import express from 'express'
import { verifyUser } from '../middlewares/authMiddleware'
import { checkRole } from '../middlewares/checkRoleMiddleware'
import * as adminController from '../controllers'
import { uploadCloud } from '../configs/cloudinary'

const router = express.Router()

// PROTECTED ROUTES
// ================= ADMIN ==================
const requireAdmin = [verifyUser, checkRole('Admin')]
router.use(requireAdmin)

// SHOP ITEMS
router.post(
  '/shop-items',
  uploadCloud.single('image'),
  adminController.createShopItem,
)
router.put(
  '/shop-items/:id',
  uploadCloud.single('image'),
  adminController.updateShopItem,
)
router.delete('/shop-items/:id', adminController.deleteShopItem)

// NEWS
router.post('/news', uploadCloud.single('image'), adminController.createNews)
router.put('/news/:id', uploadCloud.single('image'), adminController.updateNews)
router.delete('/news/:id', adminController.deleteNews)

// EVENTS
router.post('/events', uploadCloud.single('image'), adminController.createEvent)
router.put(
  '/events/:id',
  uploadCloud.single('image'),
  adminController.updateEvent,
)
router.delete('/events/:id', adminController.deleteEvent)

// MOVIES
router.post(
  '/movies',
  uploadCloud.single('poster'),
  adminController.createMovie,
)
router.put(
  '/movies/:id',
  uploadCloud.single('poster'),
  adminController.updateMovie,
)
router.delete('/movies/:id', adminController.deleteMovie)

// THEATERS
router.post('/theaters', adminController.createTheater)
router.put('/theaters/:id', adminController.updateTheater)
router.delete('/theaters/:id', adminController.deleteTheater)

// ROOMS
router.post('/rooms', adminController.createRoom)
router.put('/rooms/:id', adminController.updateRoom)
router.delete('/rooms/:id', adminController.deleteRoom)
router.get('/rooms', adminController.getAllRooms)
router.get('/rooms/:id', adminController.getRoomById)

// SHOWTIMES
router.post('/showtimes', adminController.createShowtime)
router.put('/showtimes/:id', adminController.updateShowtime)
router.delete('/showtimes/:id', adminController.deleteShowtime)
router.post(
  '/showtimes/generate-preview',
  adminController.generateShowtimePreview,
)
router.post('/showtimes/save-generated', adminController.saveGeneratedShowtimes)

// BANNERS
router.post(
  '/banners',
  uploadCloud.single('image'),
  adminController.createBanner,
)
router.put(
  '/banners/:id',
  uploadCloud.single('image'),
  adminController.updateBanner,
)
router.delete('/banners/:id', adminController.deleteBanner)

export default router
