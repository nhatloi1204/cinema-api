import { Request, Response } from 'express'
import { News } from '../models/News'

// ================= ADMIN ==================

// @desc Create a news item
// @route POST /admin/news
// @access Admin
export const createNews = async (req: Request, res: Response) => {
  try {
    const { title, content, image } = req.body
    const news = await News.create({ title, content, image })
    res.status(201).json(news)
  } catch (error) {
    res.status(500).json({ message: 'Create News Failed', error })
  }
}

// @desc Update a news item
// @route PUT /admin/news/:id
// @access Admin
export const updateNews = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const updatedNews = await News.findByIdAndUpdate(id, req.body, {
      new: true,
    })

    if (!updatedNews) {
      res.status(404).json({ message: 'News not found' })
      return
    }
    res.status(200).json(updatedNews)
  } catch (error) {
    res.status(500).json({ message: 'Update News Failed', error })
  }
}

// @desc Delete a news item
// @route DELETE /admin/news/:id
// @access Admin
export const deleteNews = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const deletedNews = await News.findByIdAndDelete(id)

    if (!deletedNews) {
      res.status(404).json({ message: 'News not found' })
      return
    }
    res.status(200).json({ message: 'Deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Delete News Failed', error })
  }
}

// ================= PUBLIC ==================

// @desc Get all news
// @route GET /public/news
// @access Public
export const getAllNews = async (req: Request, res: Response) => {
  try {
    const newsList = await News.find().sort({ createdAt: -1 })
    res.status(200).json(newsList)
  } catch (error) {
    res.status(500).json({ message: 'Get News List Failed', error })
  }
}

// @desc Get news by ID
// @route GET /public/news/:id
// @access Public
export const getNewsById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const news = await News.findById(id)

    if (!news) {
      res.status(404).json({ message: 'News not found' })
      return
    }

    res.status(200).json(news)
  } catch (error) {
    res.status(500).json({ message: 'Get News Failed', error })
  }
}
