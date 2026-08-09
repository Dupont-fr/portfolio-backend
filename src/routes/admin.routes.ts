import { Router } from 'express'
import {
  dashboardStatsHandler,
  deleteMessageHandler,
  getMessageHandler,
  listMessagesHandler,
  markMessageReadHandler,
} from '../controllers/admin.controller.js'
import { skillsController } from '../controllers/skill.controller.js'
import { educationsController } from '../controllers/education.controller.js'
import { experiencesController } from '../controllers/experience.controller.js'
import { projectsController } from '../controllers/project.controller.js'
import { protect, requireAdmin } from '../middlewares/auth.middleware.js'
import { createCrudRoutes } from './crud.routes.js'

export const adminRouter = Router()

adminRouter.use(protect, requireAdmin)

adminRouter.get('/dashboard/stats', dashboardStatsHandler)

adminRouter.get('/messages', listMessagesHandler)
adminRouter.get('/messages/:id', getMessageHandler)
adminRouter.patch('/messages/:id/read', markMessageReadHandler)
adminRouter.delete('/messages/:id', deleteMessageHandler)

adminRouter.use('/skills', createCrudRoutes(skillsController))
adminRouter.use('/educations', createCrudRoutes(educationsController))
adminRouter.use('/experiences', createCrudRoutes(experiencesController))
adminRouter.use('/projects', createCrudRoutes(projectsController))
