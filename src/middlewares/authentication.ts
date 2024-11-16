import { NextFunction, Request, Response } from 'express'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { CustomError } from './errorHandler'

export interface AuthenticatedRequest extends Request {
  user_id?: string | object
}

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.header('Authorization')

  if (!token) throw new CustomError('Authentication token missing', 401)

  try {
    const decoded = jwt.verify(
      token.replace('Bearer ', ''),
      process.env.JWT_SECRET
    ) as JwtPayload
    req.user_id = decoded._id
    next()
  } catch (err) {
    next(err)
  }
}
