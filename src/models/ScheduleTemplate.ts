import mongoose from 'mongoose'
const { Schema } = mongoose

const scheduleTemplateSchema = new Schema(
  {
    name: { type: String, required: true },
    description: String,
    filmIds: [{ type: Schema.Types.ObjectId, ref: 'Movie', required: true }],
    filmPriorities: [Number], // Độ ưu tiên tương ứng với filmIds (1, 2, 3...)
    roomIds: [{ type: Schema.Types.ObjectId, ref: 'Room', required: true }],
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    timeSlots: [String], // ["08:00", "10:30", "13:00", ...]
    bufferTime: { type: Number, default: 20 }, // Phút
    price: { type: Number, required: true },
    theaterId: { type: Schema.Types.ObjectId, ref: 'Theater', required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
)

export const ScheduleTemplate = mongoose.model(
  'ScheduleTemplate',
  scheduleTemplateSchema,
)
