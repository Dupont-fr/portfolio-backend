import { Router } from 'express'
import { adminRouter } from './admin.routes.js'
import { authRouter } from './auth.routes.js'
import { healthRouter } from './health.routes.js'
import { messageRouter } from './message.routes.js'

export const apiRouter = Router()

apiRouter.use('/health', healthRouter)
apiRouter.use('/messages', messageRouter)
apiRouter.use('/auth', authRouter)
apiRouter.use('/admin', adminRouter)
