import { ObjectId } from 'mongodb'
import { getDb } from '../config/mongo.js'

const USERS_COLLECTION = 'User'

export interface UserRecord {
  id: string
  email: string
  password: string
  name: string
  role: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface PublicUser {
  id: string
  email: string
  name: string
  role: string
}

interface UserDoc {
  _id: ObjectId
  email: string
  password: string
  name: string
  role: string
  isActive?: boolean
  createdAt: Date
  updatedAt: Date
}

function toRecord(doc: UserDoc): UserRecord {
  return {
    id: doc._id.toString(),
    email: doc.email,
    password: doc.password,
    name: doc.name,
    role: doc.role,
    isActive: doc.isActive ?? true,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

export function toPublicUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  }
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const db = await getDb()
  const doc = await db
    .collection<UserDoc>(USERS_COLLECTION)
    .findOne({ email: email.toLowerCase() })
  return doc ? toRecord(doc) : null
}

export async function findUserById(id: string): Promise<UserRecord | null> {
  const db = await getDb()
  const doc = await db
    .collection<UserDoc>(USERS_COLLECTION)
    .findOne({ _id: new ObjectId(id) })
  return doc ? toRecord(doc) : null
}

export async function countUsers(): Promise<number> {
  const db = await getDb()
  return db.collection<UserDoc>(USERS_COLLECTION).countDocuments()
}

export async function createUser(input: {
  email: string
  password: string
  name: string
  role: string
}): Promise<UserRecord> {
  const db = await getDb()
  const now = new Date()
  const result = await db.collection<Omit<UserDoc, '_id'>>(USERS_COLLECTION).insertOne({
    email: input.email.toLowerCase(),
    password: input.password,
    name: input.name,
    role: input.role,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  })
  const doc = await db.collection<UserDoc>(USERS_COLLECTION).findOne({ _id: result.insertedId })
  if (!doc) throw new Error('Création de l’utilisateur échouée')
  return toRecord(doc)
}
