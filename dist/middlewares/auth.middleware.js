import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { findUserById } from '../repositories/auth.repository.js';
export async function protect(req, _res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
        next(new ApiError(401, 'Authentification requise'));
        return;
    }
    const token = header.slice(7);
    try {
        const payload = jwt.verify(token, env.jwtSecret);
        if (!payload.sub)
            throw new Error('Payload invalide');
        const user = await findUserById(payload.sub);
        if (!user || !user.isActive)
            throw new Error('Utilisateur introuvable');
        req.user = { id: user.id, role: user.role };
        next();
    }
    catch {
        next(new ApiError(401, 'Session expirée ou invalide'));
    }
}
export function requireAdmin(req, _res, next) {
    if (req.user?.role !== 'ADMIN') {
        next(new ApiError(403, 'Accès réservé aux administrateurs'));
        return;
    }
    next();
}
//# sourceMappingURL=auth.middleware.js.map