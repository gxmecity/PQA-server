import { Router, Request, Response } from 'express'

import { authMiddleware } from '../middlewares/authentication'
import {
  registerUser,
  registerTeam,
  updateTeamInfo,
  loginUser,
  retrieveSession,
  getQuizMasterTeams,
  getTeamById,
} from '../controllers/authentication'
import { upload } from '../middlewares/multer'

export default (router: Router) => {
  router.post('/auth/signup', registerUser)
  router.post('/auth/login', loginUser)
  router.get(`/auth/retrieve-session`, authMiddleware, retrieveSession)

  router.get('/teams/:id', getQuizMasterTeams)

  router.get('/team/:id', getTeamById)
  router.post('/team/register', upload.single('image'), registerTeam)
  router.patch('/team/update/:id', upload.single('image'), updateTeamInfo)

  router.get('/testing', (req: Request, res: Response) => {
    res.success('Working')
  })
}
