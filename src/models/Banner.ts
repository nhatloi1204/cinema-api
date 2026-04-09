import mongoose from 'mongoose'
const { Schema } = mongoose

const bannerSchema = new Schema(
  {
    title: { type: String, required: true },
    subtitle: String,
    image: { type: String, required: true },
    link: String,
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
)

export const Banner = mongoose.model('Banner', bannerSchema)
