import express, { Response, Request, NextFunction } from 'express'
import http from 'http'
import bodyParser from 'body-parser'
import compression from 'compression'
import cors from 'cors'
import router from './routes'
import dotenv from 'dotenv'
import ErrorHandler, { CustomError } from './middlewares/errorHandler'
import successHandler from './middlewares/successHandler'
import { dbConnect } from './config/dbConect'
import { uniqueId } from './helpers'
import { Realtime } from 'ably'
import { Worker, isMainThread } from 'node:worker_threads'
import { QuizModel } from './shemas/quiz'
dotenv.config()

const globalQuizChName = 'tpq-main-quiz-thread'
let globalQuizChannel
const activeQuizRooms: {
  [key: string]: {
    roomCode: string
    hostRoomCode?: string
    quizId: string
    totalPlayers: number
    isRoomActive: boolean
  }
} = {}
let totalPlayersThroughout = 0

const realtime = new Realtime({
  key: process.env.ABLY_API_KEY,
  echoMessages: false,
})

const app = express()

app.use(
  cors({
    credentials: true,
  })
)

app.use(compression())

app.use(
  bodyParser.urlencoded({
    extended: false,
  })
)
app.use(bodyParser.json())

const server = http.createServer(app)

dbConnect()

server.listen(5000, () => {
  console.log('Server running on http://localhost:5000')
})

app.use(successHandler)

app.use('/api', router())

app.get('/api/realtime-auth', async (request, response) => {
  try {
    const tokenParams = { clientId: uniqueId() }
    const tokenRequest = await realtime.auth.createTokenRequest(tokenParams)

    response.setHeader('Content-Type', 'application/json')
    response.setHeader('Access-Control-Allow-Origin', '*')
    response.send(JSON.stringify(tokenRequest))
  } catch (error: any) {
    response
      .status(500)
      .send('Error requesting token: ' + JSON.stringify(error))
  }
})

app.get(
  '/api/check-room-status',
  function (req: Request, res: Response, next: NextFunction) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    const quizCode = req.query.quizCode
    const deviceType = req.query.playerType
    try {
      if (!quizCode || typeof quizCode !== 'string')
        throw new CustomError('quizCode is required', 400)

      if (deviceType !== 'host' && deviceType !== 'player')
        throw new CustomError(
          'deviceType must be either "host" or "player"',
          400
        )

      const foundRoom = Object.values(activeQuizRooms).find((room) => {
        return deviceType === 'host'
          ? room.hostRoomCode === quizCode
          : room.roomCode === quizCode
      })

      if (!foundRoom) throw new CustomError('Room not found', 404)

      if (!foundRoom.isRoomActive)
        throw new CustomError('Quiz Room not open', 400)

      res.success(
        {
          isRoomActive: foundRoom.isRoomActive,
        },
        'Quiz Room Found'
      )
    } catch (error) {
      next(error)
    }
  }
)

app.use(ErrorHandler)

realtime.connection.once('connected', () => {
  console.log('Ably Realtime connected')
  globalQuizChannel = realtime.channels.get(globalQuizChName)

  globalQuizChannel.presence.subscribe('enter', (player) => {
    createNewQuizRoom(
      player.data.roomCode,
      player.data.hostCode,
      player.data.quizId,
      player.data.eventType,
      player.clientId
    )
  })
})

const createNewQuizRoom = async (
  roomCode: string,
  hostRoomCode: string,
  quizId: string,
  eventType: string,
  hostClientId: string
) => {
  if (!isMainThread) return

  const quiz = await QuizModel.findById(quizId).lean()

  const worker = new Worker('./src/lib/quiz-room-server.js', {
    workerData: {
      roomCode,
      hostRoomCode,
      hostClientId,
      quizId,
      eventType,
      quiz: quiz || null,
    },
  })

  console.log(`CREATED NEW WORKER WITH ID ${worker.threadId}`)

  worker.on('message', (msg) => {
    if (msg.roomCode && !msg.killWorker) {
      activeQuizRooms[msg.roomCode] = {
        roomCode: msg.playerRoomCode,
        hostRoomCode: msg.hostRoomCode,
        quizId: msg.quizId,
        totalPlayers: msg.totalPlayers,
        isRoomActive: msg.isRoomActive,
      }
      totalPlayersThroughout += msg.totalPlayers
    } else if (msg.roomCode && msg.killWorker) {
      totalPlayersThroughout -= msg.totalPlayers
      delete activeQuizRooms[msg.roomCode]
    } else if (msg.roomCode) {
      activeQuizRooms[msg.roomCode].isRoomActive = msg.isRoomActive
      console.log('Room open for', msg.roomCode)
    }

    console.log(msg)
  })

  worker.on('error', (error) => {
    console.error(`Worker error [${worker.threadId}]:`, error)
  })

  worker.on('exit', (code) => {
    if (code !== 0) {
      console.error(
        `Worker [${worker.threadId}] exited with error code ${code}`
      )
    } else {
      console.log(`Worker [${worker.threadId}] exited cleanly`)
    }
  })
}
