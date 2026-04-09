import { Movie } from '../models/Movie'
import { Room } from '../models/Room'

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

// Check if a time slot can fit a movie with buffer
function canFitMovie(
  slotStartMinutes: number,
  movieDurationMinutes: number,
  bufferMinutes: number,
  nextSlotMinutes: number | null,
  endOfDayMinutes: number = 1440, // 24:00 in minutes
): boolean {
  const endTimeMinutes = slotStartMinutes + movieDurationMinutes + bufferMinutes

  // Check if it exceeds end of day
  if (endTimeMinutes > endOfDayMinutes) {
    return false
  }

  // If there's a next slot, check if we overlap
  if (nextSlotMinutes && endTimeMinutes > nextSlotMinutes) {
    return false
  }

  return true
}

export async function generateSchedules(
  config: ScheduleConfig,
): Promise<GeneratedShowtime[]> {
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

  // Track which (date, timeSlot, room) are occupied
  const occupiedSlots = new Map<string, Set<string>>() // "2026-04-10|14:00" -> Set of roomIds

  // Main loop: For each date
  for (const date of dateArray) {
    const dateStr = date.toISOString().split('T')[0]

    // Initialize occupied slots for this date
    timeSlots.forEach(timeSlot => {
      const key = `${dateStr}|${timeSlot}`
      occupiedSlots.set(key, new Set())
    })

    // For each film (in priority order)
    for (const film of filmsWithPriority) {
      // For each time slot
      for (let slotIndex = 0; slotIndex < timeSlots.length; slotIndex++) {
        const timeSlot = timeSlots[slotIndex]
        const slotMinutes = timeSlotMinutes[slotIndex]
        const nextSlotMinutes =
          slotIndex + 1 < timeSlotMinutes.length
            ? timeSlotMinutes[slotIndex + 1]
            : null

        // Check if this film can fit in this time slot
        if (
          !canFitMovie(slotMinutes, film.duration, bufferTime, nextSlotMinutes)
        ) {
          continue // Can't fit, skip this time slot
        }

        const slotKey = `${dateStr}|${timeSlot}`
        const occupiedRooms = occupiedSlots.get(slotKey) || new Set()

        // Try to place film in one of the available rooms
        let placed = false
        for (const room of rooms) {
          const roomIdStr = room._id.toString()

          // Check if this room is available for this time slot
          if (!occupiedRooms.has(roomIdStr)) {
            // Calculate end time
            const startMinutes = slotMinutes
            const endMinutes = startMinutes + film.duration + bufferTime

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

            // Mark this room as occupied for this time slot
            occupiedRooms.add(roomIdStr)
            placed = true
            break // Move to next time slot after placing in a room
          }
        }

        // If placed, move to next time slot
        if (placed) {
          continue
        }
        // If not placed (all rooms occupied), try next time slot
      }
    }
  }

  return generatedShowtimes
}
