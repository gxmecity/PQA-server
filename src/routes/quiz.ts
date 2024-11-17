import {
  getAllPublishedQuizList,
  getUsersQuizList,
  createNewQuiz,
  updateQuizDetails,
  deleteQuiz,
  deleteQuizRound,
  updateQuizRound,
  uploadedQuestionsCSV,
  addNewQuizRound,
  getQuizDetailsById,
  getUserQuizDetailsById,
} from '../controllers/quiz'
import { Router } from 'express'
import { upload } from '../middlewares/multer'
import { authMiddleware } from '../middlewares/authentication'

export default (router: Router) => {
  router.get('/quiz', getAllPublishedQuizList)
  router.get('/quiz/:id', getQuizDetailsById)

  router.get('/my-quiz', authMiddleware, getUsersQuizList)
  router.post('/my-quiz', authMiddleware, createNewQuiz)

  router.get('/my-quiz/:id', authMiddleware, getUserQuizDetailsById)
  router.patch('/my-quiz/:id', authMiddleware, updateQuizDetails)
  router.delete('/my-quiz/:id', authMiddleware, deleteQuiz)

  router.post('/my-quiz/:id/round', authMiddleware, addNewQuizRound)
  router.patch('/my-quiz/:id/round/:round_id', authMiddleware, updateQuizRound)
  router.delete('/my-quiz/:id/round/:round_id', authMiddleware, deleteQuizRound)

  router.post(
    '/quiz-questions/upload',
    authMiddleware,
    upload.single('file'),
    uploadedQuestionsCSV
  )
}
