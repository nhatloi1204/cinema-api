import express from 'express'
import { verifyUser } from '../middlewares/authMiddleware'
import { checkRole } from '../middlewares/checkRoleMiddleware'
import * as adminController from '../controllers'

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
router.post('/movies', adminController.createMovie)
router.put('/movies/:id', adminController.updateMovie)
router.delete('/movies/:id', adminController.deleteMovie)

// THEATERS
router.post('/theaters', adminController.createTheater)
router.put('/theaters/:id', adminController.updateTheater)
router.delete('/theaters/:id', adminController.deleteTheater)

export default router
