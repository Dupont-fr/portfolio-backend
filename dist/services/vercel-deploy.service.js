import { env } from '../config/env.js';
export async function triggerFrontendRedeploy() {
    const hookUrl = env.vercelDeployHook;
    if (!hookUrl)
        return;
    try {
        await fetch(hookUrl, { method: 'POST' });
    }
    catch (error) {
        console.warn('[vercel-deploy] Redéploiement frontend échoué :', error instanceof Error ? error.message : error);
    }
}
//# sourceMappingURL=vercel-deploy.service.js.map