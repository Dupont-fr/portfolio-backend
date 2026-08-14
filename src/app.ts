import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { env } from './config/env.js'
import { errorMiddleware } from './middlewares/error.middleware.js'
import { notFoundMiddleware } from './middlewares/not-found.middleware.js'
import { apiRouter } from './routes/index.js'

export function createApp(): express.Express {
  const app = express()

  const allowedOrigins =
    env.corsOrigin === '*'
      ? ['*']
      : env.corsOrigin
          .split(',')
          .map((origin) => origin.trim().replace(/\/+$/, ''))
          .filter(Boolean)

  app.use(helmet())
  app.use(
    cors({
      origin: allowedOrigins.includes('*') ? true : allowedOrigins,
      credentials: true,
    }),
  )
  app.use(express.json({ limit: '2mb' }))
  app.use(express.urlencoded({ extended: true }))

  app.use('/api', apiRouter)

  app.use(notFoundMiddleware)
  app.use(errorMiddleware)

  return app
}
