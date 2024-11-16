import express, { Router } from 'express'
import authentication from './authentication'
import quizses from './quiz'
import events from './events'

const router = express.Router()

export default (): Router => {
  authentication(router)
  quizses(router)
  events(router)

  return router
}
