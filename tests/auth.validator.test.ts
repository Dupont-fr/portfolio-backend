import { describe, expect, it } from 'vitest'
import { loginSchema } from '../src/validators/auth.validator.js'

describe('loginSchema', () => {
  it('accepte des identifiants valides', () => {
    const result = loginSchema.parse({
      email: 'admin@portfolio.com',
      password: 'secret',
    })
    expect(result.email).toBe('admin@portfolio.com')
    expect(result.password).toBe('secret')
  })

  it('rejette un email invalide', () => {
    const result = loginSchema.safeParse({ email: 'pas-un-email', password: 'secret' })
    expect(result.success).toBe(false)
  })

  it('rejette un mot de passe vide', () => {
    const result = loginSchema.safeParse({ email: 'admin@portfolio.com', password: '' })
    expect(result.success).toBe(false)
  })

  it('supprime les espaces autour de l’email', () => {
    const result = loginSchema.parse({
      email: '  admin@portfolio.com  ',
      password: 'secret',
    })
    expect(result.email).toBe('admin@portfolio.com')
  })
})
