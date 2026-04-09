import { Movie } from '../models/Movie'
import { Room } from '../models/Room'
import { Showtime } from '../models/Showtime'
import mongoose from 'mongoose'

interface FilmWithPriority {
  filmId: string
  duration: number
  priority: number
  title: string
}

interface GeneratedShowtime {
  roomId: string
  roomName: string
  theaterId: string
  movieId: string
  movieTitle: string
  date: Date
  startTime: Date
  endTime: Date
  duration: number
  price: number
}

interface ScheduleConfig {
  filmIds: string[]
  filmPriorities: number[]
  roomIds: string[]
  startDate: Date
  endDate: Date
  timeSlots: string[] // ["08:00", "10:30", ...]
  bufferTime: number
  price: number
  theaterId: string
}

interface GenerateResult {
  showtimes: GeneratedShowtime[]
  conflicts: Array<{
    film: string
    timeSlot: string
    date: string
    room: string
  }>
}

// Convert time string (HH:MM) to minutes since midnight
function timeStringToMinutes(timeStr: string): number {
  const [hour, minute] = timeStr.split(':').map(Number)
  return hour * 60 + minute
}

// Convert minutes since midnight to Date object for a specific date
function minutesToDate(dateObj: Date, minutes: number): Date {
  const date = new Date(dateObj)
  date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0)
  return date
}

// Check if a time slot in minutes can fit a movie with buffer
function canFitMovie(
  slotStartMinutes: number,
  movieDurationMinutes: number,
  bufferMinutes: number,
  endOfDayMinutes: number = 1440, // 24:00 in minutes
): boolean {
  const endTimeMinutes = slotStartMinutes + movieDurationMinutes + bufferMinutes

  // Check if it exceeds end of day
  if (endTimeMinutes > endOfDayMinutes) {
    return false
  }

  return true
}

