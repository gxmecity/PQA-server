import express, { NextFunction, Request, Response } from 'express'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { AuthenticatedRequest } from '../middlewares/authentication'
import { CustomError } from '../middlewares/errorHandler'
import { UserModel } from '../shemas/users'
import { handleUpload } from '../lib/cloudinary'
import { TeamModel } from '../shemas/teams'

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

    const newUser = await UserModel.create({ email, password, fullname })

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

export const registerTeam = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { name, passphrase, team_members, quiz_master } = req.body
  const file = req.file

  try {
    if (!name || !passphrase || !quiz_master)
      throw new CustomError('Invalid Credentials', 400)

    let asset: string = ''

    if (file) {
      const b64 = Buffer.from(req.file.buffer).toString('base64')
      let dataURI = 'data:' + req.file.mimetype + ';base64,' + b64
      const cldRes = await handleUpload(dataURI)
      asset = cldRes.secure_url
    }

    const newTeam = await TeamModel.create({
      name,
      passphrase,
      team_members,
      quiz_master,
      sigil: asset,
    })

    res.success(newTeam, 'Team Created Successfully')
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
    const updatedTeam = await TeamModel.findByIdAndUpdate(id, details, {
      new: true,
    })

    res.success(updatedTeam, 'Team Updated Successfully')
  } catch (error) {
    next(error)
  }
}

export const updateTeamSigil = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params
  const file = req.file

  try {
    const b64 = Buffer.from(req.file.buffer).toString('base64')
    let dataURI = 'data:' + req.file.mimetype + ';base64,' + b64
    const cldRes = await handleUpload(dataURI)
    const asset = cldRes.secure_url

    const updatedTeam = await TeamModel.findByIdAndUpdate(
      id,
      { sigil: asset },
      {
        new: true,
      }
    )

    res.success(updatedTeam, 'Sigil Updated Successfully')
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
    const updatedUser = await UserModel.findByIdAndUpdate(user_id, details, {
      new: true,
    })

    res.success(updatedUser, 'Account Updated Succesfully')
  } catch (error) {
    next(error)
  }
}

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
