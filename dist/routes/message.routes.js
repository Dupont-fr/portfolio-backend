import { Router } from 'express';
import { createMessageHandler } from '../controllers/message.controller.js';
export const messageRouter = Router();
messageRouter.post('/', createMessageHandler);
//# sourceMappingURL=message.routes.js.map