import { NextFunction, Request, Response } from 'express'

export class CustomError extends Error {
  public statusCode: number

  constructor(message: string, statusCode?: number) {
    super(message)
    this.statusCode = statusCode

    Object.setPrototypeOf(this, new.target.prototype)

    Error.captureStackTrace(this, this.constructor)
  }
}

const ErrorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errStatus = err.statusCode || 500
  const errMsg = err.message || 'Something went wrong'
  res.status(errStatus).json({
    success: false,
    status: errStatus,
    message: errMsg,
  })
}

export default ErrorHandler
