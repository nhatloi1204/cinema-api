import mongoose from 'mongoose'
const { Schema } = mongoose

const movieSchema = new Schema(
  {
    title: { type: String, required: true },
    description: String,
    genre: { type: String, required: true },
    duration: { type: Number, required: true },
    releaseDate: Date,
    poster: String,
    trailerUrl: String,
    status: {
      type: String,
      enum: ['now_showing', 'coming_soon', 'offline'],
      required: true,
    },
    director: String,
    cast: [String],
  },
  { timestamps: true },
)

export const Movie = mongoose.model('Movie', movieSchema)
