import mongoose from 'mongoose'
import { Schema } from 'mongoose'

const eventSchema = new Schema(
  {
    title: { type: String, required: true },
    description: String,
    image: String,
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
  },
  { timestamps: true },
)

export const Event = mongoose.model('Event', eventSchema)
