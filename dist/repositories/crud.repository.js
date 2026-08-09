import { ObjectId } from 'mongodb';
import { getDb } from '../config/mongo.js';
function serialize(doc) {
    const { _id, ...rest } = doc;
    return { id: _id.toString(), ...rest };
}
function cleanUndefined(data) {
    const cleaned = {};
    for (const [key, value] of Object.entries(data)) {
        if (value !== undefined)
            cleaned[key] = value;
    }
    return cleaned;
}
export function createCrudRepository(collectionName) {
    return {
        async list() {
            const db = await getDb();
            const docs = await db
                .collection(collectionName)
                .find()
                .sort({ order: 1, createdAt: -1 })
                .toArray();
            return docs.map(serialize);
        },
        async getById(id) {
            let objectId;
            try {
                objectId = new ObjectId(id);
            }
            catch {
                return null;
            }
            const db = await getDb();
            const doc = await db.collection(collectionName).findOne({ _id: objectId });
            return doc ? serialize(doc) : null;
        },
        async create(data) {
            const db = await getDb();
            const now = new Date();
            const result = await db.collection(collectionName).insertOne({
                ...cleanUndefined(data),
                createdAt: now,
                updatedAt: now,
            });
            const doc = await db.collection(collectionName).findOne({ _id: result.insertedId });
            if (!doc)
                throw new Error('Création de l’enregistrement échouée');
            return serialize(doc);
        },
        async update(id, data) {
            let objectId;
            try {
                objectId = new ObjectId(id);
            }
            catch {
                return null;
            }
            const db = await getDb();
            const payload = cleanUndefined({ ...data, updatedAt: new Date() });
            const doc = await db.collection(collectionName).findOneAndUpdate({ _id: objectId }, { $set: payload }, { returnDocument: 'after' });
            return doc ? serialize(doc) : null;
        },
        async remove(id) {
            let objectId;
            try {
                objectId = new ObjectId(id);
            }
            catch {
                return false;
            }
            const db = await getDb();
            const result = await db.collection(collectionName).deleteOne({ _id: objectId });
            return result.deletedCount > 0;
        },
    };
}
//# sourceMappingURL=crud.repository.js.map