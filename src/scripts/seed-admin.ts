import bcrypt from 'bcryptjs'
import { ObjectId } from 'mongodb'
import { closeMongo, getDb } from '../config/mongo.js'
import { findUserByEmail } from '../repositories/auth.repository.js'

const USERS_COLLECTION = 'User'

const email = (process.env.ADMIN_EMAIL ?? 'admin@portfolio.com').toLowerCase()
const password = process.env.ADMIN_PASSWORD ?? 'ChangeMe123!'
const name = process.env.ADMIN_NAME ?? 'Dupont Djéague'

async function main(): Promise<void> {
  if (!password || password.length < 8) {
    throw new Error('Le mot de passe admin doit contenir au moins 8 caractères (ADMIN_PASSWORD).')
  }

  const existing = await findUserByEmail(email)
  if (existing) {
    console.log(`[seed] L’administrateur ${email} existe déjà — mot de passe mis à jour.`)
    const hashed = await bcrypt.hash(password, 12)
    const db = await getDb()
    await db.collection(USERS_COLLECTION).updateOne(
      { _id: new ObjectId(existing.id) },
      { $set: { password: hashed, updatedAt: new Date() } },
    )
  } else {
    const hashed = await bcrypt.hash(password, 12)
    const db = await getDb()
    await db.collection(USERS_COLLECTION).insertOne({
      email,
      password: hashed,
      name,
      role: 'ADMIN',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    console.log(`[seed] Administrateur ${email} créé.`)
  }
}

main()
  .then(() => closeMongo())
  .catch((error) => {
    console.error('[seed] Erreur :', error)
    process.exitCode = 1
  })
