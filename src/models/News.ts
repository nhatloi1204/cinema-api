import mongoose from 'mongoose'
import { Schema } from 'mongoose'

const newsSchema = new Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    image: String,
  },
  { timestamps: true },
)

export const News = mongoose.model('News', newsSchema)
