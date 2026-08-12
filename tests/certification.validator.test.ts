import { describe, expect, it } from 'vitest'
import { certificationSchema } from '../src/validators/certification.validator.js'

const validCertification = {
  title: 'Certification React',
  issuer: 'MO’OCK Academy',
  issuedAt: '2025-06',
}

describe('certificationSchema', () => {
  it('accepte une certification valide', () => {
    const result = certificationSchema.parse(validCertification)
    expect(result.isPublished).toBe(true)
    expect(result.order).toBe(0)
  })

  it('accepte une date réduite à l’année', () => {
    const result = certificationSchema.parse({ ...validCertification, issuedAt: '2024' })
    expect(result.issuedAt).toBe('2024')
  })

  it('rejette une date invalide', () => {
    for (const issuedAt of ['20-24', '2024/09', '2024-09-30-extra', '2024-13']) {
      const result = certificationSchema.safeParse({ ...validCertification, issuedAt })
      expect(result.success, `issuedAt "${issuedAt}"`).toBe(false)
    }
  })

  it('transforme les champs vides en null', () => {
    const result = certificationSchema.parse({
      ...validCertification,
      description: '',
      credentialId: '',
      url: '',
    })
    expect(result.description).toBeNull()
    expect(result.credentialId).toBeNull()
    expect(result.url).toBeNull()
  })

  it('rejette une URL invalide', () => {
    const result = certificationSchema.safeParse({
      ...validCertification,
      url: 'pas-une-url',
    })
    expect(result.success).toBe(false)
  })

  it('rejette un titre trop court', () => {
    const result = certificationSchema.safeParse({ ...validCertification, title: 'A' })
    expect(result.success).toBe(false)
  })
})
