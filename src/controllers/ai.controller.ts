import type { Request, Response } from 'express'
import { generateArticle, generateProject, rewriteText, suggestTags } from '../services/ai.service.js'

export async function generateArticleHandler(req: Request, res: Response): Promise<void> {
  const topic = typeof req.body.topic === 'string' ? req.body.topic.trim() : ''
  if (!topic) {
    res.status(400).json({ status: 'error', message: 'Le thème est requis.' })
    return
  }
  const result = await generateArticle({
    topic,
    tone: typeof req.body.tone === 'string' ? req.body.tone : undefined,
    language: typeof req.body.language === 'string' ? req.body.language : undefined,
  })
  res.status(200).json({ status: 'success', data: result })
}

export async function generateProjectHandler(req: Request, res: Response): Promise<void> {
  const description = typeof req.body.description === 'string' ? req.body.description.trim() : ''
  if (!description) {
    res.status(400).json({ status: 'error', message: 'La description est requise.' })
    return
  }
  const result = await generateProject(description)
  res.status(200).json({ status: 'success', data: result })
}

export async function rewriteHandler(req: Request, res: Response): Promise<void> {
  const text = typeof req.body.text === 'string' ? req.body.text.trim() : ''
  if (!text) {
    res.status(400).json({ status: 'error', message: 'Le texte à réécrire est requis.' })
    return
  }
  const result = await rewriteText({
    text,
    instructions: typeof req.body.instructions === 'string' ? req.body.instructions : undefined,
  })
  res.status(200).json({ status: 'success', data: { text: result } })
}

export async function suggestTagsHandler(req: Request, res: Response): Promise<void> {
  const content = typeof req.body.content === 'string' ? req.body.content.trim() : ''
  if (!content) {
    res.status(400).json({ status: 'error', message: 'Le contenu est requis.' })
    return
  }
  const tags = await suggestTags(content)
  res.status(200).json({ status: 'success', data: { tags } })
}