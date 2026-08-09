import { z } from 'zod';
export const loginSchema = z.object({
    email: z.string().trim().email('Adresse email invalide').max(160, 'Adresse email trop longue'),
    password: z.string().min(1, 'Le mot de passe est requis').max(72, 'Mot de passe trop long'),
});
//# sourceMappingURL=auth.validator.js.map