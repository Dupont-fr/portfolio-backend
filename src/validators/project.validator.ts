import { z } from 'zod'

const optionalText = (label: string, max: number) =>
  z
    .string()
    .trim()
    .max(max, `${label} trop long`)
    .optional()
    .nullable()
    .transform((value) => (value === '' ? null : value))

const optionalUrl = (label: string) =>
  z
    .string()
    .trim()
    .url(`${label} doit être une URL valide`)
    .max(500, `${label} trop longue`)
    .optional()
    .nullable()
    .transform((value) => (value === '' ? null : value))

export const projectSchema = z.object({
  title: z.string().trim().min(2, 'Le titre est requis').max(120, 'Titre trop long'),
  slug: z
    .string()
    .trim()
    .min(2, 'Le slug est requis')
    .max(160, 'Slug trop long')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug invalide (lettres minuscules, chiffres et tirets)')
    .optional(),
  description: z.string().trim().min(10, 'La description est trop courte').max(400, 'Description trop longue'),
  content: optionalText('Le contenu', 10000),
  coverImage: optionalUrl('L’image de couverture'),
  githubUrl: optionalUrl('Le lien GitHub'),
  liveUrl: optionalUrl('Le lien du site'),
  category: optionalText('La catégorie', 80),
  featured: z.boolean().default(false),
  isPublished: z.boolean().default(false),
  order: z.number().int().min(0).default(0),
})

export type ProjectInput = z.infer<typeof projectSchema>
