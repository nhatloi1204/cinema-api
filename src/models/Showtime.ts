import mongoose from 'mongoose'
const { Schema } = mongoose

const showtimeSchema = new Schema(
  {
    movieId: { type: Schema.Types.ObjectId, ref: 'Movie', required: true },
    roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
    theaterId: { type: Schema.Types.ObjectId, ref: 'Theater', required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    price: { type: Number, required: true },
  },
  { timestamps: true },
)

export const Showtime = mongoose.model('Showtime', showtimeSchema)
