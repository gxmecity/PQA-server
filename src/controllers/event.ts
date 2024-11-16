import express, { NextFunction, Request, Response } from 'express'
import { AuthenticatedRequest } from '../middlewares/authentication'
import { QuizEventModel, QuizSeriesModel } from '../shemas/quiz'

export const createNewQuizEvent = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const user = req.user_id
  const { title, host_entry_code, entry_code, quiz, scheduled_date } = req.body

  try {
    const event = await QuizEventModel.create({
      title,
      host_entry_code,
      entry_code,
      quiz,
      scheduled_date,
      creator: user,
    })

    res.success(event, 'Event Created')
  } catch (error) {
    next(error)
  }
}

export const getAllUsersEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params

  try {
    const userEvents = await QuizEventModel.find({ creator: id }).select(
      '-host_entry_code, -entry_code, -leaderboard'
    )

    res.success(userEvents, 'User Created Events')
  } catch (error) {
    next(error)
  }
}

export const getQuizEventById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params

  try {
    const event = await QuizEventModel.findById(id).select(
      '-host_entry_code, -entry_code'
    )

    res.success(event, 'Quiz Event Details')
  } catch (error) {
    next(error)
  }
}

export const updateQuizEvent = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params
  const details = req.body

  try {
    const updatedEvent = await QuizEventModel.findByIdAndUpdate(id, details, {
      new: true,
    })

    res.success(updatedEvent, 'Event Updated Successfully')
  } catch (error) {
    next(error)
  }
}

export const deleteQuizEvent = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params
  try {
    await QuizEventModel.findByIdAndDelete(id)
    res.success('Event Deleted')
  } catch (error) {
    next(error)
  }
}

export const createNewQuizSeries = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const user = req.user_id
  const { title } = req.body

  try {
    const series = await QuizSeriesModel.create({ title, creator: user })

    res.success(series, 'Series Created Successfuly')
  } catch (error) {
    next(error)
  }
}

export const getAllUsersSeries = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params
  try {
    const userCrestedSeries = await QuizSeriesModel.find({ creator: id })

    res.success(userCrestedSeries, 'User Created Series')
  } catch (error) {
    next(error)
  }
}

export const getQuizSeriesById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params

  try {
    const event = await QuizSeriesModel.findById(id)

    res.success(event, 'Quiz Series Details')
  } catch (error) {
    next(error)
  }
}

export const updateQuizSeries = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params
  const details = req.body

  try {
    const updatedEvent = await QuizSeriesModel.findByIdAndUpdate(id, details, {
      new: true,
    })

    res.success(updatedEvent, 'Series Updated Successfully')
  } catch (error) {
    next(error)
  }
}

export const deleteQuizSeries = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params
  try {
    await QuizSeriesModel.findByIdAndDelete(id)
    res.success('Series Deleted')
  } catch (error) {
    next(error)
  }
}

export const getLeaderboardForSeries = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params
  try {
    const leaderboard = await QuizSeriesModel.aggregate([
      { $match: { _id: id } },
      {
        $lookup: {
          from: 'quizevents',
          localField: 'events',
          foreignField: '_id',
          as: 'eventDetails',
        },
      },

      { $unwind: '$eventDetails' },

      { $unwind: '$eventDetails.leaderboard' },
      {
        $match: {
          'eventDetails.leaderboard.player.team_id': {
            $exists: true,
            $ne: null,
          },
        },
      },

      {
        $group: {
          _id: '$eventDetails.leaderboard.player.team_id',
          totalScore: { $sum: '$eventDetails.leaderboard.score' },
          players: { $addToSet: '$eventDetails.leaderboard.player.name' },
        },
      },
      { $sort: { totalScore: -1 } },
    ])

    res.success(leaderboard, 'Series Leaderboard')
  } catch (error) {
    next(error)
  }
}