export async function generateSchedules(
  config: ScheduleConfig,
): Promise<GenerateResult> {
  const {
    filmIds,
    filmPriorities,
    roomIds,
    startDate,
    endDate,
    timeSlots,
    bufferTime,
    price,
    theaterId,
  } = config

  // Fetch movies and rooms data
  const movies = await Movie.find({ _id: { $in: filmIds } })
  const rooms = await Room.find({ _id: { $in: roomIds } })

  if (movies.length === 0 || rooms.length === 0) {
    throw new Error('Movies or Rooms not found')
  }

  // Create array of films with priorities
  const filmsWithPriority: FilmWithPriority[] = filmIds.map((filmId, index) => {
    const movie = movies.find(m => m._id.toString() === filmId)
    return {
      filmId: filmId,
      duration: movie?.duration || 90,
      priority: filmPriorities[index] || index + 1,
      title: movie?.title || 'Unknown',
    }
  })

  // Sort by priority (ascending: 1, 2, 3...)
  filmsWithPriority.sort((a, b) => a.priority - b.priority)

  // Convert time slots to minutes
  const timeSlotMinutes = timeSlots.map(timeStringToMinutes)

  // Generate dates
  const dateArray: Date[] = []
  let currentDate = new Date(startDate)
  while (currentDate <= endDate) {
    dateArray.push(new Date(currentDate))
    currentDate.setDate(currentDate.getDate() + 1)
  }

  const generatedShowtimes: GeneratedShowtime[] = []

  // Track room's busy time intervals: "roomId|2026-04-10" -> [{startMinutes, endMinutes}, ...]
  const roomBusyIntervals = new Map<
    string,
    Array<{ startMinutes: number; endMinutes: number }>
  >()

  // Fetch existing showtimes and populate busyIntervals
  const roomObjectIds = roomIds.map(id => new mongoose.Types.ObjectId(id))
  const theaterObjectId = new mongoose.Types.ObjectId(theaterId)

  console.log(
    `[scheduleGenerator] Query params: theaterId=${theaterObjectId}, startDate=${startDate}, endDate=${endDate}`,
  )
  console.log(
    `[scheduleGenerator] roomObjectIds=${roomObjectIds.map(r => r.toString()).join(', ')}`,
  )

  const existingShowtimes = await Showtime.find({
    theaterId: theaterObjectId,
    startTime: { $gte: startDate, $lte: endDate },
    roomId: { $in: roomObjectIds },
  }).lean()

  // Populate roomBusyIntervals with existing showtimes
  for (const existingShowtime of existingShowtimes) {
    const dateStr = existingShowtime.startTime.toISOString().split('T')[0]
    const roomId = existingShowtime.roomId.toString()
    const key = `${roomId}|${dateStr}`

    const startMinutes =
      existingShowtime.startTime.getHours() * 60 +
      existingShowtime.startTime.getMinutes()
    const endMinutes =
      existingShowtime.endTime.getHours() * 60 +
      existingShowtime.endTime.getMinutes()

    console.log(
      `[scheduleGenerator] Existing showtime: room=${roomId}, date=${dateStr}, time=${startMinutes}-${endMinutes}`,
    )

    if (!roomBusyIntervals.has(key)) {
      roomBusyIntervals.set(key, [])
    }
    roomBusyIntervals.get(key)!.push({ startMinutes, endMinutes })
  }

  console.log(
    `[scheduleGenerator] Loaded ${existingShowtimes.length} existing showtimes`,
  )

  // Helper function to check if time overlaps with any busy interval
  function isRoomBusy(
    roomId: string,
    dateStr: string,
    startMinutes: number,
    endMinutes: number,
  ): boolean {
    const key = `${roomId}|${dateStr}`
    const intervals = roomBusyIntervals.get(key) || []
    return intervals.some(
      interval =>
        !(
          endMinutes <= interval.startMinutes ||
          startMinutes >= interval.endMinutes
        ),
    )
  }

  // Helper function to mark room as busy
  function markRoomBusy(
    roomId: string,
    dateStr: string,
    startMinutes: number,
    endMinutes: number,
  ): void {
    const key = `${roomId}|${dateStr}`
    if (!roomBusyIntervals.has(key)) {
      roomBusyIntervals.set(key, [])
    }
    roomBusyIntervals.get(key)!.push({ startMinutes, endMinutes })
  }

  // Array to store conflict errors
  const conflictErrors: Array<{
    film: string
    timeSlot: string
    date: string
    room: string
    existingShowtime?: { movie: string; startTime: Date; endTime: Date }
  }> = []

  // Main loop: For each date
  for (const date of dateArray) {
    const dateStr = date.toISOString().split('T')[0]

    // For each film (in priority order)
    for (const film of filmsWithPriority) {
      // For each time slot
      for (let slotIndex = 0; slotIndex < timeSlots.length; slotIndex++) {
        const timeSlot = timeSlots[slotIndex]
        const slotMinutes = timeSlotMinutes[slotIndex]

        // Check if this film can fit in this time slot (within 24 hours)
        if (!canFitMovie(slotMinutes, film.duration, bufferTime)) {
          continue // Can't fit, skip this time slot
        }

        const startMinutes = slotMinutes
        const endMinutes = startMinutes + film.duration + bufferTime
        const movieEndMinutes = startMinutes + film.duration

        // Try to place film in one of the available rooms
        let placed = false
        for (const room of rooms) {
          const roomIdStr = room._id.toString()

          // Check if this room is available (no time overlap with movie duration only)
          // Don't include buffer in overlap check - buffer is free time after movie
          const movieEndMinutes = startMinutes + film.duration

          console.log(
            `[scheduleGenerator] Checking room=${roomIdStr}, date=${dateStr}, time=${startMinutes}-${movieEndMinutes}`,
          )

          if (!isRoomBusy(roomIdStr, dateStr, startMinutes, movieEndMinutes)) {
            console.log(
              `[scheduleGenerator] Room ${roomIdStr} is available, allocating film ${film.title}`,
            )
            generatedShowtimes.push({
              roomId: roomIdStr,
              roomName: room.name || 'Unknown Room',
              theaterId,
              movieId: film.filmId,
              movieTitle: film.title,
              date: new Date(date),
              startTime: minutesToDate(date, startMinutes),
              endTime: minutesToDate(date, endMinutes),
              duration: film.duration,
              price,
            })

            // Mark this room as busy for this time interval
            markRoomBusy(roomIdStr, dateStr, startMinutes, movieEndMinutes)
            placed = true
            break // Move to next time slot after placing in a room
          }
        }

        // If not placed, record conflict
        if (!placed) {
          console.log(
            `[scheduleGenerator] NO room available for ${film.title} at ${timeSlot} on ${dateStr}`,
          )
          const occupiedRoomNames = rooms
            .filter(room => {
              const roomIdStr = room._id.toString()
              return isRoomBusy(
                roomIdStr,
                dateStr,
                startMinutes,
                movieEndMinutes,
              )
            })
            .map(r => r.name || r._id.toString())
            .join(', ')

          conflictErrors.push({
            film: film.title,
            timeSlot: timeSlot,
            date: dateStr,
            room: occupiedRoomNames || 'Tất cả phòng',
          })
        }
      }
    }
  }

  return {
    showtimes: generatedShowtimes,
    conflicts: conflictErrors,
  }
}
