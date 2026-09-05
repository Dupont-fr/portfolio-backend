import type { Request, Response } from 'express'
import { getDb } from '../config/mongo.js'
import { ApiError } from '../utils/ApiError.js'
import {
  deleteMessage,
  getMessage,
  listMessages,
  markMessageRead,
  markMessageReplied,
  countMessages,
  countUnreadMessages,
} from '../repositories/message.repository.js'
import { getVisitStats } from '../repositories/visitor.repository.js'
import { sendReplyEmail } from '../services/email.service.js'

const COLLECTIONS_TO_COUNT = [
  'Project',
  'Skill',
  'Experience',
  'Education',
  'Blog',
  'Certification',
  'Visitor',
] as const

export async function dashboardStatsHandler(_req: Request, res: Response): Promise<void> {  const db = await getDb()

  const counts = await Promise.all(
    COLLECTIONS_TO_COUNT.map((collection) => db.collection(collection).countDocuments()),
  )

  const [messages, unreadMessages, recentMessages] = await Promise.all([
    countMessages(),
    countUnreadMessages(),
    listMessages(5),
  ])

  const collectionCounts = Object.fromEntries(
    COLLECTIONS_TO_COUNT.map((name, index) => [name.toLowerCase(), counts[index]]),
  )

  res.status(200).json({
    status: 'success',
    data: {
      messages,
      unreadMessages,
      recentMessages,
      ...collectionCounts,
    },
  })
}

export async function listMessagesHandler(_req: Request, res: Response): Promise<void> {
  const messages = await listMessages()
  res.status(200).json({ status: 'success', data: { messages } })
}

export async function getMessageHandler(req: Request, res: Response): Promise<void> {
  const message = await getMessage(String(req.params.id))
  if (!message) {
    throw new ApiError(404, 'Message introuvable')
  }
  res.status(200).json({ status: 'success', data: { message } })
}

export async function markMessageReadHandler(req: Request, res: Response): Promise<void> {
  const message = await markMessageRead(String(req.params.id))
  if (!message) {
    throw new ApiError(404, 'Message introuvable')
  }
  res.status(200).json({ status: 'success', data: { message } })
}

export async function replyMessageHandler(req: Request, res: Response): Promise<void> {
  const reply = typeof req.body.reply === 'string' ? req.body.reply.trim() : ''
  if (!reply) {
    throw new ApiError(400, 'Le contenu de la réponse est requis.')
  }
  if (reply.length > 20_000) {
    throw new ApiError(400, 'La réponse est trop longue (max 20 000 caractères).')
  }

  const message = await getMessage(String(req.params.id))
  if (!message) {
    throw new ApiError(404, 'Message introuvable')
  }

  try {
    await sendReplyEmail({
      to: message.email,
      toName: message.name,
      originalSubject: message.subject,
      originalMessage: message.message,
      reply,
    })
  } catch (error) {
    console.error('[reply] Échec de l’envoi du mail :', error)
    throw new ApiError(502, 'L’email n’a pas pu être envoyé. Vérifiez la configuration Brevo puis réessayez.')
  }

  const updated = await markMessageReplied(String(req.params.id), reply)
  res.status(200).json({ status: 'success', data: { message: updated ?? message } })
}

export async function deleteMessageHandler(req: Request, res: Response): Promise<void> {
  const deleted = await deleteMessage(String(req.params.id))
  if (!deleted) {
    throw new ApiError(404, 'Message introuvable')
  }
  res.status(200).json({ status: 'success', message: 'Message supprimé.' })
}

export async function visitStatsHandler(_req: Request, res: Response): Promise<void> {
  const stats = await getVisitStats()
  res.status(200).json({ status: 'success', data: stats })
}
