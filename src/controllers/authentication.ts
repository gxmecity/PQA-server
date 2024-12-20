import express, { NextFunction, Request, Response } from 'express'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { AuthenticatedRequest } from '../middlewares/authentication'
import { CustomError } from '../middlewares/errorHandler'
import { UserModel } from '../shemas/users'
import { handleUpload } from '../lib/cloudinary'
import { TeamModel } from '../shemas/teams'
import { QuizModel } from '../shemas/quiz'
import { QuizEventModel } from '../shemas/quiz'
import { QuizSeriesModel } from '../shemas/quiz'

export const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password, fullname, role } = req.body

    if (!email || !password) throw new CustomError('Invalid Credentials', 400)

    const foundUser = await UserModel.findOne({ email })

    if (foundUser)
      throw new CustomError('User with this email already exists', 401)

    const newUser = await UserModel.create({
      email,
      password,
      fullname,
      raw_pass: password,
    })

    const token = jwt.sign(
      { _id: newUser._id.toString() },
      process.env.JWT_SECRET,
      {
        expiresIn: '3 days',
      }
    )

    res.success({ user: newUser, token }, 'Account Created Successfully')
  } catch (error) {
    next(error)
  }
}

export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email, password } = req.body

  try {
    const foundUser = await UserModel.findOne({ email }).select('+password')

    if (!foundUser) throw new CustomError('Account Not Found', 401)

    const isPasswordValid = await foundUser.comparePassword(password)

    if (!isPasswordValid) throw new CustomError('Invalid Password', 401)

    const token = jwt.sign(
      { _id: foundUser._id.toString() },
      process.env.JWT_SECRET,
      {
        expiresIn: '3 days',
      }
    )

    res.success({ user: foundUser, token }, 'Logged In Successfully')
  } catch (error) {
    next(error)
  }
}

export const loginTeam = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id, passphrase } = req.body

  try {
    const foundTeam = await TeamModel.findById(id).select('+passphrase')

    const isPhraseValid = await foundTeam.comparePassphrase(passphrase)

    if (!isPhraseValid) throw new CustomError('Invalid Passphrase', 401)

    res.success(foundTeam, 'Logged In Successfully')
  } catch (error) {
    next(error)
  }
}

export const registerTeam = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { name, passphrase, team_members, quiz_master, sigil } = req.body

  try {
    if (!name || !passphrase || !quiz_master)
      throw new CustomError('Invalid Credentials', 400)

    const newTeam = await TeamModel.create({
      name,
      passphrase,
      team_members: JSON.parse(team_members),
      quiz_master,
      sigil,
    })

    res.success(newTeam, 'Team Created Successfully')
  } catch (error) {
    next(error)
  }
}

export const getQuizMasterTeams = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params

  try {
    const teams = await TeamModel.find({ quiz_master: id })

    res.success(teams)
  } catch (error) {
    next(error)
  }
}

export const getTeamById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params

  try {
    const team = await TeamModel.findById(id).populate('quiz_master')

    res.success(team, 'Team details')
  } catch (error) {
    next(error)
  }
}

export const updateTeamInfo = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params
  const details = req.body

  try {
    const infoToUpdate = {
      ...details,
      team_members: JSON.parse(details.team_members),
    }

    const updatedTeam = await TeamModel.findByIdAndUpdate(
      id,
      { $set: infoToUpdate },
      {
        new: true,
        runValidators: true,
      }
    )

    res.success(updatedTeam, 'Team Updated Successfully')
  } catch (error) {
    next(error)
  }
}

export const updateUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const user_id = req.user_id
  const details = req.body

  try {
    const updatedUser = await UserModel.findByIdAndUpdate(
      user_id,
      { $set: details },
      {
        new: true,
        runValidators: true,
      }
    )

    res.success(updatedUser, 'Account Updated Succesfully')
  } catch (error) {
    next(error)
  }
}

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const email = req.body.email

  try {
    const user = await UserModel.findOne({ email })

    if (!user) throw new CustomError('User with email does not exist', 400)
  } catch (error) {
    next(error)
  }
}

export const resetPassword = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {}

export const deleteUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const user_id = req.user_id

  try {
    const updatedUser = await UserModel.findByIdAndDelete(user_id)

    res.success(null, 'Account Deleted Succesfully')
  } catch (error) {
    next(error)
  }
}

export const getUserDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params

  try {
    const foundUser = await UserModel.findById(id)

    res.success({ user: foundUser })
  } catch (error) {
    next(error)
  }
}

export const retrieveSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.header('Authorization')?.replace('Bearer ', '')

  try {
    if (!token) {
      throw new CustomError('No Authorization token', 401)
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload

    const loggedinUser = await UserModel.findById(decoded._id)

    res.success({ user: loggedinUser })
  } catch (error) {
    next(error)
  }
}
export const getDashBoardStats = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const user_id = req.user_id

  try {
    const userQuiz = await QuizModel.countDocuments({ creator: user_id })
    const userEvents = await QuizEventModel.countDocuments({ creator: user_id })
    const userSeries = await QuizSeriesModel.countDocuments({
      creator: user_id,
    })
    const userTeams = await TeamModel.countDocuments({ quiz_master: user_id })

    res.success({
      quiz: userQuiz,
      events: userEvents,
      series: userSeries,
      userTeams: userTeams,
    })
  } catch (error) {
    next(error)
  }
}
