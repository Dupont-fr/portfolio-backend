import { ObjectId } from 'mongodb'
import { getDb } from '../config/mongo.js'
import type { MessageInput } from '../validators/message.validator.js'

const MESSAGES_COLLECTION = 'Message'

export interface MessageRecord {
  id: string
  name: string
  email: string
  subject: string
  message: string
  isRead: boolean
  createdAt: Date
}

interface MessageDoc {
  _id: ObjectId
  name: string
  email: string
  subject: string
  message: string
  isRead?: boolean
  createdAt: Date
  updatedAt?: Date
}

function toRecord(doc: MessageDoc): MessageRecord {
  return {
    id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    subject: doc.subject,
    message: doc.message,
    isRead: doc.isRead ?? false,
    createdAt: doc.createdAt,
  }
}

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

export async function listMessages(limit = 100): Promise<MessageRecord[]> {
  const db = await getDb()
  const docs = await db
    .collection<MessageDoc>(MESSAGES_COLLECTION)
    .find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray()
  return docs.map(toRecord)
}

export async function getMessage(id: string): Promise<MessageRecord | null> {
  let objectId: ObjectId
  try {
    objectId = new ObjectId(id)
  } catch {
    return null
  }
  const db = await getDb()
  const doc = await db.collection<MessageDoc>(MESSAGES_COLLECTION).findOne({ _id: objectId })
  return doc ? toRecord(doc) : null
}

export async function markMessageRead(id: string): Promise<MessageRecord | null> {
  let objectId: ObjectId
  try {
    objectId = new ObjectId(id)
  } catch {
    return null
  }
  const db = await getDb()
  const doc = await db.collection<MessageDoc>(MESSAGES_COLLECTION).findOneAndUpdate(
    { _id: objectId },
    { $set: { isRead: true } },
    { returnDocument: 'after' },
  )
  return doc ? toRecord(doc) : null
}

export async function deleteMessage(id: string): Promise<boolean> {
  let objectId: ObjectId
  try {
    objectId = new ObjectId(id)
  } catch {
    return false
  }
  const db = await getDb()
  const result = await db.collection(MESSAGES_COLLECTION).deleteOne({ _id: objectId })
  return result.deletedCount > 0
}

export async function countMessages(): Promise<number> {
  const db = await getDb()
  return db.collection(MESSAGES_COLLECTION).countDocuments()
}

export async function countUnreadMessages(): Promise<number> {
  const db = await getDb()
  return db.collection(MESSAGES_COLLECTION).countDocuments({ isRead: false })
}
