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
router.post('/shop-items', adminController.createShopItem)
router.put('/shop-items/:id', adminController.updateShopItem)
router.delete('/shop-items/:id', adminController.deleteShopItem)

// NEWS
router.post('/news', adminController.createNews)
router.put('/news/:id', adminController.updateNews)
router.delete('/news/:id', adminController.deleteNews)

// EVENTS
router.post('/events', adminController.createEvent)
router.put('/events/:id', adminController.updateEvent)
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

// BANNERS
router.post(
  '/banners',
  (req, res, next) => {
    uploadCloud.single('image')(req, res, err => {
      if (err) {
        console.error('Multer error:', err)
        return res.status(400).json({ error: 'File upload failed' })
      }
      next()
    })
  },
  adminController.createBanner,
)
router.put(
  '/banners/:id',
  (req, res, next) => {
    uploadCloud.single('image')(req, res, err => {
      if (err) {
        console.error('Multer error:', err)
        return res.status(400).json({ error: 'File upload failed' })
      }
      next()
    })
  },
  adminController.updateBanner,
)
router.delete('/banners/:id', adminController.deleteBanner)

export default router
