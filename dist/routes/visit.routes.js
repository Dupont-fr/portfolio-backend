import { Router } from 'express';
import { trackVisitHandler } from '../controllers/visit.controller.js';
export const visitRouter = Router();
visitRouter.post('/', trackVisitHandler);
//# sourceMappingURL=visit.routes.js.map