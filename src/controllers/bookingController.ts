import { Request, Response } from 'express'
import mongoose from 'mongoose'
import Stripe from 'stripe'
import { Booking } from '../models/Booking'
import { Showtime } from '../models/Showtime'
import { ShopItem } from '../models/ShopItem'
import { Room } from '../models/Room'
import { User } from '../models/User'

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-12-18.acacia' as any,
})

// ================= USER ==================

/**
 * @desc Create a booking with validation, price calculation, and Stripe PaymentIntent
 * @route POST /user/bookings/create
 * @access Private (User)
 *
 * Request body:
 * {
 *   showtimeId: string,
 *   seats: string[], // eg: ['A1', 'A2']
 *   shopItems: [{ itemId: string, quantity: number }], // optional
 * }
 */
export const createBooking = async (req: Request, res: Response) => {
  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const auth0Id = (req as any).auth?.sub
    const user = await User.findOne({ auth0Id }).session(session)

    const { showtimeId, seats, shopItems = [] } = req.body

    // ========== VALIDATION ==========

    // 1. Validate required fields
    if (!showtimeId || !seats || !Array.isArray(seats) || seats.length === 0) {
      res.status(400).json({
        message: 'Missing or invalid required fields: showtimeId, seats',
      })
      await session.abortTransaction()
      return
    }

    // 2. Check if user is authenticated
    if (!user) {
      res.status(401).json({ message: 'User not authenticated' })
      await session.abortTransaction()
      return
    }

    // 3. Validate showtimeId format
    if (!mongoose.Types.ObjectId.isValid(showtimeId)) {
      res.status(400).json({ message: 'Invalid showtimeId format' })
      await session.abortTransaction()
      return
    }

    // 4. Check if showtime exists
    const showtime = await Showtime.findById(showtimeId)
      .populate('roomId')
      .session(session)

    if (!showtime) {
      res.status(404).json({ message: 'Showtime not found' })
      await session.abortTransaction()
      return
    }

    // 5. Check if showtime has already passed
    if (new Date(showtime.startTime) < new Date()) {
      res.status(400).json({ message: 'Cannot book for a past showtime' })
      await session.abortTransaction()
      return
    }

    // 6. Check if seats are valid for the room
    const room = showtime.roomId as any
    const validSeats = new Set<string>()

    if (room.seatLayout && Array.isArray(room.seatLayout)) {
      room.seatLayout.forEach(
        (row: (typeof room.seatLayout)[0], rowIndex: number) => {
          if (Array.isArray(row)) {
            row.forEach((seat: any, colIndex: number) => {
              if (seat) {
                const seatCode =
                  seat.code ||
                  `${String.fromCharCode(65 + rowIndex)}${colIndex + 1}`
                validSeats.add(seatCode)
              }
            })
          }
        },
      )
    }

    for (const seat of seats) {
      if (!validSeats.has(seat)) {
        res.status(400).json({
          message: `Invalid seat: ${seat}. Seat does not exist in the room.`,
        })
        await session.abortTransaction()
        return
      }
    }

    // 7. Check if seats are already booked (paid or pending) for this showtime
    const existingBookings = await Booking.find(
      {
        showtimeId,
        paymentStatus: { $in: ['paid', 'pending'] },
        seats: { $in: seats },
      },
      null,
      { session },
    )

    if (existingBookings.length > 0) {
      const takenSeats = Array.from(
        new Set(existingBookings.flatMap(b => b.seats)),
      )
      res.status(409).json({
        message: `Seats already taken: ${takenSeats.join(', ')}`,
        takenSeats,
      })
      await session.abortTransaction()
      return
    }

    // ========== PRICE CALCULATION ==========

    let seatPrice = showtime.price
    let shopItemsTotal = 0

    // Calculate shop items price
    if (shopItems.length > 0) {
      for (const item of shopItems) {
        if (
          !item.itemId ||
          !mongoose.Types.ObjectId.isValid(item.itemId) ||
          !item.quantity ||
          item.quantity < 1
        ) {
          res.status(400).json({
            message: 'Invalid shop item: missing itemId or quantity',
          })
          await session.abortTransaction()
          return
        }

        const shopItem = await ShopItem.findById(item.itemId).session(session)

        if (!shopItem) {
          res.status(404).json({
            message: `ShopItem with ID ${item.itemId} not found`,
          })
          await session.abortTransaction()
          return
        }

        shopItemsTotal += (shopItem?.price ?? 0) * item.quantity
      }
    }

    // Calculate total price (seats + shop items)
    const totalPrice = seatPrice * seats.length + shopItemsTotal

    // ========== CREATE BOOKING ==========

    const bookingData = {
      userId: user._id,
      showtimeId,
      seats,
      shopItems,
      totalPrice,
      paymentStatus: 'pending',
    }

    const booking = await Booking.create([bookingData], { session })

    if (!booking || booking.length === 0) {
      res.status(500).json({ message: 'Failed to create booking' })
      await session.abortTransaction()
      return
    }

    const newBooking = booking[0]

    // ========== STRIPE PAYMENT INTENT ==========

    // Stripe uses smallest currency units (cents for USD, fen for VND)
    // Assuming you're using VND, multiply by 1 (or adjust based on currency)
    const currency = process.env.STRIPE_CURRENCY || 'vnd'
    const amount =
      currency.toLowerCase() === 'usd'
        ? Math.round(totalPrice * 100) // USD: multiply by 100
        : Math.round(totalPrice) // VND: already in smallest unit or multiply by 1

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata: {
        bookingId: newBooking._id.toString(),
        userId: user._id.toString(),
        showtimeId,
        seats: seats.join(','),
      },
      description: `Cinema Booking - Seats: ${seats.join(', ')}`,
    })

    // ========== COMMIT TRANSACTION ==========

    await session.commitTransaction()

    // ========== RESPONSE ==========

    res.status(201).json({
      success: true,
      message: 'Booking created successfully. Proceed to payment.',
      booking: {
        _id: newBooking._id,
        userId: newBooking.userId,
        showtimeId: newBooking.showtimeId,
        seats: newBooking.seats,
        shopItems: newBooking.shopItems,
        totalPrice: newBooking.totalPrice,
        paymentStatus: newBooking.paymentStatus,
        createdAt: newBooking.createdAt,
      },
      payment: {
        clientSecret: paymentIntent.client_secret,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      },
    })
  } catch (error) {
    await session.abortTransaction()

    console.error('Error creating booking:', error)

    if (error instanceof mongoose.Error.ValidationError) {
      res.status(400).json({
        message: 'Validation error',
        error: error.message,
      })
      return
    }

    if (error instanceof mongoose.Error.CastError) {
      res.status(400).json({
        message: 'Invalid ID format',
        error: error.message,
      })
      return
    }

    res.status(500).json({
      message: 'Create Booking Failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  } finally {
    session.endSession()
  }
}

/**
 * @desc Get booking details by ID
 * @route GET /user/bookings/:id
 * @access Private (User - own booking only)
 */
export const getBookingById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userId = (req as any).user?.id

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: 'Invalid booking ID' })
      return
    }

    const booking = await Booking.findById(id)
      .populate('userId', 'name email')
      .populate('showtimeId')
      .populate('shopItems.itemId', 'name price')

    if (!booking) {
      res.status(404).json({ message: 'Booking not found' })
      return
    }

    // Check ownership
    if (booking.userId && (booking.userId as any)._id.toString() !== userId) {
      res.status(403).json({ message: 'Unauthorized to access this booking' })
      return
    }

    res.status(200).json(booking)
  } catch (error) {
    res.status(500).json({
      message: 'Get Booking Failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

/**
 * @desc Get all bookings for the current user
 * @route GET /user/bookings
 * @access Private (User)
 */
export const getUserBookings = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id

    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' })
      return
    }

    const bookings = await Booking.find({ userId })
      .populate('showtimeId', 'startTime endTime price')
      .populate('shopItems.itemId', 'name price')
      .sort({ createdAt: -1 })

    res.status(200).json(bookings)
  } catch (error) {
    res.status(500).json({
      message: 'Get Bookings Failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

/**
 * @desc Cancel a booking (refund if already paid)
 * @route DELETE /user/bookings/:id
 * @access Private (User - own booking only)
 */
export const cancelBooking = async (req: Request, res: Response) => {
  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const { id } = req.params
    const userId = (req as any).user?.id

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: 'Invalid booking ID' })
      await session.abortTransaction()
      return
    }

    const booking = await Booking.findById(id).session(session)

    if (!booking) {
      res.status(404).json({ message: 'Booking not found' })
      await session.abortTransaction()
      return
    }

    // Check ownership
    if (booking.userId.toString() !== userId) {
      res.status(403).json({ message: 'Unauthorized to cancel this booking' })
      await session.abortTransaction()
      return
    }

    // Cannot cancel if already cancelled
    if (booking.paymentStatus === 'cancelled') {
      res.status(400).json({ message: 'Booking is already cancelled' })
      await session.abortTransaction()
      return
    }

    // Update booking status
    booking.paymentStatus = 'cancelled'
    await booking.save({ session })

    // TODO: Handle refund if paymentStatus was 'paid'
    // if (booking.paymentStatus === 'paid') {
    //   // Create refund in Stripe
    // }

    await session.commitTransaction()

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      booking,
    })
  } catch (error) {
    await session.abortTransaction()

    console.error('Error cancelling booking:', error)

    res.status(500).json({
      message: 'Cancel Booking Failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  } finally {
    session.endSession()
  }
}
