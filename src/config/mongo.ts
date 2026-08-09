import { MongoClient, type Db } from 'mongodb'
import { env } from './env.js'

let client: MongoClient | null = null
let dbPromise: Promise<Db> | null = null

export function getDb(): Promise<Db> {
  if (!dbPromise) {
    client = new MongoClient(env.databaseUrl, {
      serverSelectionTimeoutMS: 10_000,
    })
    dbPromise = client.connect().then(() => {
      if (!client) throw new Error('Client MongoDB non initialisé')
      return client.db()
    })
  }
  return dbPromise
}

export async function pingDatabase(): Promise<void> {
  const db = await getDb()
  await db.command({ ping: 1 })
}

export async function closeMongo(): Promise<void> {
  if (client) {
    await client.close()
    client = null
    dbPromise = null
  }
}
