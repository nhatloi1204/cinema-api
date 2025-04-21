import { Request, Response } from 'express'
import { ShopItem } from '../models/ShopItem'

// ================= PUBLIC ==================

// @desc Get all shop items
// @route GET /public/shop-items
// @access Public
export const getAllShopItems = async (req: Request, res: Response) => {
  try {
    const shopItems = await ShopItem.find()
    res.status(200).json(shopItems)
  } catch (error) {
    res.status(500).json({ message: 'Get Shop Items Failed', error })
  }
}

// @desc Get single shop item by id
// @route GET /public/shop-items/:id
// @access Public
export const getShopItemById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const shopItem = await ShopItem.findById(id)
    if (!shopItem) {
      res.status(404).json({ message: 'Shop Item not found' })
      return
    }
    res.status(200).json(shopItem)
  } catch (error) {
    res.status(500).json({ message: 'Get Shop Item Failed', error })
  }
}

// ================= ADMIN ==================

// @desc Create a new shop item
// @route POST /admin/shop-items
// @access Admin
export const createShopItem = async (req: Request, res: Response) => {
  try {
    const { name, description, price, image } = req.body
    const shopItem = await ShopItem.create({ name, description, price, image })
    res.status(201).json(shopItem)
  } catch (error) {
    res.status(500).json({ message: 'Create Shop Item Failed', error })
  }
}

// @desc Update shop item
// @route PUT /admin/shop-items/:id
// @access Admin
export const updateShopItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const updatedItem = await ShopItem.findByIdAndUpdate(id, req.body, {
      new: true,
    })
    if (!updatedItem) {
      res.status(404).json({ message: 'Shop Item not found' })
      return
    }
    res.status(200).json(updatedItem)
  } catch (error) {
    res.status(500).json({ message: 'Update Shop Item Failed', error })
  }
}

// @desc Delete shop item
// @route DELETE /admin/shop-items/:id
// @access Admin
export const deleteShopItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const deletedItem = await ShopItem.findByIdAndDelete(id)
    if (!deletedItem) {
      res.status(404).json({ message: 'Shop Item not found' })
      return
    }
    res.status(200).json({ message: 'Deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Delete Shop Item Failed', error })
  }
}
