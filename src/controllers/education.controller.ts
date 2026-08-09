import { createCrudRepository } from '../repositories/crud.repository.js'
import { createCrudController } from './crud.controller.js'
import { educationSchema } from '../validators/education.validator.js'

const educationRepository = createCrudRepository('Education')

export const educationsController = createCrudController({
  repository: educationRepository,
  createSchema: educationSchema,
  updateSchema: educationSchema.partial(),
  resourceKey: 'education',
  resourceLabel: 'Formation',
})
