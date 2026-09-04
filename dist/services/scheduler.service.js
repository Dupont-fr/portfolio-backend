import { getDb } from '../config/mongo.js';
import { triggerFrontendRedeploy } from './vercel-deploy.service.js';
const SCHEDULE_CHECK_INTERVAL_MS = 60_000;
export function startScheduler() {
    setInterval(() => {
        void publishScheduledItems();
    }, SCHEDULE_CHECK_INTERVAL_MS);
    console.log(`[scheduler] Publication programmée active (toutes les ${SCHEDULE_CHECK_INTERVAL_MS / 1000}s).`);
}
async function publishScheduledItems() {
    const db = await getDb();
    const now = new Date().toISOString();
    const scheduledBlogs = await db
        .collection('Blog')
        .find({ isPublished: false, scheduledAt: { $ne: null, $lte: now } })
        .toArray();
    for (const blog of scheduledBlogs) {
        await db.collection('Blog').updateOne({ _id: blog._id }, {
            $set: {
                isPublished: true,
                publishedAt: now,
                scheduledAt: null,
            },
        });
        console.log(`[scheduler] Article publié : ${blog.slug ?? blog._id.toString()}`);
    }
    if (scheduledBlogs.length > 0) {
        void triggerFrontendRedeploy();
    }
}
//# sourceMappingURL=scheduler.service.js.map