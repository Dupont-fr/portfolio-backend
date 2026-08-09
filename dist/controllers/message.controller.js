import { createMessage } from '../repositories/message.repository.js';
import { sendConfirmationEmail, sendContactEmail } from '../services/email.service.js';
import { messageSchema } from '../validators/message.validator.js';
export async function createMessageHandler(req, res) {
    const data = messageSchema.parse(req.body);
    console.log(`[messages] Nouveau message reçu de ${data.email} (sujet : "${data.subject}")`);
    const message = await createMessage(data);
    console.log(`[messages] Message sauvegardé en base ✓ (id : ${message.id})`);
    try {
        await sendContactEmail(data);
        console.log('[messages] Email de notification envoyé ✓');
    }
    catch (error) {
        console.error('[messages] Échec de l’envoi de l’email de notification :', error);
    }
    try {
        await sendConfirmationEmail(data);
        console.log('[messages] Email de confirmation au visiteur envoyé ✓');
    }
    catch (error) {
        console.error('[messages] Échec de l’envoi de l’email de confirmation :', error);
    }
    res.status(201).json({
        status: 'success',
        message: 'Message envoyé avec succès.',
        data: { id: message.id, createdAt: message.createdAt },
    });
}
//# sourceMappingURL=message.controller.js.map