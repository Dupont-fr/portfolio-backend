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

const listOfText = (label: string, itemMax: number, maxItems: number) =>
  z
    .array(z.string().trim().min(1).max(itemMax, `${label} trop long`))
    .max(maxItems, `La liste de ${label.toLowerCase()} est trop longue`)
    .optional()
    .nullable()

export const projectSchema = z.object({
  title: z.string().trim().min(2, 'Le titre est requis').max(120, 'Titre trop long'),
  slug: z.preprocess(
    (value) => (value === '' || value === null ? undefined : value),
    z
      .string()
      .trim()
      .min(2, 'Le slug est requis')
      .max(160, 'Slug trop long')
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug invalide (lettres minuscules, chiffres et tirets)')
      .optional(),
  ),
  description: z.string().trim().min(10, 'La description est trop courte').max(400, 'Description trop longue'),
  longDescription: optionalText('La description longue', 10000),
  year: optionalText('L’année', 20),
  role: optionalText('Le poste', 120),
  stack: listOfText('La stack', 60, 20),
  features: listOfText('Les fonctionnalités', 200, 20),
  outcomes: listOfText('Les résultats', 200, 20),
  coverImage: optionalUrl('L’image de couverture'),
  githubUrl: optionalUrl('Le lien GitHub'),
  liveUrl: optionalUrl('Le lien du site'),
  category: optionalText('La catégorie', 80),
  featured: z.boolean().default(false),
  isPublished: z.boolean().default(false),
  order: z.number().int().min(0).default(0),
})

export type ProjectInput = z.infer<typeof projectSchema>
