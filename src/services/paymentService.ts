import { Request, Response } from 'express'
import mongoose from 'mongoose'
import Stripe from 'stripe'
import { Booking } from '../models/Booking'
import { User } from '../models/User'

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-12-18.acacia' as any,
})

/**
 * @desc Handle Stripe webhook events (payment confirmation, failures, etc.)
 * @route POST /webhooks/stripe
 * @access Public (but requires Stripe signature verification)
 */
export const handleStripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string

  if (!sig || !webhookSecret) {
    res.status(400).json({ message: 'Missing webhook signature or secret' })
    return
  }

  let event: Stripe.Event

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret)
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    res.status(400).json({
      message: 'Webhook signature verification failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log('Payment succeeded:', paymentIntent.id)

        const bookingId = paymentIntent.metadata?.bookingId

        if (!bookingId) {
          console.error('No bookingId in payment intent metadata')
          break
        }

        // Update booking status to 'paid'
        const updatedBooking = await Booking.findByIdAndUpdate(
          bookingId,
          { paymentStatus: 'paid' },
          { new: true },
        )

        if (updatedBooking) {
          console.log(`Booking ${bookingId} marked as paid`)
        } else {
          console.error(`Booking ${bookingId} not found`)
        }

        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log('❌ Payment failed:', paymentIntent.id)

        const bookingId = paymentIntent.metadata?.bookingId

        if (!bookingId) {
          console.error('No bookingId in payment intent metadata')
          break
        }

        // Update booking status to 'failed'
        const updatedBooking = await Booking.findByIdAndUpdate(
          bookingId,
          { paymentStatus: 'failed' },
          { new: true },
        )

        if (updatedBooking) {
          console.log(`✅ Booking ${bookingId} marked as failed`)
        } else {
          console.error(`Booking ${bookingId} not found`)
        }

        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        console.log('💰 Refund processed:', charge.id)

        // Find booking via payment intent metadata
        if (charge.payment_intent) {
          try {
            const paymentIntent = await stripe.paymentIntents.retrieve(
              charge.payment_intent as string,
            )
            const bookingId = paymentIntent.metadata?.bookingId

            if (bookingId) {
              // Update booking status to 'cancelled'
              const updatedBooking = await Booking.findByIdAndUpdate(
                bookingId,
                { paymentStatus: 'cancelled' },
                { new: true },
              )

              if (updatedBooking) {
                console.log(
                  `✅ Booking ${bookingId} cancelled - refund processed`,
                )
              } else {
                console.error(`Booking ${bookingId} not found for cancellation`)
              }
            }
          } catch (error) {
            console.error('Error processing refund webhook:', error)
          }
        }

        break
      }

      default: {
        console.log(`Unhandled event type: ${event.type}`)
      }
    }

    // Return 200 to acknowledge receipt of the event
    res.status(200).json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    res.status(500).json({
      message: 'Webhook processing failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

/**
 * @desc Confirm payment (called from frontend after successful client-side confirmation)
 * @route POST /bookings/confirm-payment
 * @access Private (User)
 *
 * Request body:
 * {
 *   bookingId: string,
 *   paymentIntentId: string
 * }
 */
export const confirmPayment = async (req: Request, res: Response) => {
  try {
    const auth0Id = (req as any).auth?.sub
    const { bookingId, paymentIntentId } = req.body

    if (!auth0Id) {
      res.status(401).json({ message: 'User not authenticated' })
      return
    }

    if (!bookingId || !paymentIntentId) {
      res.status(400).json({
        message: 'Missing required fields: bookingId, paymentIntentId',
      })
      return
    }

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      res.status(400).json({ message: 'Invalid booking ID' })
      return
    }

    // Get the booking
    const booking = await Booking.findById(bookingId)

    if (!booking) {
      res.status(404).json({ message: 'Booking not found' })
      return
    }

    // Get user by auth0Id
    const user = await User.findOne({ auth0Id })

    if (!user) {
      res.status(401).json({ message: 'User not found' })
      return
    }

    // Verify user ownership
    if (booking.userId.toString() !== user._id.toString()) {
      res.status(403).json({ message: 'Unauthorized to confirm this booking' })
      return
    }

    // Fetch the payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (!paymentIntent) {
      res.status(404).json({ message: 'Payment intent not found' })
      return
    }

    // Verify the booking matches the payment intent
    if (paymentIntent.metadata?.bookingId !== bookingId) {
      res.status(400).json({
        message: 'Payment intent does not match booking',
      })
      return
    }

    // Check payment status
    if (paymentIntent.status === 'succeeded') {
      // Update booking if not already paid
      if (booking.paymentStatus !== 'paid') {
        booking.paymentStatus = 'paid'
        await booking.save()
      }

      res.status(200).json({
        success: true,
        message: 'Payment confirmed successfully',
        booking: {
          _id: booking._id,
          paymentStatus: booking.paymentStatus,
          totalPrice: booking.totalPrice,
        },
      })
    } else if (paymentIntent.status === 'requires_payment_method') {
      res.status(400).json({
        message: 'Payment requires additional action',
        status: paymentIntent.status,
      })
    } else if (paymentIntent.status === 'processing') {
      res.status(200).json({
        message: 'Payment is processing',
        status: paymentIntent.status,
      })
    } else {
      res.status(400).json({
        message: `Payment status: ${paymentIntent.status}`,
        status: paymentIntent.status,
      })
    }
  } catch (error) {
    console.error('Error confirming payment:', error)

    res.status(500).json({
      message: 'Confirm Payment Failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

/**
 * @desc Create payment intent for a booking
 * @route POST /bookings/create-payment-intent
 * @access Private (User)
 *
 * Request body:
 * {
 *   bookingId: string
 * }
 */
export const createPaymentIntent = async (req: Request, res: Response) => {
  try {
    const auth0Id = (req as any).auth?.sub
    const { bookingId } = req.body

    if (!auth0Id) {
      res.status(401).json({ message: 'User not authenticated' })
      return
    }

    if (!bookingId) {
      res.status(400).json({ message: 'Missing bookingId' })
      return
    }

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      res.status(400).json({ message: 'Invalid booking ID' })
      return
    }

    // Get the booking
    const booking = await Booking.findById(bookingId)

    if (!booking) {
      res.status(404).json({ message: 'Booking not found' })
      return
    }

    // Get user by auth0Id
    const user = await User.findOne({ auth0Id })

    if (!user) {
      res.status(401).json({ message: 'User not found' })
      return
    }

    // Verify user ownership
    if (booking.userId.toString() !== user._id.toString()) {
      res
        .status(403)
        .json({ message: 'Unauthorized to create payment for this booking' })
      return
    }

    /**
     * Check if a payment intent already exists for the booking
     */
    const allPaymentIntents = await stripe.paymentIntents.list()

    const existingPaymentIntent = allPaymentIntents.data.find(
      intent => intent.metadata?.bookingId === bookingId,
    )

    if (existingPaymentIntent) {
      res.status(400).json({
        message: 'A payment intent already exists for this booking',
        paymentIntentId: existingPaymentIntent.id,
      })
      return
    }

    // Create a new payment intent if none exists
    const newPaymentIntent = await stripe.paymentIntents.create({
      amount: booking.totalPrice * 100, // Convert to cents
      currency: 'usd',
      metadata: { bookingId },
    })

    res.status(200).json({
      success: true,
      message: 'Payment intent created successfully',
      paymentIntentId: newPaymentIntent.id,
    })
  } catch (error) {
    console.error('Error creating payment intent:', error)

    res.status(500).json({
      message: 'Create Payment Intent Failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
