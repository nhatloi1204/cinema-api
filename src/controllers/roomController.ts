import { Request, Response } from 'express'
import { Room } from '../models/Room'
import { generateSeatLayout } from '../utils/seatHelper'

// @desc Create Room
// @route POST /admin/rooms
// @access Admin
export const createRoom = async (req: Request, res: Response) => {
  try {
    const { name, theaterId, rows, cols } = req.body

    const seatLayout = generateSeatLayout(rows, cols)

    const room = await Room.create({
      name,
      theaterId,
      rows,
      cols,
      seatLayout,
    })

    const populatedRoom = await room.populate([
      { path: 'theaterId', select: 'name' },
    ])

    res.status(201).json(populatedRoom)
  } catch (error) {
    res.status(500).json({ message: 'Create Room Failed', error })
  }
}

// @desc Update Room
// @route PUT /admin/rooms/:id
// @access Admin
export const updateRoom = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { name, rows, cols, seatLayout } = req.body

    const updatedRoom = await Room.findByIdAndUpdate(
      id,
      { name, rows, cols, seatLayout },
      { new: true },
    )

    if (!updatedRoom) {
      res.status(404).json({ message: 'Room not found' })
      return
    }

    res.status(200).json(updatedRoom)
  } catch (error) {
    res.status(500).json({ message: 'Update Room Failed', error })
  }
}

// @desc Delete Room
// @route DELETE /admin/rooms/:id
// @access Admin
export const deleteRoom = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const deletedRoom = await Room.findByIdAndDelete(id)

    if (!deletedRoom) {
      res.status(404).json({ message: 'Room not found' })
      return
    }
    res.status(200).json({ message: 'Deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Delete Room Failed', error })
  }
}

// @desc Get all Rooms
// @route GET /admin/rooms
// @access Admin
export const getAllRooms = async (req: Request, res: Response) => {
  try {
    const rooms = await Room.find().populate('theaterId')
    res.status(200).json(rooms)
  } catch (error) {
    res.status(500).json({ message: 'Get Rooms Failed', error })
  }
}

// @desc Get Room by ID
// @route GET /admin/rooms/:id
// @access Admin
export const getRoomById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const room = await Room.findById(id).populate('theaterId')

    if (!room) {
      res.status(404).json({ message: 'Room not found' })
      return
    }

    res.status(200).json(room)
  } catch (error) {
    res.status(500).json({ message: 'Get Room Failed', error })
  }
}
