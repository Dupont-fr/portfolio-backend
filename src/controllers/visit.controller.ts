import type { Request, Response } from 'express'
import { visitSchema } from '../validators/visit.validator.js'
import { trackVisit } from '../repositories/visitor.repository.js'

export async function trackVisitHandler(req: Request, res: Response): Promise<void> {
  const data = visitSchema.parse(req.body)

  await trackVisit({
    path: data.path,
    referrer: data.referrer ?? null,
    ip: req.ip ?? 'unknown',
    userAgent: req.get('user-agent') ?? null,
  })

  res.status(201).json({ status: 'success', message: 'Visite enregistrée.' })
}
