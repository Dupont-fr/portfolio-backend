import { getDb } from '../config/mongo.js';
import { ApiError } from '../utils/ApiError.js';
function serialize(doc) {
    const { _id, ...rest } = doc;
    return { id: _id.toString(), ...rest };
}
export function createPublicController({ collection, resourceKey, publishedOnly = false, sort = { order: 1, createdAt: -1 }, }) {
    const filter = publishedOnly ? { isPublished: true } : {};
    return {
        async list(_req, res) {
            const db = await getDb();
            const docs = await db
                .collection(collection)
                .find(filter)
                .sort(sort)
                .toArray();
            res.status(200).json({ status: 'success', data: { [resourceKey]: docs.map(serialize) } });
        },
        async getBySlug(req, res) {
            const db = await getDb();
            const doc = await db.collection(collection).findOne({ slug: String(req.params.slug), ...filter });
            if (!doc)
                throw new ApiError(404, `${resourceKey.slice(0, -1)} introuvable`);
            res.status(200).json({ status: 'success', data: { [resourceKey.slice(0, -1)]: serialize(doc) } });
        },
    };
}
export const publicProjectsController = createPublicController({
    collection: 'Project',
    resourceKey: 'projects',
    publishedOnly: true,
});
export const publicSkillsController = createPublicController({
    collection: 'Skill',
    resourceKey: 'skills',
    publishedOnly: true,
});
export const publicEducationsController = createPublicController({
    collection: 'Education',
    resourceKey: 'educations',
});
export const publicExperiencesController = createPublicController({
    collection: 'Experience',
    resourceKey: 'experiences',
});
export const publicBlogsController = createPublicController({
    collection: 'Blog',
    resourceKey: 'blogs',
    publishedOnly: true,
    sort: { publishedAt: -1, createdAt: -1 },
});
export const publicCertificationsController = createPublicController({
    collection: 'Certification',
    resourceKey: 'certifications',
    publishedOnly: true,
    sort: { issuedAt: -1, order: 1 },
});
//# sourceMappingURL=public.controller.js.map