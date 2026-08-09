import { Router } from 'express';
import { loginHandler, meHandler } from '../controllers/auth.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
export const authRouter = Router();
authRouter.post('/login', loginHandler);
authRouter.get('/me', protect, meHandler);
//# sourceMappingURL=auth.routes.js.map