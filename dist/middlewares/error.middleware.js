import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';
export function errorMiddleware(error, _req, res, _next) {
    if (error instanceof ZodError) {
        res.status(400).json({
            status: 'error',
            message: 'Validation échouée',
            details: error.flatten(),
        });
        return;
    }
    if (error instanceof ApiError) {
        res.status(error.statusCode).json({
            status: 'error',
            message: error.message,
            details: error.details,
        });
        return;
    }
    if (env.nodeEnv === 'development') {
        console.error(error);
    }
    res.status(500).json({
        status: 'error',
        message: 'Erreur interne du serveur',
    });
}
//# sourceMappingURL=error.middleware.js.map