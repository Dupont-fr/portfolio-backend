import type { Request, Response } from 'express'
import { ApiError } from '../utils/ApiError.js'
import { slugify } from '../utils/slugify.js'
import { createCrudRepository } from '../repositories/crud.repository.js'
import { createCrudController } from './crud.controller.js'
import { projectSchema, type ProjectInput } from '../validators/project.validator.js'

const projectRepository = createCrudRepository('Project')

async function assertSlugAvailable(slug: string, excludeId?: string): Promise<void> {
  const { getDb } = await import('../config/mongo.js')
  const db = await getDb()
  const existing = await db.collection('Project').findOne({ slug })
  if (existing && existing._id.toString() !== excludeId) {
    throw new ApiError(409, `Un projet possède déjà le slug « ${slug} »`)
  }
}

async function transformProjectInput(
  data: Record<string, unknown>,
  excludeId?: string,
): Promise<Record<string, unknown>> {
  const title = typeof data.title === 'string' ? data.title.trim() : ''
  const slug = typeof data.slug === 'string' ? data.slug.trim() : ''

  if (slug) {
    await assertSlugAvailable(slug, excludeId)
    return data
  }

  if (!title || excludeId !== undefined) {
    return data
  }

  const generatedSlug = slugify(title)
  await assertSlugAvailable(generatedSlug, excludeId)
  return { ...data, slug: generatedSlug }
}

const base = createCrudController({
  repository: projectRepository,
  createSchema: projectSchema,
  updateSchema: projectSchema.partial(),
  resourceKey: 'project',
  resourceLabel: 'Projet',
  transformInput: (data) => transformProjectInput(data),
})

export const projectsController = {
  ...base,
  async create(req: Request, res: Response): Promise<void> {
    const data = projectSchema.parse(req.body) as ProjectInput
    const resolved = await transformProjectInput(data as unknown as Record<string, unknown>)
    const project = await projectRepository.create(resolved)
    res.status(201).json({ status: 'success', data: { project } })
  },

  async update(req: Request, res: Response): Promise<void> {
    const data = projectSchema.partial().parse(req.body) as Record<string, unknown>
    const resolved = await transformProjectInput(data, String(req.params.id))
    const project = await projectRepository.update(String(req.params.id), resolved)
    if (!project) throw new ApiError(404, 'Projet introuvable')
    res.status(200).json({ status: 'success', data: { project } })
  },
}
