import { z } from 'zod'

export const messageSchema = z.object({
  name: z.string().trim().min(2, 'Le nom doit contenir au moins 2 caractères').max(80, 'Le nom est trop long'),
  email: z.string().trim().email('Adresse email invalide').max(160, 'Adresse email trop longue'),
  subject: z.string().trim().min(2, 'Le sujet doit contenir au moins 2 caractères').max(150, 'Le sujet est trop long'),
  message: z
    .string()
    .trim()
    .min(10, 'Le message doit contenir au moins 10 caractères')
    .max(5000, 'Le message est trop long'),
})

export type MessageInput = z.infer<typeof messageSchema>
