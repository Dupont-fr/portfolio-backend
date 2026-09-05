import { env } from '../config/env.js'
import { ApiError } from '../utils/ApiError.js'

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models'
const GEMINI_MODELS = ['gemini-3.6-flash', 'gemini-3.5-flash-lite', 'gemini-2.5-flash']
const GEMINI_TIMEOUT_MS = 90_000

export interface AiArticleInput {
  topic: string
  tone?: string
  language?: string
}

export interface AiProjectInput {
  description: string
}

export interface AiRewriteInput {
  text: string
  instructions?: string
}

async function callGemini(prompt: string, temperature = 0.8): Promise<string> {
  const apiKey = env.aiApiKey
  if (!apiKey) {
    throw new ApiError(503, 'Clé API Gemini non configurée sur le serveur (AI_API_KEY).')
  }

  let lastError: Error | null = null
  for (const model of GEMINI_MODELS) {
    try {
      const response = await fetch(`${GEMINI_BASE_URL}/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature, maxOutputTokens: 8192 },
        }),
      })

      if (!response.ok) {
        const detail = await response.text().catch(() => '')
        console.error(`[ai] Modèle ${model} : erreur ${response.status} :`, detail.slice(0, 200))
        if (response.status === 429) {
          throw new ApiError(429, 'Limite de requêtes IA atteinte. Patientez quelques secondes et réessayez.')
        }
        lastError = new Error(`Modèle ${model} indisponible (${response.status})`)
        continue
      }

      const payload = (await response.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[]
      }

      const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('')
      if (!text || !text.trim()) {
        lastError = new Error(`Modèle ${model} : réponse vide`)
        continue
      }

      return text.trim()
    } catch (error) {
      if (error instanceof ApiError) throw error
      lastError = error instanceof Error ? error : new Error('Erreur inconnue')
    }
  }

  console.error('[ai] Tous les modèles ont échoué :', lastError?.message ?? 'erreur inconnue')
  throw new ApiError(502, 'Le service d’IA est temporairement indisponible. Réessayez dans un instant.')
}

function extractJson(text: string): Record<string, unknown> {
  const cleaned = text
    .replace(/```json|```/g, '')
    .replace(/^[\s\S]*?(\{[\s\S]*\})[\s\S]*$/, '$1')
    .trim()
  try {
    const parsed = JSON.parse(cleaned) as Record<string, unknown>
    if (!parsed || typeof parsed !== 'object') throw new Error('JSON invalide')
    return parsed
  } catch {
    throw new ApiError(502, 'L\u2019IA a renvoyé une réponse que je n\u2019ai pas pu interpréter.')
  }
}

export async function generateArticle(input: AiArticleInput): Promise<Record<string, unknown>> {
  const language = input.language ?? 'français'
  const tone = input.tone ?? 'professionnel et accessible'

  const prompt = `Tu es un rédacteur web francophone expert. Rédige un article de blog complet en ${language} sur le thème suivant : « ${input.topic} ».

Tonalité demandée : ${tone}.

Règles :
- Le sujet est lié au développement web, à l'ingénierie logicielle ou au parcours d'un développeur freelance.
- Structure l'article en sections avec des titres en markdown (##).
- Rédige entre 500 et 900 mots.
- Utilise des listes (-) quand c'est pertinent et des mots en gras (**) pour les idées clés.
- Termine par une conclusion qui ouvre sur une discussion.

Réponds UNIQUEMENT avec un objet JSON valide au format suivant (sans texte autour) :
{
  "title": "un titre accrocheur",
  "excerpt": "un extrait de 2 phrases qui résume l'article",
  "content": "l'article complet en markdown",
  "tags": ["tag1", "tag2", "tag3"]
}`

  return extractJson(await callGemini(prompt))
}

export async function generateProject(description: string): Promise<Record<string, unknown>> {
  const prompt = `Tu es un expert produit et développeur. À partir de la description suivante, conçois un projet de portfolio complet : « ${description} ».

Réponds UNIQUEMENT avec un objet JSON valide (sans texte autour) :
{
  "title": "titre du projet",
  "category": "catégorie (ex: Web App, Mobile, API, Design System…)",
  "role": "rôle principal (ex: Développeur Full-Stack)",
  "year": "année (ex: 2026)",
  "description": "description courte et percutante d'une phrase",
  "longDescription": "description longue de 3 à 5 phrases, professionnelle",
  "stack": ["tech1", "tech2", "tech3"],
  "features": ["fonctionnalité 1", "fonctionnalité 2", "fonctionnalité 3"],
  "outcomes": ["résultat 1", "résultat 2"]
}`

  return extractJson(await callGemini(prompt))
}

export async function rewriteText(input: AiRewriteInput): Promise<string> {
  const instructions = input.instructions ?? 'améliore le style tout en gardant le sens'
  const prompt = `Récris le texte suivant en ${instructions}. Garde le sens, améliore la fluidité et le professionnalisme. Réponds UNIQUEMENT avec le texte réécrit (sans intro ni conclusion) :

---

${input.text}`

  return callGemini(prompt, 0.6)
}

export async function suggestTags(content: string): Promise<string[]> {
  const prompt = `À partir du contenu suivant, propose entre 4 et 6 tags pertinents (mots-clés courts, en français, sans majuscules inutiles). Réponds UNIQUEMENT avec une liste JSON, par exemple : ["tag1", "tag2", "tag3"]

---

${content.slice(0, 4000)}`

  const raw = (await callGemini(prompt, 0.5)).replace(/```json|```/g, '')
  try {
    const parsed = JSON.parse(raw) as unknown[]
    if (!Array.isArray(parsed)) throw new Error('Pas un tableau')
    return parsed.filter((item): item is string => typeof item === 'string').slice(0, 6)
  } catch {
    return raw
      .split(/[,\n]+/)
      .map((item) => item.trim().replace(/^[\s"'-]+|[\s"'-]+$/g, ''))
      .filter(Boolean)
      .slice(0, 6)
  }
}

export interface AiReplyInput {
  name: string
  originalSubject: string
  originalMessage: string
  tone?: string
}

export async function draftReply(input: AiReplyInput): Promise<string> {
  const tone = input.tone ?? 'chaleureux et professionnel'
  const prompt = `Tu es Dupont Djeague, un développeur full stack freelance. Réponds au message qu'un visiteur vient de t'envoyer via ton portfolio.

Tonité souhaitée : ${tone}.

Le visiteur : ${input.name}
Sujet du message : ${input.originalSubject}
Message reçu :
---
${input.originalMessage}
---

Règles :
- Rédige entre 80 et 220 mots, en français.
- Ne commence pas par "Bonjour ${input.name}" : commence directement le contenu de ta réponse (l'email sera structuré avec un titre "Bonjour {nom}").
- Personnalise ta réponse pour répondre précisément à ce que demande le visiteur.
- Termine par une question ouverte ou une invitation à poursuivre la conversation, puis une salutation ("Cordialement, Dupont Djeague").

Réponds UNIQUEMENT avec le corps de la réponse (sans sujet, sans "Objet :", sans signature répétée).`

  return callGemini(prompt, 0.7)
}