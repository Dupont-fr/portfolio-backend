import { describe, expect, it } from 'vitest'
import { messageSchema } from '../src/validators/message.validator.js'

const validMessage = {
  name: 'Jean Dupont',
  email: 'jean@example.com',
  subject: 'Demande de collaboration',
  message: 'Bonjour, j’aimerais discuter d’un projet ensemble.',
}

describe('messageSchema', () => {
  it('accepte un message valide', () => {
    expect(messageSchema.parse(validMessage)).toMatchObject(validMessage)
  })

  it('rejette un nom trop court', () => {
    const result = messageSchema.safeParse({ ...validMessage, name: 'J' })
    expect(result.success).toBe(false)
  })

  it('rejette un nom composé uniquement de chiffres', () => {
    const result = messageSchema.safeParse({ ...validMessage, name: '1234567' })
    expect(result.success).toBe(false)
  })

  it('accepte un nom contenant au moins une lettre', () => {
    const result = messageSchema.safeParse({ ...validMessage, name: 'Jean123' })
    expect(result.success).toBe(true)
  })

  it('rejette un email invalide', () => {
    const result = messageSchema.safeParse({ ...validMessage, email: 'jean@' })
    expect(result.success).toBe(false)
  })

  it('rejette un message trop court', () => {
    const result = messageSchema.safeParse({ ...validMessage, message: 'Bonjour' })
    expect(result.success).toBe(false)
  })

  it('rejette un message trop long', () => {
    const result = messageSchema.safeParse({ ...validMessage, message: 'x'.repeat(5001) })
    expect(result.success).toBe(false)
  })
})
