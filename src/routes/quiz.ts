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

  router.get('/quiz/my-quiz', authMiddleware, getUsersQuizList)
  router.post('/quiz/my-quiz', authMiddleware, createNewQuiz)
  router.get('/quiz/my-quiz/:id', authMiddleware, getUserQuizDetailsById)
  router.patch('/quiz/my-quiz/:id', authMiddleware, updateQuizDetails)
  router.delete('/quiz/my-quiz/:id', authMiddleware, deleteQuiz)

  router.post('/quiz/my-quiz/:id/round', authMiddleware, addNewQuizRound)
  router.patch(
    '/quiz/my-quiz/:id/round/:round_id',
    authMiddleware,
    updateQuizRound
  )
  router.delete(
    '/quiz/my-quiz/:id/round/:round_id',
    authMiddleware,
    deleteQuizRound
  )

  router.post(
    '/quiz/upload',
    authMiddleware,
    upload.single('file'),
    uploadedQuestionsCSV
  )
}
