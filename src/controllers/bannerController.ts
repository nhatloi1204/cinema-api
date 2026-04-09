import { Request, Response } from 'express'
import { Banner } from '../models/Banner'

// ================= ADMIN ==================

// @desc Create a banner
// @route POST /admin/banners
// @access Admin
export const createBanner = async (req: Request, res: Response) => {
  console.log('createBanner function called')
  try {
    console.log('Inside try block')
    const bannerData = {
      ...req.body,
      image: req.file?.path,
    }
    console.log('Banner data:', bannerData)

    const banner = await Banner.create(bannerData)
    res.status(201).json(banner)
  } catch (error) {
    console.error('Error in createBanner:', error)
    res.status(500).json({ message: 'Create Banner Failed', error })
  }
}

// @desc Update a banner
// @route PUT /admin/banners/:id
// @access Admin
export const updateBanner = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const updateData = req.body

    if (req.file) {
      updateData.image = req.file.path
    }

    const updatedBanner = await Banner.findByIdAndUpdate(id, updateData, {
      new: true,
    })

    if (!updatedBanner) {
      res.status(404).json({ message: 'Banner not found' })
      return
    }
    res.status(200).json(updatedBanner)
  } catch (error) {
    res.status(500).json({ message: 'Update Banner Failed', error })
  }
}

// @desc Delete a banner
// @route DELETE /admin/banners/:id
// @access Admin
export const deleteBanner = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const deletedBanner = await Banner.findByIdAndDelete(id)

    if (!deletedBanner) {
      res.status(404).json({ message: 'Banner not found' })
      return
    }
    res.status(200).json({ message: 'Deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Delete Banner Failed', error })
  }
}

// ================= PUBLIC ==================

// @desc Get all banners
// @route GET /public/banners
// @access Public
export const getAllBanners = async (req: Request, res: Response) => {
  try {
    const banners = await Banner.find({ isActive: true }).sort({ order: 1 })
    res.status(200).json(banners)
  } catch (error) {
    res.status(500).json({ message: 'Get Banner List Failed', error })
  }
}

// @desc Get banner by ID
// @route GET /public/banners/:id
// @access Public
export const getBannerById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const banner = await Banner.findById(id)

    if (!banner) {
      res.status(404).json({ message: 'Banner not found' })
      return
    }

    res.status(200).json(banner)
  } catch (error) {
    res.status(500).json({ message: 'Get Banner Failed', error })
  }
}
