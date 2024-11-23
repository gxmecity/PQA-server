import express, { Response, Request } from 'express'
import http from 'http'
import bodyParser from 'body-parser'
import compression from 'compression'
import cors from 'cors'
import router from './routes'
import dotenv from 'dotenv'
import ErrorHandler from './middlewares/errorHandler'
import successHandler from './middlewares/successHandler'
import { dbConnect } from './config/dbConect'
import { uniqueId } from './helpers'
import { Realtime } from 'ably'
dotenv.config()

const realtime = new Realtime({
  key: process.env.ABLY_API_KEY,
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

app.get('/realtime-auth', async (request, response) => {
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

app.use(ErrorHandler)
