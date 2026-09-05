import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const GEMINI_MODELS = ['gemini-3.6-flash', 'gemini-3.5-flash-lite', 'gemini-2.5-flash'];
const GEMINI_IMAGE_MODELS = ['gemini-3.1-flash-image', 'gemini-3.0-flash-image', 'gemini-2.5-flash-image'];
const GEMINI_TIMEOUT_MS = 90_000;
async function callGemini(prompt, temperature = 0.8) {
    const apiKey = env.aiApiKey;
    if (!apiKey) {
        throw new ApiError(503, 'Clé API Gemini non configurée sur le serveur (AI_API_KEY).');
    }
    let lastError = null;
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
            });
            if (!response.ok) {
                const detail = await response.text().catch(() => '');
                console.error(`[ai] Modèle ${model} : erreur ${response.status} :`, detail.slice(0, 200));
                if (response.status === 429) {
                    throw new ApiError(429, 'Limite de requêtes IA atteinte. Patientez quelques secondes et réessayez.');
                }
                lastError = new Error(`Modèle ${model} indisponible (${response.status})`);
                continue;
            }
            const payload = (await response.json());
            const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('');
            if (!text || !text.trim()) {
                lastError = new Error(`Modèle ${model} : réponse vide`);
                continue;
            }
            return text.trim();
        }
        catch (error) {
            if (error instanceof ApiError)
                throw error;
            lastError = error instanceof Error ? error : new Error('Erreur inconnue');
        }
    }
    console.error('[ai] Tous les modèles ont échoué :', lastError?.message ?? 'erreur inconnue');
    throw new ApiError(502, 'Le service d’IA est temporairement indisponible. Réessayez dans un instant.');
}
function extractJson(text) {
    const cleaned = text
        .replace(/```json|```/g, '')
        .replace(/^[\s\S]*?(\{[\s\S]*\})[\s\S]*$/, '$1')
        .trim();
    try {
        const parsed = JSON.parse(cleaned);
        if (!parsed || typeof parsed !== 'object')
            throw new Error('JSON invalide');
        return parsed;
    }
    catch {
        throw new ApiError(502, 'L\u2019IA a renvoyé une réponse que je n\u2019ai pas pu interpréter.');
    }
}
async function callGeminiImage(prompt, aspectRatio = '16:9') {
    const apiKey = env.aiApiKey;
    if (!apiKey) {
        throw new ApiError(503, 'Clé API Gemini non configurée sur le serveur (AI_API_KEY).');
    }
    let lastError = null;
    for (const model of GEMINI_IMAGE_MODELS) {
        const supportsAspect = model.includes('2.5-flash');
        const attempts = supportsAspect ? [true, false] : [false];
        for (const withAspect of attempts) {
            try {
                const generationConfig = { responseModalities: ['IMAGE'] };
                if (withAspect)
                    generationConfig.aspectRatio = aspectRatio;
                const response = await fetch(`${GEMINI_BASE_URL}/${model}:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig,
                    }),
                });
                if (!response.ok) {
                    const detail = await response.text().catch(() => '');
                    console.error(`[ai-image] ${model} (aspect=${withAspect}) : ${response.status}`, detail.slice(0, 200));
                    if (response.status === 429) {
                        throw new ApiError(429, 'Quota de génération d\u2019images IA atteint (plan gratuit). Patientez ou consultez vos quotas dans AI Studio, puis réessayez.');
                    }
                    if (response.status === 400 && withAspect)
                        continue;
                    lastError = new Error(`Modèle image ${model} indisponible (${response.status})`);
                    break;
                }
                const payload = (await response.json());
                const parts = payload.candidates?.[0]?.content?.parts ?? [];
                const inline = parts.find((part) => part.inlineData?.data);
                if (inline?.inlineData?.data) {
                    return { mimeType: inline.inlineData.mimeType ?? 'image/png', data: inline.inlineData.data };
                }
                lastError = new Error(`Modèle image ${model} : réponse sans image`);
            }
            catch (error) {
                if (error instanceof ApiError)
                    throw error;
                lastError = error instanceof Error ? error : new Error('Erreur inconnue');
            }
        }
    }
    console.error('[ai-image] Tous les modèles image ont échoué :', lastError?.message ?? 'inconnue');
    throw new ApiError(502, 'La génération d\u2019image IA a échoué. Réessayez dans un instant.');
}
async function uploadImageToCloudinary(base64Data, mimeType, publicId) {
    const formData = new FormData();
    formData.append('file', `data:${mimeType};base64,${base64Data}`);
    formData.append('upload_preset', env.cloudinaryUploadPreset);
    formData.append('public_id', publicId);
    formData.append('transformation', 'c_fill,g_auto,w_1280,h_720');
    const response = await fetch(`https://api.cloudinary.com/v1_1/${env.cloudinaryCloudName}/image/upload`, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) {
        const body = await response.text().catch(() => '');
        console.error('[ai-image] Cloudinary upload:', response.status, body.slice(0, 200));
        throw new Error(`Upload Cloudinary échoué (${response.status})`);
    }
    const result = (await response.json());
    return result.secure_url ?? '';
}
export async function generateArticle(input) {
    const language = input.language ?? 'français';
    const tone = input.tone ?? 'professionnel et accessible';
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
}`;
    const article = extractJson(await callGemini(prompt));
    if (input.withImages) {
        const result = await generateArticleImages(input.topic, typeof article.content === 'string' ? article.content : '');
        if (result.coverUrl) {
            article.coverImage = result.coverUrl;
        }
        if (result.content !== null) {
            article.content = result.content;
        }
    }
    return article;
}
async function generateArticleImages(topic, content) {
    const headings = Array.from(content.matchAll(/^##\s+(.+)$/gm))
        .slice(0, 2)
        .map((match) => match[1].trim())
        .filter(Boolean);
    const slug = topic
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40);
    const timestamp = Date.now();
    const tasks = [
        {
            kind: 'cover',
            prompt: `Modern, elegant editorial illustration for the cover of a blog article titled "${topic}". Theme: web development and software craft. Deep navy blue and cyan color palette, subtle glassmorphism, professional, high quality, no readable text, widescreen 16:9 composition.`,
        },
        ...headings.map((heading) => ({
            kind: 'section',
            heading,
            prompt: `Editorial illustration for the section "${heading}" of a blog article about "${topic}". Modern tech theme, deep blue and cyan accents, clean and professional, minimal, no readable text, widescreen 16:9 composition.`,
        })),
    ];
    if (tasks.length === 0) {
        return { coverUrl: null, content: null };
    }
    const results = await Promise.allSettled(tasks.map((task, index) => (async () => {
        const image = await callGeminiImage(task.prompt);
        const url = await uploadImageToCloudinary(image.data, image.mimeType, `portfolio/ai/blog/${slug || 'article'}-${timestamp}-${index + 1}`);
        return { task, url };
    })()));
    let coverUrl = null;
    let updatedContent = content;
    results.forEach((result) => {
        if (result.status !== 'fulfilled') {
            console.warn('[ai-image] Illustration échouée :', result.reason?.message ?? result.reason);
            return;
        }
        const { task, url } = result.value;
        if (!url)
            return;
        if (task.kind === 'cover') {
            coverUrl = url;
            return;
        }
        const label = (task.heading ?? 'Illustration').replace(/["\\]/g, '');
        updatedContent = updatedContent.replace(`## ${task.heading}`, `## ${task.heading}\n\n![${label}](${url})`);
    });
    return { coverUrl, content: updatedContent === content ? null : updatedContent };
}
export async function generateProject(description) {
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
}`;
    return extractJson(await callGemini(prompt));
}
export async function rewriteText(input) {
    const instructions = input.instructions ?? 'améliore le style tout en gardant le sens';
    const prompt = `Récris le texte suivant en ${instructions}. Garde le sens, améliore la fluidité et le professionnalisme. Réponds UNIQUEMENT avec le texte réécrit (sans intro ni conclusion) :

---

${input.text}`;
    return callGemini(prompt, 0.6);
}
export async function suggestTags(content) {
    const prompt = `À partir du contenu suivant, propose entre 4 et 6 tags pertinents (mots-clés courts, en français, sans majuscules inutiles). Réponds UNIQUEMENT avec une liste JSON, par exemple : ["tag1", "tag2", "tag3"]

---

${content.slice(0, 4000)}`;
    const raw = (await callGemini(prompt, 0.5)).replace(/```json|```/g, '');
    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed))
            throw new Error('Pas un tableau');
        return parsed.filter((item) => typeof item === 'string').slice(0, 6);
    }
    catch {
        return raw
            .split(/[,\n]+/)
            .map((item) => item.trim().replace(/^[\s"'-]+|[\s"'-]+$/g, ''))
            .filter(Boolean)
            .slice(0, 6);
    }
}
export async function draftReply(input) {
    const tone = input.tone ?? 'chaleureux et professionnel';
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

Réponds UNIQUEMENT avec le corps de la réponse (sans sujet, sans "Objet :", sans signature répétée).`;
    return callGemini(prompt, 0.7);
}
//# sourceMappingURL=ai.service.js.map