import type { NextFunction, Request, Response } from 'express'
import { MongoNetworkError, MongoServerSelectionError } from 'mongodb'
import { PrismaClientInitializationError } from '@prisma/client/runtime/library'
import { ZodError } from 'zod'
import { ApiError } from '../utils/ApiError.js'
import { env } from '../config/env.js'

export function errorMiddleware(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof ZodError) {
    const { fieldErrors } = error.flatten()
    const readable = Object.values(fieldErrors)
      .flat()
      .join('. ')
    res.status(400).json({
      status: 'error',
      message: readable || 'Veuillez corriger les erreurs dans le formulaire.',
      details: fieldErrors,
    })
    return
  }

  if (
    error instanceof PrismaClientInitializationError ||
    error instanceof MongoServerSelectionError ||
    error instanceof MongoNetworkError
  ) {
    console.error('[db] Connexion MongoDB indisponible:', error.message)
    res.status(503).json({
      status: 'error',
      message:
        'Service indisponible : impossible de joindre la base de données. Réessayez dans un instant.',
    })
    return
  }

  if (error instanceof ApiError) {
    res.status(error.statusCode).json({
      status: 'error',
      message: error.message,
      details: error.details,
    })
    return
  }

  if (env.nodeEnv === 'development') {
    console.error(error)
  }

  res.status(500).json({
    status: 'error',
    message: 'Erreur interne du serveur',
  })
}
