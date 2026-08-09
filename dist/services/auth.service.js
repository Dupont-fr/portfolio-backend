import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import * as authRepository from '../repositories/auth.repository.js';
function signToken(user) {
    if (!env.jwtSecret) {
        throw new ApiError(500, 'JWT_SECRET non configuré sur le serveur');
    }
    return jwt.sign({ sub: user.id, role: user.role }, env.jwtSecret, {
        expiresIn: env.jwtExpiresIn,
    });
}
export async function login(input) {
    const user = await authRepository.findUserByEmail(input.email);
    if (!user || !user.isActive) {
        throw new ApiError(401, 'Email ou mot de passe incorrect');
    }
    const passwordMatches = await bcrypt.compare(input.password, user.password);
    if (!passwordMatches) {
        throw new ApiError(401, 'Email ou mot de passe incorrect');
    }
    return {
        token: signToken(user),
        user: authRepository.toPublicUser(user),
    };
}
export async function getCurrentUser(userId) {
    const user = await authRepository.findUserById(userId);
    if (!user || !user.isActive) {
        throw new ApiError(401, 'Session expirée ou invalide');
    }
    return authRepository.toPublicUser(user);
}
//# sourceMappingURL=auth.service.js.map