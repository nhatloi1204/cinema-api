import { Request, Response } from 'express'
import { Event } from '../models/Event'
import { parseDate } from '../utils/parseDate'

// ================= ADMIN ==================

// @desc Create an event
// @route POST /admin/events
// @access Admin
export const createEvent = async (req: Request, res: Response) => {
  try {
    const { title, description, image, startDate, endDate } = req.body
    const event = await Event.create({
      title,
      description,
      image,
      startDate: parseDate(startDate),
      endDate: parseDate(endDate),
    })
    res.status(201).json(event)
  } catch (error) {
    res.status(500).json({ message: 'Create Event Failed', error })
  }
}

// @desc Update an event
// @route PUT /admin/events/:id
// @access Admin
export const updateEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { title, description, image, startDate, endDate } = req.body
    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      {
        title,
        description,
        image,
        startDate: parseDate(startDate),
        endDate: parseDate(endDate),
      },
      {
        new: true,
      },
    )

    if (!updatedEvent) {
      res.status(404).json({ message: 'Event not found' })
      return
    }
    res.status(200).json(updatedEvent)
  } catch (error) {
    res.status(500).json({ message: 'Update Event Failed', error })
  }
}

// @desc Delete an event
// @route DELETE /admin/events/:id
// @access Admin
export const deleteEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const deletedEvent = await Event.findByIdAndDelete(id)

    if (!deletedEvent) {
      res.status(404).json({ message: 'Event not found' })
      return
    }
    res.status(200).json({ message: 'Deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Delete Event Failed', error })
  }
}

// ================= PUBLIC ==================

// @desc Get all events
// @route GET /public/events
// @access Public
export const getAllEvents = async (req: Request, res: Response) => {
  try {
    const eventList = await Event.find().sort({ createdAt: -1 })
    res.status(200).json(eventList)
  } catch (error) {
    res.status(500).json({ message: 'Get Event List Failed', error })
  }
}

// @desc Get event by ID
// @route GET /public/events/:id
// @access Public
export const getEventById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const event = await Event.findById(id)

    if (!event) {
      res.status(404).json({ message: 'Event not found' })
      return
    }

    res.status(200).json(event)
  } catch (error) {
    res.status(500).json({ message: 'Get Event Failed', error })
  }
}
