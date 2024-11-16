import { Router } from 'express'
import { authMiddleware } from '../middlewares/authentication'
import {
  createNewQuizEvent,
  createNewQuizSeries,
  deleteQuizEvent,
  deleteQuizSeries,
  getAllUsersEvent,
  getAllUsersSeries,
  getLeaderboardForSeries,
  getQuizEventById,
  getQuizSeriesById,
  updateQuizEvent,
  updateQuizSeries,
} from '../controllers/event'

export default (router: Router) => {
  router.get('/events/:id', getAllUsersEvent)
  router.get('/events/event/:id', getQuizEventById)

  router.post('/events', authMiddleware, createNewQuizEvent)
  router.patch('/events/event/:id', authMiddleware, updateQuizEvent)
  router.delete('/events/event/:id', authMiddleware, deleteQuizEvent)

  router.get('/series/:id', getAllUsersSeries)
  router.get('/series/series/:id', getQuizSeriesById)

  router.post('/series', authMiddleware, createNewQuizSeries)
  router.patch('/series/series/:id', authMiddleware, updateQuizSeries)
  router.delete('/series/series/:id', authMiddleware, deleteQuizSeries)

  router.get('/series/leaderboard/:id', getLeaderboardForSeries)
}
