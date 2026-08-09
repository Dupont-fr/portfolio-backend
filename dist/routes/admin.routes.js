import { Router } from 'express';
import { dashboardStatsHandler, deleteMessageHandler, getMessageHandler, listMessagesHandler, markMessageReadHandler, } from '../controllers/admin.controller.js';
import { protect, requireAdmin } from '../middlewares/auth.middleware.js';
export const adminRouter = Router();
adminRouter.use(protect, requireAdmin);
adminRouter.get('/dashboard/stats', dashboardStatsHandler);
adminRouter.get('/messages', listMessagesHandler);
adminRouter.get('/messages/:id', getMessageHandler);
adminRouter.patch('/messages/:id/read', markMessageReadHandler);
adminRouter.delete('/messages/:id', deleteMessageHandler);
//# sourceMappingURL=admin.routes.js.map