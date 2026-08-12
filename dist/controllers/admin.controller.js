import { getDb } from '../config/mongo.js';
import { ApiError } from '../utils/ApiError.js';
import { deleteMessage, getMessage, listMessages, markMessageRead, countMessages, countUnreadMessages, } from '../repositories/message.repository.js';
import { getVisitStats } from '../repositories/visitor.repository.js';
const COLLECTIONS_TO_COUNT = ['Project', 'Skill', 'Experience', 'Education', 'Blog', 'Visitor'];
export async function dashboardStatsHandler(_req, res) {
    const db = await getDb();
    const counts = await Promise.all(COLLECTIONS_TO_COUNT.map((collection) => db.collection(collection).countDocuments()));
    const [messages, unreadMessages, recentMessages] = await Promise.all([
        countMessages(),
        countUnreadMessages(),
        listMessages(5),
    ]);
    const collectionCounts = Object.fromEntries(COLLECTIONS_TO_COUNT.map((name, index) => [name.toLowerCase(), counts[index]]));
    res.status(200).json({
        status: 'success',
        data: {
            messages,
            unreadMessages,
            recentMessages,
            ...collectionCounts,
        },
    });
}
export async function listMessagesHandler(_req, res) {
    const messages = await listMessages();
    res.status(200).json({ status: 'success', data: { messages } });
}
export async function getMessageHandler(req, res) {
    const message = await getMessage(String(req.params.id));
    if (!message) {
        throw new ApiError(404, 'Message introuvable');
    }
    res.status(200).json({ status: 'success', data: { message } });
}
export async function markMessageReadHandler(req, res) {
    const message = await markMessageRead(String(req.params.id));
    if (!message) {
        throw new ApiError(404, 'Message introuvable');
    }
    res.status(200).json({ status: 'success', data: { message } });
}
export async function deleteMessageHandler(req, res) {
    const deleted = await deleteMessage(String(req.params.id));
    if (!deleted) {
        throw new ApiError(404, 'Message introuvable');
    }
    res.status(200).json({ status: 'success', message: 'Message supprimé.' });
}
export async function visitStatsHandler(_req, res) {
    const stats = await getVisitStats();
    res.status(200).json({ status: 'success', data: stats });
}
//# sourceMappingURL=admin.controller.js.map