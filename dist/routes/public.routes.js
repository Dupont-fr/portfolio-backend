import { Router } from 'express';
import { portfolioChatHandler } from '../controllers/ai.controller.js';
import { publicBlogsController, publicCertificationsController, publicEducationsController, publicExperiencesController, publicProjectsController, publicSkillsController, } from '../controllers/public.controller.js';
export const publicRouter = Router();
publicRouter.post('/ai/chat', portfolioChatHandler);
publicRouter.get('/projects', publicProjectsController.list);
publicRouter.get('/projects/:slug', publicProjectsController.getBySlug);
publicRouter.get('/skills', publicSkillsController.list);
publicRouter.get('/educations', publicEducationsController.list);
publicRouter.get('/experiences', publicExperiencesController.list);
publicRouter.get('/blog', publicBlogsController.list);
publicRouter.get('/blog/:slug', publicBlogsController.getBySlug);
publicRouter.get('/certifications', publicCertificationsController.list);
//# sourceMappingURL=public.routes.js.map