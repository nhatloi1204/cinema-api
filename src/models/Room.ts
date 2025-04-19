import mongoose from 'mongoose'
const { Schema } = mongoose

const seatSchema = new Schema(
  {
    code: { type: String, required: true }, // eg: A1, A2
    type: { type: String, enum: ['normal', 'vip'], default: 'normal' },
  },
  { _id: false },
)

const roomSchema = new Schema(
  {
    name: { type: String, required: true },
    theaterId: { type: Schema.Types.ObjectId, ref: 'Theater', required: true },
    rows: { type: Number, required: true },
    cols: { type: Number, required: true },
    seatLayout: {
      type: [[{ type: seatSchema, default: null }]],
      required: true,
    },
  },
  { timestamps: true },
)

export const Room = mongoose.model('Room', roomSchema)
