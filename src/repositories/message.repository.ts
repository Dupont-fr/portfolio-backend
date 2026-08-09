import { getDb } from '../config/mongo.js'
import type { MessageInput } from '../validators/message.validator.js'

const MESSAGES_COLLECTION = 'Message'

export async function createMessage(data: MessageInput) {
  const db = await getDb()
  const now = new Date()

  const result = await db.collection(MESSAGES_COLLECTION).insertOne({
    name: data.name,
    email: data.email,
    subject: data.subject,
    message: data.message,
    isRead: false,
    createdAt: now,
    updatedAt: now,
  })

  return { id: result.insertedId.toString(), createdAt: now }
}
