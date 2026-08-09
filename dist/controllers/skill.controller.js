import { createCrudRepository } from '../repositories/crud.repository.js';
import { createCrudController } from './crud.controller.js';
import { skillSchema } from '../validators/skill.validator.js';
const skillRepository = createCrudRepository('Skill');
export const skillsController = createCrudController({
    repository: skillRepository,
    createSchema: skillSchema,
    updateSchema: skillSchema.partial(),
    resourceKey: 'skill',
    resourceLabel: 'Compétence',
});
//# sourceMappingURL=skill.controller.js.map