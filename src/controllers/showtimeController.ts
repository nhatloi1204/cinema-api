import { Request, Response } from 'express'
import { Showtime } from '../models/Showtime'
import { Booking } from '../models/Booking'
import { Room } from '../models/Room'
import { generateSchedules } from '../utils/scheduleGenerator'
import { Movie } from '../models/Movie'

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

// @desc GENERATE showtime preview (not saved to DB)
// @route POST /admin/showtimes/generate-preview
// @access Admin
export const generateShowtimePreview = async (req: Request, res: Response) => {
  try {
    const {
      filmIds,
      filmPriorities,
      roomIds,
      startDate,
      endDate,
      timeSlots,
      bufferTime,
      price,
      theaterId,
    } = req.body

    // Validate input
    if (
      !filmIds ||
      !roomIds ||
      !startDate ||
      !endDate ||
      !timeSlots ||
      !theaterId
    ) {
      res.status(400).json({ error: 'Missing required fields' })
      return
    }

    const result = await generateSchedules({
      filmIds,
      filmPriorities:
        filmPriorities || filmIds.map((_: any, i: number) => i + 1),
      roomIds,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      timeSlots,
      bufferTime: bufferTime || 20,
      price: price || 100000,
      theaterId,
    })

    res.status(200).json({
      status: 'preview',
      totalShowtimes: result.showtimes.length,
      preview: result.showtimes,
      conflicts: result.conflicts.length > 0 ? result.conflicts : undefined,
      message:
        result.conflicts.length > 0
          ? `${result.conflicts.length} khung giờ không thể sắp xếp do bị trùng với suất chiếu đã tồn tại`
          : undefined,
    })
  } catch (error: any) {
    res
      .status(500)
      .json({ error: error.message || 'Failed to generate preview' })
  }
}

// @desc SAVE generated showtimes to database
// @route POST /admin/showtimes/save-generated
// @access Admin
export const saveGeneratedShowtimes = async (req: Request, res: Response) => {
  try {
    const { showtimes } = req.body

    if (!Array.isArray(showtimes) || showtimes.length === 0) {
      res.status(400).json({ error: 'Invalid showtimes array' })
      return
    }

    // Check for conflicts WITHIN preview
    const roomIds = [...new Set(showtimes.map((s: any) => s.roomId))]

    for (const roomId of roomIds) {
      const roomShowtimes = showtimes.filter((s: any) => s.roomId === roomId)

      for (let i = 0; i < roomShowtimes.length; i++) {
        for (let j = i + 1; j < roomShowtimes.length; j++) {
          const st1 = roomShowtimes[i]
          const st2 = roomShowtimes[j]

          const start1 = new Date(st1.startTime)
          const end1 = new Date(st1.endTime)
          const start2 = new Date(st2.startTime)
          const end2 = new Date(st2.endTime)

          // Check overlap
          if (start1 < end2 && start2 < end1) {
            res.status(409).json({
              error: 'Time conflict detected in generated showtimes',
              details: {
                room: st1.roomName,
                conflict1: {
                  movieTitle: st1.movieTitle,
                  startTime: st1.startTime,
                  endTime: st1.endTime,
                },
                conflict2: {
                  movieTitle: st2.movieTitle,
                  startTime: st2.startTime,
                  endTime: st2.endTime,
                },
              },
            })
            return
          }
        }
      }
    }

    // Check for conflicts with EXISTING showtimes in database
    for (const newShowtime of showtimes) {
      const existingConflict = await Showtime.findOne({
        theaterId: newShowtime.theaterId,
        roomId: newShowtime.roomId,
        $and: [
          {
            startTime: { $lt: new Date(newShowtime.endTime) },
            endTime: { $gt: new Date(newShowtime.startTime) },
          },
        ],
      })
        .populate('movieId', 'title')
        .populate('roomId', 'name')

      if (existingConflict) {
        const room = existingConflict.roomId as any
        res.status(409).json({
          error: 'Time conflict with existing showtimes in database',
          details: {
            room: room?.name,
            newShowtime: {
              movieTitle: newShowtime.movieTitle,
              startTime: newShowtime.startTime,
              endTime: newShowtime.endTime,
            },
            existingShowtime: {
              movieTitle: existingConflict.movieId,
              startTime: existingConflict.startTime,
              endTime: existingConflict.endTime,
            },
          },
        })
        return
      }
    }

    // Insert all showtimes
    const createdShowtimes = await Showtime.insertMany(
      showtimes.map((st: any) => ({
        movieId: st.movieId,
        roomId: st.roomId,
        theaterId: st.theaterId,
        startTime: st.startTime,
        endTime: st.endTime,
        price: st.price,
      })),
    )

    const populated = await Showtime.find({
      _id: { $in: createdShowtimes.map(s => s._id) },
    })
      .populate('movieId', 'title duration')
      .populate('roomId', 'name')
      .populate('theaterId', 'name')

    res.status(201).json({
      status: 'success',
      totalSaved: createdShowtimes.length,
      showtimes: populated,
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to save showtimes' })
  }
}
