import { createMessage } from '../repositories/message.repository.js';
import { sendContactEmail } from '../services/email.service.js';
import { messageSchema } from '../validators/message.validator.js';
export async function createMessageHandler(req, res) {
    const data = messageSchema.parse(req.body);
    const message = await createMessage(data);
    try {
        await sendContactEmail(data);
    }
    catch (error) {
        console.error('[email] Échec de l’envoi Brevo:', error);
    }
    res.status(201).json({
        status: 'success',
        message: 'Message envoyé avec succès.',
        data: { id: message.id, createdAt: message.createdAt },
    });
}
//# sourceMappingURL=message.controller.js.map