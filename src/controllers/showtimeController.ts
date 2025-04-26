import { Request, Response } from 'express'
import { Showtime } from '../models/Showtime'

// ================== PUBLIC ==================

// @desc GET all showtimes
// @route GET /api/showtimes
// @access Public
export const getAllShowtimes = async (req: Request, res: Response) => {
  try {
    const showtimes = await Showtime.find()
      .populate('movieId')
      .populate('roomId')
      .populate('theaterId')
    res.json(showtimes)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch showtimes' })
  }
}

// @desc GET showtime by ID
// @route GET /api/showtimes/:id
// @access Public
export const getShowtimeById = async (req: Request, res: Response) => {
  try {
    const showtime = await Showtime.findById(req.params.id)
      .populate('movieId')
      .populate('roomId')
      .populate('theaterId')

    if (!showtime) {
      res.status(404).json({ error: 'Showtime not found' })
      return
    }
    res.json(showtime)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch showtime' })
  }
}

// @desc GET showtimes by movie ID
// @route GET /api/showtimes/movie/:movieId
// @access Public
export const getShowtimesByMovie = async (req: Request, res: Response) => {
  try {
    const { movieId } = req.params
    const showtimes = await Showtime.find({ movieId }).populate(
      'theaterId',
      'name',
    )
    res.json(showtimes)
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
}

// @desc CREATE a new showtime
// @route POST /api/showtimes
// @access admin
export const createShowtime = async (req: Request, res: Response) => {
  try {
    const newShowtime = new Showtime(req.body)
    await newShowtime.save()
    res.status(201).json(newShowtime)
  } catch (error) {
    res.status(400).json({ error: 'Failed to create showtime' })
  }
}

// ================== ADMIN ==================

// @desc UPDATE a showtime
// @route PUT /api/showtimes/:id
// @access admin
export const updateShowtime = async (req: Request, res: Response) => {
  try {
    const updated = await Showtime.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    })
    if (!updated) {
      res.status(404).json({ error: 'Showtime not found' })
      return
    }
    res.json(updated)
  } catch (error) {
    res.status(400).json({ error: 'Failed to update showtime' })
  }
}

// @desc DELETE a showtime
// @route DELETE /api/showtimes/:id
// @access admin
export const deleteShowtime = async (req: Request, res: Response) => {
  try {
    const deleted = await Showtime.findByIdAndDelete(req.params.id)
    if (!deleted) {
      res.status(404).json({ error: 'Showtime not found' })
      return
    }
    res.json({ message: 'Showtime deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete showtime' })
  }
}
