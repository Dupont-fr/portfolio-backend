import { getDb } from '../config/mongo.js';
const VISITOR_COLLECTION = 'Visitor';
const PAGE_VIEW_COLLECTION = 'PageView';
function createFingerprint(value) {
    let hash = 5381;
    for (let index = 0; index < value.length; index++) {
        hash = ((hash << 5) + hash + value.charCodeAt(index)) >>> 0;
    }
    return hash.toString(36);
}
export async function trackVisit(data) {
    const db = await getDb();
    const now = new Date();
    const fingerprint = createFingerprint(`${data.ip}|${data.userAgent ?? ''}`);
    await db.collection(PAGE_VIEW_COLLECTION).insertOne({
        fingerprint,
        path: data.path,
        referrer: data.referrer,
        ip: data.ip,
        userAgent: data.userAgent,
        createdAt: now,
    });
    await db.collection(VISITOR_COLLECTION).updateOne({ fingerprint }, {
        $setOnInsert: { ip: data.ip, userAgent: data.userAgent, firstSeenAt: now },
        $set: { lastSeenAt: now },
        $inc: { pageViews: 1 },
    }, { upsert: true });
}
export async function getVisitStats(days = 14) {
    const db = await getDb();
    const since = new Date();
    since.setUTCHours(0, 0, 0, 0);
    since.setUTCDate(since.getUTCDate() - (days - 1));
    const [totalVisitors, totalPageViews, dailyAgg, topPagesAgg, recentDocs] = await Promise.all([
        db.collection(VISITOR_COLLECTION).countDocuments(),
        db.collection(PAGE_VIEW_COLLECTION).countDocuments(),
        db
            .collection(PAGE_VIEW_COLLECTION)
            .aggregate([
            { $match: { createdAt: { $gte: since } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ])
            .toArray(),
        db
            .collection(PAGE_VIEW_COLLECTION)
            .aggregate([
            { $group: { _id: '$path', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 8 },
        ])
            .toArray(),
        db
            .collection(PAGE_VIEW_COLLECTION)
            .find()
            .sort({ createdAt: -1 })
            .limit(10)
            .toArray(),
    ]);
    const dailyMap = new Map(dailyAgg.map((item) => [item._id, item.count]));
    const last14Days = [];
    for (let index = 0; index < days; index++) {
        const current = new Date(since);
        current.setUTCDate(since.getUTCDate() + index);
        const key = current.toISOString().slice(0, 10);
        last14Days.push({ date: key, count: dailyMap.get(key) ?? 0 });
    }
    return {
        totalVisitors,
        totalPageViews,
        last14Days,
        topPages: topPagesAgg.map((item) => ({ path: item._id, count: item.count })),
        recentVisits: recentDocs.map((doc) => ({
            id: doc._id.toString(),
            path: doc.path,
            ip: doc.ip,
            createdAt: doc.createdAt,
        })),
    };
}
//# sourceMappingURL=visitor.repository.js.map