import { z } from 'zod';
const optionalUrl = (label) => z.preprocess((value) => (value === '' ? null : value), z
    .string()
    .trim()
    .url(`${label} doit être une URL valide`)
    .max(500, `${label} trop longue`)
    .optional()
    .nullable());
const listOfText = (label, itemMax, maxItems) => z
    .array(z.string().trim().min(1).max(itemMax, `${label} trop long`))
    .max(maxItems, `La liste de ${label.toLowerCase()} est trop longue`)
    .optional()
    .nullable();
const publishedAt = z.preprocess((value) => (value === '' ? null : value), z
    .union([
    z.string().datetime(),
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date de publication invalide (AAAA-MM-JJ)'),
])
    .optional()
    .nullable());
export const blogSchema = z.object({
    title: z.string().trim().min(2, 'Le titre est requis').max(160, 'Titre trop long'),
    slug: z.preprocess((value) => (value === '' || value === null ? undefined : value), z
        .string()
        .trim()
        .min(2, 'Le slug est requis')
        .max(200, 'Slug trop long')
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug invalide (lettres minuscules, chiffres et tirets)')
        .optional()),
    excerpt: z.string().trim().min(10, 'L’extrait est trop court').max(300, 'Extrait trop long'),
    content: z.string().trim().min(20, 'Le contenu est trop court').max(100_000, 'Contenu trop long'),
    coverImage: optionalUrl('L’image de couverture'),
    tags: listOfText('Les tags', 60, 15),
    isPublished: z.boolean().default(false),
    publishedAt,
    order: z.number().int().min(0).default(0),
});
//# sourceMappingURL=blog.validator.js.map