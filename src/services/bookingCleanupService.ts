import { Booking } from '../models/Booking'

/**
 * @desc Clean up expired pending bookings
 * This service should be run periodically (e.g. via cron job)
 * It marks pending bookings as 'expired' if their expiration time has passed
 */
export const cleanupExpiredBookings = async () => {
  try {
    const now = new Date()

    // Find all expired pending bookings
    const result = await Booking.updateMany(
      {
        paymentStatus: 'pending',
        expiresAt: { $lt: now },
      },
      {
        paymentStatus: 'expired',
      },
    )

    if (result.modifiedCount > 0) {
      console.log(
        `✅ Cleaned up ${result.modifiedCount} expired bookings at ${now.toISOString()}`,
      )
    }

    return result
  } catch (error) {
    console.error('❌ Error cleaning up expired bookings:', error)
    throw error
  }
}

/**
 * @desc Start the booking cleanup scheduler
 * Runs cleanup every 5 minutes
 */
export const startBookingCleanupScheduler = () => {
  const CLEANUP_INTERVAL = 5 * 60 * 1000 // 5 minutes in milliseconds

  const intervalId = setInterval(async () => {
    await cleanupExpiredBookings()
  }, CLEANUP_INTERVAL)

  console.log(
    `📅 Booking cleanup scheduler started. Running every ${CLEANUP_INTERVAL / 1000 / 60} minutes`,
  )

  // Return ID so it can be stopped if needed
  return intervalId
}
