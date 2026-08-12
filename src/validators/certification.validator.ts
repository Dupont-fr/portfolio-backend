import { z } from 'zod'

const dateString = z
  .string()
  .trim()
  .min(4, 'Date invalide')
  .max(10, 'Date invalide')
  .regex(/^\d{4}(-\d{2}(-\d{2})?)?$/, 'Format de date invalide (ex : 2024 ou 2024-09)')

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

export const certificationSchema = z.object({
  title: z.string().trim().min(2, 'Le titre est requis').max(160, 'Titre trop long'),
  issuer: z.string().trim().min(2, 'L’organisme est requis').max(120, 'Organisme trop long'),
  issuedAt: dateString,
  description: optionalText('La description', 2000),
  credentialId: optionalText('L’identifiant', 120),
  url: optionalUrl('Le lien de vérification'),
  tags: listOfText('Les compétences', 60, 20),
  isPublished: z.boolean().default(true),
  order: z.number().int().min(0).default(0),
})

export type CertificationInput = z.infer<typeof certificationSchema>
