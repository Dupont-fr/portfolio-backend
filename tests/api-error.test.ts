import { describe, expect, it } from 'vitest'
import { ApiError } from '../src/utils/ApiError.js'

describe('ApiError', () => {
  it('crée une erreur avec code et message', () => {
    const error = new ApiError(401, 'Non autorisé')
    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe('ApiError')
    expect(error.statusCode).toBe(401)
    expect(error.message).toBe('Non autorisé')
  })

  it('stocke les détails optionnels', () => {
    const details = { field: 'email' }
    const error = new ApiError(422, 'Champ invalide', details)
    expect(error.details).toBe(details)
  })

  it('laisse les détails indéfinis par défaut', () => {
    const error = new ApiError(500, 'Erreur serveur')
    expect(error.details).toBeUndefined()
  })
})
