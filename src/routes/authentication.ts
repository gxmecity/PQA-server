import { Router, Request, Response } from 'express'

import { authMiddleware } from '../middlewares/authentication'
import {
  registerUser,
  registerTeam,
  updateTeamInfo,
  updateTeamSigil,
  loginUser,
  retrieveSession,
} from '../controllers/authentication'
import { upload } from '../middlewares/multer'

export default (router: Router) => {
  router.post('/auth/signup', registerUser)
  router.post('/auth/login', loginUser)
  router.get(`/auth/retrieve-session`, retrieveSession)
  router.post('/auth/team/register', upload.single('image'), registerTeam)
  router.patch('/auth/team/update/:id', updateTeamInfo)
  router.patch('/auth/team/update-sigil/:id', updateTeamSigil)

  router.get('/testing', (req: Request, res: Response) => {
    res.success('Working')
  })
}
