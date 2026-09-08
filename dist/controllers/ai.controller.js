import { chatWithPortfolio, draftReply, generateArticle, generateProject, rewriteText, suggestTags, } from '../services/ai.service.js';
export async function generateArticleHandler(req, res) {
    const topic = typeof req.body.topic === 'string' ? req.body.topic.trim() : '';
    if (!topic) {
        res.status(400).json({ status: 'error', message: 'Le thème est requis.' });
        return;
    }
    const result = await generateArticle({
        topic,
        tone: typeof req.body.tone === 'string' ? req.body.tone : undefined,
        language: typeof req.body.language === 'string' ? req.body.language : undefined,
        withImages: req.body.withImages === true,
    });
    res.status(200).json({ status: 'success', data: result });
}
export async function generateProjectHandler(req, res) {
    const description = typeof req.body.description === 'string' ? req.body.description.trim() : '';
    if (!description) {
        res.status(400).json({ status: 'error', message: 'La description est requise.' });
        return;
    }
    const result = await generateProject(description);
    res.status(200).json({ status: 'success', data: result });
}
export async function rewriteHandler(req, res) {
    const text = typeof req.body.text === 'string' ? req.body.text.trim() : '';
    if (!text) {
        res.status(400).json({ status: 'error', message: 'Le texte à réécrire est requis.' });
        return;
    }
    const result = await rewriteText({
        text,
        instructions: typeof req.body.instructions === 'string' ? req.body.instructions : undefined,
    });
    res.status(200).json({ status: 'success', data: { text: result } });
}
export async function suggestTagsHandler(req, res) {
    const content = typeof req.body.content === 'string' ? req.body.content.trim() : '';
    if (!content) {
        res.status(400).json({ status: 'error', message: 'Le contenu est requis.' });
        return;
    }
    const tags = await suggestTags(content);
    res.status(200).json({ status: 'success', data: { tags } });
}
export async function draftReplyHandler(req, res) {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const originalSubject = typeof req.body.originalSubject === 'string' ? req.body.originalSubject.trim() : '';
    const originalMessage = typeof req.body.originalMessage === 'string' ? req.body.originalMessage.trim() : '';
    if (!originalMessage) {
        res.status(400).json({ status: 'error', message: 'Le message d’origine est requis.' });
        return;
    }
    if (originalMessage.length < 5) {
        res.status(400).json({ status: 'error', message: 'Le message d’origine est trop court.' });
        return;
    }
    const reply = await draftReply({
        name,
        originalSubject,
        originalMessage,
        tone: typeof req.body.tone === 'string' ? req.body.tone : undefined,
    });
    res.status(200).json({ status: 'success', data: { reply } });
}
const CHAT_RATE_WINDOW_MS = 60_000;
const CHAT_RATE_MAX_PER_WINDOW = 10;
const ipHits = new Map();
function isChatRateLimited(ip) {
    const now = Date.now();
    const windowStart = now - CHAT_RATE_WINDOW_MS;
    const hits = (ipHits.get(ip) ?? []).filter((timestamp) => timestamp >= windowStart);
    if (hits.length >= CHAT_RATE_MAX_PER_WINDOW) {
        ipHits.set(ip, hits);
        return true;
    }
    hits.push(now);
    ipHits.set(ip, hits);
    return false;
}
export async function portfolioChatHandler(req, res) {
    const ip = typeof req.ip === 'string' && req.ip ? req.ip : req.socket?.remoteAddress ?? 'unknown';
    if (isChatRateLimited(ip)) {
        res.status(429).json({
            status: 'error',
            message: 'Trop de messages envoyés. Patientez quelques secondes puis réessayez.',
        });
        return;
    }
    const rawMessages = Array.isArray(req.body.messages) ? req.body.messages : [];
    const messages = rawMessages
        .filter((raw) => raw !== null && typeof raw === 'object')
        .filter((raw) => (raw.role === 'user' || raw.role === 'assistant') &&
        typeof raw.content === 'string' &&
        raw.content.trim().length > 0)
        .map((raw) => ({
        role: raw.role === 'assistant' ? 'assistant' : 'user',
        content: String(raw.content).trim().slice(0, 500),
    }))
        .slice(-12);
    const last = messages[messages.length - 1];
    if (!last || last.role !== 'user') {
        res.status(400).json({ status: 'error', message: 'Aucune question valide à traiter.' });
        return;
    }
    const reply = await chatWithPortfolio(messages);
    res.status(200).json({ status: 'success', data: { reply } });
}
//# sourceMappingURL=ai.controller.js.map