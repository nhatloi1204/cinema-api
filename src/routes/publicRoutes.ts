import express from 'express'
import { getAllShopItems, getShopItemById } from '../controllers'

const router = express.Router()

// SHOP ITEMS PUBLIC
router.get('/shop-items', getAllShopItems)
router.get('/shop-items/:id', getShopItemById)

export default router
