import { Request, Response } from 'express'
import { Movie } from '../models/Movie'
import { parseDate } from '../utils/parseDate'

// ================= ADMIN ==================

// @desc Create a movie
// @route POST /admin/movies
// @access Admin
export const createMovie = async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      genre,
      duration,
      releaseDate,
      poster,
      trailerUrl,
      status,
    } = req.body
    const movie = await Movie.create({
      title,
      description,
      genre,
      duration,
      releaseDate: parseDate(releaseDate),
      poster,
      trailerUrl,
      status,
    })
    res.status(201).json(movie)
  } catch (error) {
    res.status(500).json({ message: 'Create Movie Failed', error })
  }
}

// @desc Update a movie
// @route PUT /admin/movies/:id
// @access Admin
export const updateMovie = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const {
      title,
      description,
      genre,
      duration,
      releaseDate,
      poster,
      trailerUrl,
      status,
    } = req.body
    const updatedMovie = await Movie.findByIdAndUpdate(
      id,
      {
        title,
        description,
        genre,
        duration,
        releaseDate: parseDate(releaseDate),
        poster,
        trailerUrl,
        status,
      },
      {
        new: true,
      },
    )

    if (!updatedMovie) {
      res.status(404).json({ message: 'Movie not found' })
      return
    }
    res.status(200).json(updatedMovie)
  } catch (error) {
    res.status(500).json({ message: 'Update Movie Failed', error })
  }
}

// @desc Delete a movie
// @route DELETE /admin/movies/:id
// @access Admin
export const deleteMovie = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const deletedMovie = await Movie.findByIdAndDelete(id)

    if (!deletedMovie) {
      res.status(404).json({ message: 'Movie not found' })
      return
    }
    res.status(200).json({ message: 'Deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Delete Movie Failed', error })
  }
}

// ================= PUBLIC ==================

// @desc Get all movies
// @route GET /public/movies
// @access Public
export const getAllMovies = async (req: Request, res: Response) => {
  try {
    const movieList = await Movie.find().sort({ createdAt: -1 })
    res.status(200).json(movieList)
  } catch (error) {
    res.status(500).json({ message: 'Get Movie List Failed', error })
  }
}

// @desc Get movie by ID
// @route GET /public/movies/:id
// @access Public
export const getMovieById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const movie = await Movie.findById(id)

    if (!movie) {
      res.status(404).json({ message: 'Movie not found' })
      return
    }

    res.status(200).json(movie)
  } catch (error) {
    res.status(500).json({ message: 'Get Movie Failed', error })
  }
}
