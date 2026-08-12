import { describe, expect, it } from 'vitest'
import { slugify } from '../src/utils/slugify.js'

describe('slugify', () => {
  it('transforme un texte en slug minuscule', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })

  it('retire les accents', () => {
    expect(slugify('Développeur JavaScript')).toBe('developpeur-javascript')
  })

  it('remplace les espaces et caractères spéciaux par des tirets', () => {
    expect(slugify('Les   vacances & le code!')).toBe('les-vacances-le-code')
  })

  it('retire les tirets en début et fin', () => {
    expect(slugify('  --titre-- ')).toBe('titre')
  })

  it('limite la longueur à 160 caractères', () => {
    expect(slugify('a'.repeat(200))).toHaveLength(160)
  })

  it('gère une valeur vide', () => {
    expect(slugify('')).toBe('')
  })
})
