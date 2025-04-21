import express from 'express'
import { verifyUser } from '../middlewares/authMiddleware'
import { checkRole } from '../middlewares/checkRoleMiddleware'
import { createShopItem, updateShopItem, deleteShopItem } from '../controllers'

const router = express.Router()

// PROTECTED ROUTES
// ================= ADMIN ==================
const requireAdmin = [verifyUser, checkRole('Admin')]
router.use(requireAdmin)

// SHOP ITEMS ADMIN
router.post('/shop-items', createShopItem)
router.put('/shop-items/:id', updateShopItem)
router.delete('/shop-items/:id', deleteShopItem)

export default router
