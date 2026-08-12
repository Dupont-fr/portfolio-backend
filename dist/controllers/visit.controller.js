import { visitSchema } from '../validators/visit.validator.js';
import { trackVisit } from '../repositories/visitor.repository.js';
export async function trackVisitHandler(req, res) {
    const data = visitSchema.parse(req.body);
    await trackVisit({
        path: data.path,
        referrer: data.referrer ?? null,
        ip: req.ip ?? 'unknown',
        userAgent: req.get('user-agent') ?? null,
    });
    res.status(201).json({ status: 'success', message: 'Visite enregistrée.' });
}
//# sourceMappingURL=visit.controller.js.map