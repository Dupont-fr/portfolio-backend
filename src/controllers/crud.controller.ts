import type { Request, Response } from 'express'
import { z } from 'zod'
import { ApiError } from '../utils/ApiError.js'
import type { CrudRepository } from '../repositories/crud.repository.js'

interface CrudControllerOptions {
  repository: CrudRepository
  createSchema: z.ZodTypeAny
  updateSchema: z.ZodTypeAny
  resourceKey: string
  resourceLabel: string
  transformInput?: (
    data: Record<string, unknown>,
  ) => Promise<Record<string, unknown>> | Record<string, unknown>
}

export function createCrudController({
  repository,
  createSchema,
  updateSchema,
  resourceKey,
  resourceLabel,
  transformInput,
}: CrudControllerOptions) {
  return {
    async list(_req: Request, res: Response): Promise<void> {
      const items = await repository.list()
      res.status(200).json({ status: 'success', data: { [resourceKey]: items } })
    },

    async get(req: Request, res: Response): Promise<void> {
      const item = await repository.getById(String(req.params.id))
      if (!item) throw new ApiError(404, `${resourceLabel} introuvable`)
      res.status(200).json({ status: 'success', data: { [resourceKey]: item } })
    },

    async create(req: Request, res: Response): Promise<void> {
      let data = createSchema.parse(req.body) as Record<string, unknown>
      if (transformInput) {
        data = await transformInput(data)
      }
      const item = await repository.create(data)
      res.status(201).json({ status: 'success', data: { [resourceKey]: item } })
    },

    async update(req: Request, res: Response): Promise<void> {
      let data = updateSchema.parse(req.body) as Record<string, unknown>
      if (transformInput) {
        data = await transformInput(data)
      }
      const item = await repository.update(String(req.params.id), data)
      if (!item) throw new ApiError(404, `${resourceLabel} introuvable`)
      res.status(200).json({ status: 'success', data: { [resourceKey]: item } })
    },

    async remove(req: Request, res: Response): Promise<void> {
      const removed = await repository.remove(String(req.params.id))
      if (!removed) throw new ApiError(404, `${resourceLabel} introuvable`)
      res.status(200).json({ status: 'success', message: `${resourceLabel} supprimé.` })
    },
  }
}
