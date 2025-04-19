import mongoose from 'mongoose'
const { Schema } = mongoose

const bookingSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    showtimeId: {
      type: Schema.Types.ObjectId,
      ref: 'Showtime',
      required: true,
    },
    seats: [{ type: String, required: true }], // eg: ['A1', 'A2']
    shopItems: [
      {
        itemId: { type: Schema.Types.ObjectId, ref: 'ShopItem' },
        quantity: { type: Number, default: 1 },
      },
    ],
    totalPrice: { type: Number, required: true },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'cancelled'],
      default: 'pending',
    },
  },
  { timestamps: true },
)

export const Booking = mongoose.model('Booking', bookingSchema)
