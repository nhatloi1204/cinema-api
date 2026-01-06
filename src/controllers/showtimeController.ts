import { Request, Response } from 'express'
import { Showtime } from '../models/Showtime'
import { Booking } from '../models/Booking'
import { Room } from '../models/Room'

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
    const { roomId, startTime, endTime } = req.body

    // Check for time conflicts in the same room
    const conflictingShowtime = await Showtime.findOne({
      roomId,
      $and: [
        // New showtime starts during an existing showtime
        {
          startTime: { $lt: new Date(endTime) },
          endTime: { $gt: new Date(startTime) },
        },
      ],
    })

    if (conflictingShowtime) {
      res.status(409).json({
        error: 'Room already has a showtime scheduled during this time',
        conflict: conflictingShowtime,
      })
      return
    }

    const newShowtime = new Showtime(req.body)
    await newShowtime.save()

    const populatedShowtime = await newShowtime.populate([
      { path: 'movieId', select: 'title' },
      { path: 'roomId', select: 'name' },
      { path: 'theaterId', select: 'name' },
    ])
    res.status(201).json(populatedShowtime)
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

// @desc GET occupied seats for a showtime
// @route GET /api/showtimes/:id/occupied-seats
// @access Public
export const getOccupiedSeats = async (req: Request, res: Response) => {
  try {
    const { id: showtimeId } = req.params

    // Verify showtime exists
    const showtime = await Showtime.findById(showtimeId)
    if (!showtime) {
      res.status(404).json({ error: 'Showtime not found' })
      return
    }

    // Get all bookings for this showtime with payment status 'paid' or 'pending'
    const bookings = await Booking.find({
      showtimeId,
      paymentStatus: { $in: ['paid', 'pending'] },
    }).select('seats')

    // Flatten all occupied seats
    const occupiedSeats = bookings.reduce((acc: string[], booking) => {
      return [...acc, ...booking.seats]
    }, [])

    // Get room info to send seat layout to frontend
    const room = await Room.findById(showtime.roomId)

    res.json({
      occupiedSeats,
      roomInfo: room ? { rows: room.rows, cols: room.cols } : null,
      showtimeId,
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch occupied seats' })
  }
}

// @desc GET available seats layout for a showtime (including occupied seats info)
// @route GET /api/showtimes/:id/seats-layout
// @access Public
export const getSeatsLayout = async (req: Request, res: Response) => {
  try {
    const { id: showtimeId } = req.params

    // Get showtime with room details
    const showtime = await Showtime.findById(showtimeId)
      .populate('roomId')
      .exec()

    if (!showtime) {
      res.status(404).json({ error: 'Showtime not found' })
      return
    }

    const room = showtime.roomId as any
    if (!room) {
      res.status(404).json({ error: 'Room not found' })
      return
    }

    // Get all occupied seats
    const bookings = await Booking.find({
      showtimeId,
      paymentStatus: { $in: ['paid', 'pending'] },
    }).select('seats')

    const occupiedSeats = new Set(
      bookings.reduce((acc: string[], booking) => {
        return [...acc, ...booking.seats]
      }, []),
    )

    // Build seat layout with availability status
    const seatsLayout = room.seatLayout.map((row: any[], rowIndex: number) => {
      return row.map((seat: any, colIndex: number) => {
        if (!seat) {
          return null
        }

        const seatCode = seat.code
        const isOccupied = occupiedSeats.has(seatCode)

        return {
          code: seatCode,
          type: seat.type,
          available: !isOccupied,
          occupied: isOccupied,
        }
      })
    })

    res.json({
      showtimeId,
      roomId: room._id,
      roomName: room.name,
      rows: room.rows,
      cols: room.cols,
      seatsLayout,
      summary: {
        total: room.rows * room.cols,
        occupied: occupiedSeats.size,
        available: room.rows * room.cols - occupiedSeats.size,
      },
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch seats layout' })
  }
}
