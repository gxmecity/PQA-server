import express, { NextFunction, Request, Response } from 'express'
import { AuthenticatedRequest } from '../middlewares/authentication'
import csvToJson from 'convert-csv-to-json'
import fs from 'fs'
import path from 'path'
import { QuizModel } from '../shemas/quiz'

export const getAllPublishedQuizList = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const publishedQuizList = await QuizModel.find({ publish: true })
      .populate('creator')
      .select('-rounds.questions.answer')

    res.success(publishedQuizList, 'List of avaiable quizes')
  } catch (error) {
    next(error)
  }
}

export const getUsersQuizList = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const user = req.user_id

  try {
    const userQuizList = await QuizModel.find({ creator: user })
      .populate('creator')
      .select('-rounds.questions.answer')

    res.success(userQuizList, 'List of user quizes')
  } catch (error) {
    next(error)
  }
}

export const getQuizDetailsById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params

  try {
    const quiz = await QuizModel.findById(id)
      .populate('creator')
      .select('-rounds.questions.answer')

    res.success(quiz, 'List of user quizes')
  } catch (error) {
    next(error)
  }
}

export const getUserQuizDetailsById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params
  const user = req.user_id

  try {
    const quiz = await QuizModel.findOne({ _id: id, creator: user })

    res.success(quiz, 'List of user quizes')
  } catch (error) {
    next(error)
  }
}

export const createNewQuiz = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const user = req.user_id

  const { title, description } = req.body
  try {
    const newQuiz = await QuizModel.create({
      title,
      description,
      creator: user,
    })

    res.success(newQuiz, 'Quiz created successfully')
  } catch (error) {
    next(error)
  }
}

export const updateQuizDetails = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params
  const details = req.body

  try {
    const updatedQuiz = await QuizModel.findByIdAndUpdate(id, details, {
      new: true,
    })

    res.success(updatedQuiz, 'Quiz updated successfully')
  } catch (error) {
    next(error)
  }
}

export const deleteQuiz = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params

  try {
    await QuizModel.findByIdAndDelete(id)

    res.success(null, 'Quiz Deleted successfully')
  } catch (error) {
    next(error)
  }
}

export const addNewQuizRound = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params
  const details = req.body

  try {
    const updatedQuiz = await QuizModel.findByIdAndUpdate(
      id,
      {
        $push: { rounds: details },
      },
      {
        new: true,
      }
    )

    res.success(updatedQuiz, 'Quiz updated successfully')
  } catch (error) {
    next(error)
  }
}

export const updateQuizRound = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const user = req.user_id
  const { id, round_id } = req.params
  const details = req.body

  try {
    const updatedQuiz = await QuizModel.updateOne(
      { _id: id, 'rounds._id': round_id },
      { $set: { 'rounds.$': details } }
    )

    res.success(updatedQuiz, 'Quiz updated successfully')
  } catch (error) {
    next(error)
  }
}

export const deleteQuizRound = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const user = req.user_id
  const { id, round_id } = req.params

  try {
    const updatedQuiz = await QuizModel.findByIdAndUpdate(
      id,
      {
        $pull: { rounds: { _id: round_id } },
      },
      {
        new: true,
      }
    )

    res.success(updatedQuiz, 'Quiz updated successfully')
  } catch (error) {
    next(error)
  }
}

export const uploadedQuestionsCSV = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const filePath = path.join(__dirname, req.file.path)

  try {
    const jsonResult = csvToJson.getJsonFromCsv(filePath)

    fs.unlinkSync(filePath)

    res.success(jsonResult, 'Questions converted')
  } catch (error) {
    next(error)
  }
}
