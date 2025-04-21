import { Request, Response } from 'express'
import { Theater } from '../models/Theater'

// ================= ADMIN ==================

// @desc Create a theater
// @route POST /admin/theaters
// @access Admin
export const createTheater = async (req: Request, res: Response) => {
  try {
    const { name, location } = req.body
    const theater = await Theater.create({ name, location })
    res.status(201).json(theater)
  } catch (error) {
    res.status(500).json({ message: 'Create Theater Failed', error })
  }
}

// @desc Update a theater
// @route PUT /admin/theaters/:id
// @access Admin
export const updateTheater = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const updatedTheater = await Theater.findByIdAndUpdate(id, req.body, {
      new: true,
    })

    if (!updatedTheater) {
      res.status(404).json({ message: 'Theater not found' })
      return
    }
    res.status(200).json(updatedTheater)
  } catch (error) {
    res.status(500).json({ message: 'Update Theater Failed', error })
  }
}

// @desc Delete a theater
// @route DELETE /admin/theaters/:id
// @access Admin
export const deleteTheater = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const deletedTheater = await Theater.findByIdAndDelete(id)

    if (!deletedTheater) {
      res.status(404).json({ message: 'Theater not found' })
      return
    }
    res.status(200).json({ message: 'Deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Delete Theater Failed', error })
  }
}

// ================= PUBLIC ==================

// @desc Get all theaters
// @route GET /public/theaters
// @access Public
export const getAllTheaters = async (req: Request, res: Response) => {
  try {
    const theaterList = await Theater.find().sort({ createdAt: -1 })
    res.status(200).json(theaterList)
  } catch (error) {
    res.status(500).json({ message: 'Get Theater List Failed', error })
  }
}

// @desc Get theater by ID
// @route GET /public/theaters/:id
// @access Public
export const getTheaterById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const theater = await Theater.findById(id)

    if (!theater) {
      res.status(404).json({ message: 'Theater not found' })
      return
    }

    res.status(200).json(theater)
  } catch (error) {
    res.status(500).json({ message: 'Get Theater Failed', error })
  }
}
