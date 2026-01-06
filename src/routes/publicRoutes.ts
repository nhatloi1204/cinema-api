import express from 'express'
import * as publicController from '../controllers'

const router = express.Router()

// SHOP ITEMS
router.get('/shop-items', publicController.getAllShopItems)
router.get('/shop-items/:id', publicController.getShopItemById)

// NEWS
router.get('/news', publicController.getAllNews)
router.get('/news/:id', publicController.getNewsById)

// EVENTS
router.get('/events', publicController.getAllEvents)
router.get('/events/:id', publicController.getEventById)

// MOVIES
router.get('/movies', publicController.getAllMovies)
router.get('/movies/:id', publicController.getMovieById)

// THEATERS
router.get('/theaters', publicController.getAllTheaters)
router.get('/theaters/:id', publicController.getTheaterById)

// SHOWTIMES
router.get('/showtimes', publicController.getAllShowtimes)
router.get('/showtimes/:id', publicController.getShowtimeById)
router.get('/showtimes/movie/:movieId', publicController.getShowtimesByMovie)
router.get('/showtimes/:id/occupied-seats', publicController.getOccupiedSeats)
router.get('/showtimes/:id/seats-layout', publicController.getSeatsLayout)

export default router
