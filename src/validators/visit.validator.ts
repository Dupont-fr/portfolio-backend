import { z } from 'zod'

export const visitSchema = z.object({
  path: z.string().trim().min(1, 'Le chemin est requis').max(300, 'Chemin trop long'),
  referrer: z
    .string()
    .trim()
    .max(500, 'Référent trop long')
    .optional()
    .nullable()
    .transform((value) => (value === '' ? null : value)),
})

export type VisitInput = z.infer<typeof visitSchema>
