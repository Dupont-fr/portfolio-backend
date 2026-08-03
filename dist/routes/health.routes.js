import { Router } from 'express';
import { getHealth } from '../controllers/health.controller.js';
export const healthRouter = Router();
healthRouter.get('/', getHealth);
//# sourceMappingURL=health.routes.js.map