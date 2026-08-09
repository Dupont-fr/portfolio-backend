import { MongoClient } from 'mongodb';
import { env } from './env.js';
let client = null;
let dbPromise = null;
export function getDb() {
    if (!dbPromise) {
        client = new MongoClient(env.databaseUrl, {
            serverSelectionTimeoutMS: 10_000,
        });
        dbPromise = client.connect().then(() => {
            if (!client)
                throw new Error('Client MongoDB non initialisé');
            return client.db();
        });
    }
    return dbPromise;
}
export async function pingDatabase() {
    const db = await getDb();
    await db.command({ ping: 1 });
}
export async function closeMongo() {
    if (client) {
        await client.close();
        client = null;
        dbPromise = null;
    }
}
//# sourceMappingURL=mongo.js.map