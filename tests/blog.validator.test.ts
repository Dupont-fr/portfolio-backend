import { describe, expect, it } from 'vitest'
import { blogSchema } from '../src/validators/blog.validator.js'

const validBlog = {
  title: 'Mon premier article',
  excerpt: 'Un résumé court mais suffisant pour décrire l’article.',
  content: 'Contenu complet de l’article avec suffisamment de texte.',
}

describe('blogSchema', () => {
  it('accepte un article valide avec les valeurs par défaut', () => {
    const result = blogSchema.parse(validBlog)
    expect(result.isPublished).toBe(false)
    expect(result.order).toBe(0)
    expect(result.slug).toBeUndefined()
  })

  it('accepte un slug valide et le transforme', () => {
    const result = blogSchema.parse({ ...validBlog, slug: 'mon-premier-article' })
    expect(result.slug).toBe('mon-premier-article')
  })

  it('transforme un slug vide en undefined', () => {
    const result = blogSchema.parse({ ...validBlog, slug: '' })
    expect(result.slug).toBeUndefined()
  })

  it('rejette un slug invalide', () => {
    const result = blogSchema.safeParse({ ...validBlog, slug: 'Mon Premier' })
    expect(result.success).toBe(false)
  })

  it('accepte une date de publication AAAA-MM-JJ', () => {
    const result = blogSchema.parse({ ...validBlog, publishedAt: '2025-06-15' })
    expect(result.publishedAt).toBe('2025-06-15')
  })

  it('rejette une date de publication invalide', () => {
    const result = blogSchema.safeParse({ ...validBlog, publishedAt: '15/06/2025' })
    expect(result.success).toBe(false)
  })

  it('rejette un extrait trop court', () => {
    const result = blogSchema.safeParse({ ...validBlog, excerpt: 'court' })
    expect(result.success).toBe(false)
  })

  it('rejette un contenu trop court', () => {
    const result = blogSchema.safeParse({ ...validBlog, content: 'trop court' })
    expect(result.success).toBe(false)
  })
})
