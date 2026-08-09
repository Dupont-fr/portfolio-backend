import { login, getCurrentUser } from '../services/auth.service.js';
import { loginSchema } from '../validators/auth.validator.js';
export async function loginHandler(req, res) {
    const data = loginSchema.parse(req.body);
    const result = await login(data);
    res.status(200).json({ status: 'success', data: result });
}
export async function meHandler(req, res) {
    if (!req.user) {
        res.status(401).json({ status: 'error', message: 'Authentification requise' });
        return;
    }
    const user = await getCurrentUser(req.user.id);
    res.status(200).json({ status: 'success', data: { user } });
}
//# sourceMappingURL=auth.controller.js.map