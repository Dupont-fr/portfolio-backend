import type { Request, Response } from 'express'
import { ApiError } from '../utils/ApiError.js'
import { slugify } from '../utils/slugify.js'
import { createCrudRepository } from '../repositories/crud.repository.js'
import { createCrudController } from './crud.controller.js'
import { blogSchema, type BlogInput } from '../validators/blog.validator.js'

const blogRepository = createCrudRepository('Blog')

async function assertSlugAvailable(slug: string, excludeId?: string): Promise<void> {
  const { getDb } = await import('../config/mongo.js')
  const db = await getDb()
  const existing = await db.collection('Blog').findOne({ slug })
  if (existing && existing._id.toString() !== excludeId) {
    throw new ApiError(409, `Un article possède déjà le slug « ${slug} »`)
  }
}

function resolvePublishedAt(data: Record<string, unknown>): Record<string, unknown> {
  const published = data.isPublished === true
  const hasDate = data.publishedAt !== null && data.publishedAt !== undefined && data.publishedAt !== ''
  if (published && !hasDate) {
    return { ...data, publishedAt: new Date().toISOString() }
  }
  if (!published && !hasDate) {
    return data
  }
  return data
}

async function transformBlogInput(
  data: Record<string, unknown>,
  excludeId?: string,
): Promise<Record<string, unknown>> {
  const title = typeof data.title === 'string' ? data.title.trim() : ''
  const slug = typeof data.slug === 'string' ? data.slug.trim() : ''

  let resolved = resolvePublishedAt(data)

  if (slug) {
    await assertSlugAvailable(slug, excludeId)
    return resolved
  }

  if (!title || excludeId !== undefined) {
    return resolved
  }

  const generatedSlug = slugify(title)
  await assertSlugAvailable(generatedSlug, excludeId)
  return { ...resolved, slug: generatedSlug }
}

export const blogsController = {
  ...createCrudController({
    repository: blogRepository,
    createSchema: blogSchema,
    updateSchema: blogSchema.partial(),
    resourceKey: 'blog',
    resourceLabel: 'Article',
  }),

  async create(req: Request, res: Response): Promise<void> {
    const data = blogSchema.parse(req.body) as BlogInput
    const resolved = await transformBlogInput(data as unknown as Record<string, unknown>)
    const blog = await blogRepository.create(resolved)
    res.status(201).json({ status: 'success', data: { blog } })
  },

  async update(req: Request, res: Response): Promise<void> {
    const data = blogSchema.partial().parse(req.body) as Record<string, unknown>
    const resolved = await transformBlogInput(data, String(req.params.id))
    const blog = await blogRepository.update(String(req.params.id), resolved)
    if (!blog) throw new ApiError(404, 'Article introuvable')
    res.status(200).json({ status: 'success', data: { blog } })
  },
}
