import { Router } from 'express'
import type { RequestHandler } from 'express'

interface CrudController {
  list: RequestHandler
  get: RequestHandler
  create: RequestHandler
  update: RequestHandler
  remove: RequestHandler
}

export function createCrudRoutes(controller: CrudController): Router {
  const router = Router()

  router.get('/', controller.list)
  router.get('/:id', controller.get)
  router.post('/', controller.create)
  router.patch('/:id', controller.update)
  router.delete('/:id', controller.remove)

  return router
}
