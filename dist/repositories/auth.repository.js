import { ObjectId } from 'mongodb';
import { getDb } from '../config/mongo.js';
const USERS_COLLECTION = 'User';
function toRecord(doc) {
    return {
        id: doc._id.toString(),
        email: doc.email,
        password: doc.password,
        name: doc.name,
        role: doc.role,
        isActive: doc.isActive ?? true,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
    };
}
export function toPublicUser(user) {
    return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
    };
}
export async function findUserByEmail(email) {
    const db = await getDb();
    const doc = await db
        .collection(USERS_COLLECTION)
        .findOne({ email: email.toLowerCase() });
    return doc ? toRecord(doc) : null;
}
export async function findUserById(id) {
    const db = await getDb();
    const doc = await db
        .collection(USERS_COLLECTION)
        .findOne({ _id: new ObjectId(id) });
    return doc ? toRecord(doc) : null;
}
export async function countUsers() {
    const db = await getDb();
    return db.collection(USERS_COLLECTION).countDocuments();
}
export async function createUser(input) {
    const db = await getDb();
    const now = new Date();
    const result = await db.collection(USERS_COLLECTION).insertOne({
        email: input.email.toLowerCase(),
        password: input.password,
        name: input.name,
        role: input.role,
        isActive: true,
        createdAt: now,
        updatedAt: now,
    });
    const doc = await db.collection(USERS_COLLECTION).findOne({ _id: result.insertedId });
    if (!doc)
        throw new Error('Création de l’utilisateur échouée');
    return toRecord(doc);
}
//# sourceMappingURL=auth.repository.js.map