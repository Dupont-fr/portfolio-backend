import { z } from 'zod';
import { ApiError } from '../utils/ApiError.js';
export function createCrudController({ repository, createSchema, updateSchema, resourceKey, resourceLabel, transformInput, }) {
    return {
        async list(_req, res) {
            const items = await repository.list();
            res.status(200).json({ status: 'success', data: { [resourceKey]: items } });
        },
        async get(req, res) {
            const item = await repository.getById(String(req.params.id));
            if (!item)
                throw new ApiError(404, `${resourceLabel} introuvable`);
            res.status(200).json({ status: 'success', data: { [resourceKey]: item } });
        },
        async create(req, res) {
            let data = createSchema.parse(req.body);
            if (transformInput) {
                data = await transformInput(data);
            }
            const item = await repository.create(data);
            res.status(201).json({ status: 'success', data: { [resourceKey]: item } });
        },
        async update(req, res) {
            let data = updateSchema.parse(req.body);
            if (transformInput) {
                data = await transformInput(data);
            }
            const item = await repository.update(String(req.params.id), data);
            if (!item)
                throw new ApiError(404, `${resourceLabel} introuvable`);
            res.status(200).json({ status: 'success', data: { [resourceKey]: item } });
        },
        async remove(req, res) {
            const removed = await repository.remove(String(req.params.id));
            if (!removed)
                throw new ApiError(404, `${resourceLabel} introuvable`);
            res.status(200).json({ status: 'success', message: `${resourceLabel} supprimé.` });
        },
    };
}
//# sourceMappingURL=crud.controller.js.map