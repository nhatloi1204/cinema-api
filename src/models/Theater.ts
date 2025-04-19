import mongoose from 'mongoose'
const { Schema } = mongoose

const theaterSchema = new Schema(
  {
    name: { type: String, required: true },
    location: { type: String, required: true },
  },
  { timestamps: true },
)

export const Theater = mongoose.model('Theater', theaterSchema)
