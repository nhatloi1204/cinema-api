import mongoose from 'mongoose'
const { Schema } = mongoose

const shopItemSchema = new mongoose.Schema(
  {
    name: String,
    description: String,
    price: Number,
    image: String,
  },
  { timestamps: true },
)

export const ShopItem = mongoose.model('ShopItem', shopItemSchema)
