import { createCrudRepository } from '../repositories/crud.repository.js'
import { createCrudController } from './crud.controller.js'
import { certificationSchema } from '../validators/certification.validator.js'

const certificationRepository = createCrudRepository('Certification')

export const certificationsController = createCrudController({
  repository: certificationRepository,
  createSchema: certificationSchema,
  updateSchema: certificationSchema.partial(),
  resourceKey: 'certification',
  resourceLabel: 'Certification',
})
