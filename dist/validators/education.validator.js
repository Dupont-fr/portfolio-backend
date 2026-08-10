import { z } from 'zod';
const dateString = z
    .string()
    .trim()
    .min(4, 'Date invalide')
    .max(10, 'Date invalide')
    .regex(/^\d{4}(-\d{2}(-\d{2})?)?$/, 'Format de date invalide (ex : 2024 ou 2024-09)')
    .transform((value) => (value === '' ? null : value));
const optionalText = (label, max) => z
    .string()
    .trim()
    .max(max, `${label} trop long`)
    .optional()
    .nullable()
    .transform((value) => (value === '' ? null : value));
const listOfText = (label, itemMax, maxItems) => z
    .array(z.string().trim().min(1).max(itemMax, `${label} trop long`))
    .max(maxItems, `La liste de ${label.toLowerCase()} est trop longue`)
    .optional()
    .nullable();
export const educationSchema = z.object({
    school: z.string().trim().min(2, 'Le nom de l’école est requis').max(120, 'Nom trop long'),
    degree: z.string().trim().min(2, 'Le diplôme est requis').max(120, 'Diplôme trop long'),
    field: optionalText('Le domaine', 120),
    description: optionalText('La description', 2000),
    tags: listOfText('Les compétences', 60, 20),
    startDate: dateString,
    endDate: dateString.optional().nullable(),
    isCurrent: z.boolean().default(false),
    order: z.number().int().min(0).default(0),
});
//# sourceMappingURL=education.validator.js.map