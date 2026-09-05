import 'dotenv/config';
export const env = {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: Number(process.env.PORT ?? 5000),
    databaseUrl: process.env.DATABASE_URL ?? '',
    jwtSecret: process.env.JWT_SECRET ?? '',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
    corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    brevoApiKey: process.env.BREVO_API_KEY ?? '',
    emailFrom: process.env.EMAIL_USER ?? '',
    contactEmail: process.env.EMAIL_USER ?? '',
    vercelDeployHook: process.env.VERCEL_DEPLOY_HOOK_URL ?? '',
    aiApiKey: process.env.AI_API_KEY ?? '',
    cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME ?? 'ddnolovmg',
    cloudinaryUploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET ?? 'rony_hair_uploads',
};
//# sourceMappingURL=env.js.map