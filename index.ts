import express from 'express'
import http from 'http'
import bodyParser from 'body-parser'
import compression from 'compression'
import cors from 'cors'
import router from './src/routes'
import dotenv from 'dotenv'
import ErrorHandler from './src/middlewares/errorHandler'
import successHandler from './src/middlewares/successHandler'
import { dbConnect } from './src/config/dbConect'

dotenv.config()

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

app.use(ErrorHandler)
