import mongoose from 'mongoose'
const { Schema } = mongoose

const OrderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    items: [
      {
        item: { type: mongoose.Schema.Types.ObjectId, ref: 'ShopItem' },
        quantity: { type: Number, default: 1 },
      },
    ],
    totalPrice: Number,
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid'],
      default: 'pending',
    },
  },
  { timestamps: true },
)

export const Order = mongoose.model('Order', OrderSchema)
