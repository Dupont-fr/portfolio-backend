import type { Request, Response } from 'express'
import type { Document } from 'mongodb'
import { getDb } from '../config/mongo.js'
import { ApiError } from '../utils/ApiError.js'

function serialize(doc: Document): { id: string } & Document {
  const { _id, ...rest } = doc
  return { id: _id.toString(), ...rest } as { id: string } & Document
}

interface PublicControllerOptions {
  collection: string
  resourceKey: string
  publishedOnly?: boolean
}

export function createPublicController({ collection, resourceKey, publishedOnly = false }: PublicControllerOptions) {
  const filter = publishedOnly ? { isPublished: true } : {}

  return {
    async list(_req: Request, res: Response): Promise<void> {
      const db = await getDb()
      const docs = await db
        .collection(collection)
        .find(filter)
        .sort({ order: 1, createdAt: -1 })
        .toArray()
      res.status(200).json({ status: 'success', data: { [resourceKey]: docs.map(serialize) } })
    },

    async getBySlug(req: Request, res: Response): Promise<void> {
      const db = await getDb()
      const doc = await db.collection(collection).findOne({ slug: String(req.params.slug), ...filter })
      if (!doc) throw new ApiError(404, `${resourceKey.slice(0, -1)} introuvable`)
      res.status(200).json({ status: 'success', data: { [resourceKey.slice(0, -1)]: serialize(doc) } })
    },
  }
}

export const publicProjectsController = createPublicController({
  collection: 'Project',
  resourceKey: 'projects',
  publishedOnly: true,
})

export const publicSkillsController = createPublicController({
  collection: 'Skill',
  resourceKey: 'skills',
  publishedOnly: true,
})

export const publicEducationsController = createPublicController({
  collection: 'Education',
  resourceKey: 'educations',
})

export const publicExperiencesController = createPublicController({
  collection: 'Experience',
  resourceKey: 'experiences',
})
