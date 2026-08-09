import { createCrudRepository } from '../repositories/crud.repository.js'
import { createCrudController } from './crud.controller.js'
import { experienceSchema } from '../validators/experience.validator.js'

const experienceRepository = createCrudRepository('Experience')

export const experiencesController = createCrudController({
  repository: experienceRepository,
  createSchema: experienceSchema,
  updateSchema: experienceSchema.partial(),
  resourceKey: 'experience',
  resourceLabel: 'Expérience',
})
