import type { Request, Response } from 'express'
import { createMessage } from '../repositories/message.repository.js'
import { sendContactEmail } from '../services/email.service.js'
import { messageSchema, type MessageInput } from '../validators/message.validator.js'

export async function createMessageHandler(req: Request, res: Response): Promise<void> {
  const data: MessageInput = messageSchema.parse(req.body)

  const message = await createMessage(data)

  try {
    await sendContactEmail(data)
  } catch (error) {
    console.error('[email] Échec de l’envoi Brevo:', error)
  }

  res.status(201).json({
    status: 'success',
    message: 'Message envoyé avec succès.',
    data: { id: message.id, createdAt: message.createdAt },
  })
}
