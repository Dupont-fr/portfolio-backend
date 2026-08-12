import type { Request, Response } from 'express'
import { getDb } from '../config/mongo.js'
import { ApiError } from '../utils/ApiError.js'
import {
  deleteMessage,
  getMessage,
  listMessages,
  markMessageRead,
  countMessages,
  countUnreadMessages,
} from '../repositories/message.repository.js'
import { getVisitStats } from '../repositories/visitor.repository.js'

const COLLECTIONS_TO_COUNT = ['Project', 'Skill', 'Experience', 'Education', 'Blog', 'Visitor'] as const

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
