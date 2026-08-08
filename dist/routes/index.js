import { Router } from 'express';
import { healthRouter } from './health.routes.js';
import { messageRouter } from './message.routes.js';
export const apiRouter = Router();
apiRouter.use('/health', healthRouter);
apiRouter.use('/messages', messageRouter);
//# sourceMappingURL=index.js.map