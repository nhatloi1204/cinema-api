import mongoose from 'mongoose'
const { Schema } = mongoose

const shopItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    image: String,
  },
  { timestamps: true },
)

export const ShopItem = mongoose.model('ShopItem', shopItemSchema)
