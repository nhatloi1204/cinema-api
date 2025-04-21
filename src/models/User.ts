import mongoose from 'mongoose'
const { Schema } = mongoose

const userSchema = new Schema(
  {
    auth0Id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phoneNumber: { type: String, default: '' },
    avatar: String,
    role: {
      type: String,
      enum: ['Admin', 'User'],
      default: 'User',
      required: true,
    },
  },
  { timestamps: true },
)

export const User = mongoose.model('User', userSchema)
