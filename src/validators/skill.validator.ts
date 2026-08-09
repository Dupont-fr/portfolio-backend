import { z } from 'zod'

export const skillSchema = z.object({
  name: z.string().trim().min(2, 'Le nom doit contenir au moins 2 caractères').max(80, 'Nom trop long'),
  icon: z
    .string()
    .trim()
    .max(80, 'Icône trop longue')
    .optional()
    .nullable()
    .transform((value) => (value === '' ? null : value)),
  level: z.number().int().min(0).max(100).default(0),
  order: z.number().int().min(0).default(0),
  isPublished: z.boolean().default(true),
})

export type SkillInput = z.infer<typeof skillSchema>
