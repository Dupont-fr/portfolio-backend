import { getDb } from '../config/mongo.js';
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
const PORTFOLIO_PROFILE = {
    name: 'Dupont Djeague',
    alias: 'Dupont',
    role: 'Développeur Full Stack JavaScript (freelance)',
    tagline: 'Je conçois et développe des expériences web premium, performantes et accessibles.',
    location: 'Ouest Cameroun',
    email: 'dupontdjeague@gmail.com',
    phone: '+237 692 763 964',
    website: 'https://dupontdjeague.de5.net',
    availability: 'Disponible pour de nouvelles missions',
};
let contextCache = null;
const CONTEXT_CACHE_TTL_MS = 60_000;
async function buildPortfolioContext() {
    const now = Date.now();
    if (contextCache && now - contextCache.builtAt < CONTEXT_CACHE_TTL_MS) {
        return contextCache.value;
    }
    const db = await getDb();
    const [projects, skills, experiences, educations, certifications, blogs] = await Promise.all([
        db
            .collection('Project')
            .find({ isPublished: true })
            .sort({ order: 1, createdAt: -1 })
            .limit(20)
            .toArray(),
        db
            .collection('Skill')
            .find({ isPublished: true })
            .sort({ order: 1 })
            .limit(60)
            .toArray(),
        db
            .collection('Experience')
            .find({})
            .sort({ order: 1, startDate: -1 })
            .limit(15)
            .toArray(),
        db
            .collection('Education')
            .find({})
            .sort({ order: 1, startDate: -1 })
            .limit(8)
            .toArray(),
        db
            .collection('Certification')
            .find({ isPublished: true })
            .sort({ order: 1 })
            .limit(15)
            .toArray(),
        db
            .collection('Blog')
            .find({ isPublished: true })
            .sort({ publishedAt: -1, createdAt: -1 })
            .limit(12)
            .toArray(),
    ]);
    const lines = [];
    if (skills.length > 0) {
        const grouped = new Map();
        for (const skill of skills) {
            const category = typeof skill.category === 'string' && skill.category ? skill.category : 'Général';
            const list = grouped.get(category) ?? [];
            list.push(typeof skill.name === 'string' ? skill.name : '');
            grouped.set(category, list);
        }
        lines.push('Compétences :');
        for (const [category, names] of grouped) {
            lines.push(`- ${category} : ${names.filter(Boolean).join(', ')}`);
        }
    }
    if (projects.length > 0) {
        lines.push('Projets :');
        for (const project of projects) {
            const details = [
                `titre="${project.title}"`,
                typeof project.role === 'string' && project.role ? `rôle="${project.role}"` : '',
                typeof project.year === 'string' && project.year ? `année=${project.year}` : '',
                typeof project.category === 'string' && project.category ? `catégorie="${project.category}"` : '',
                typeof project.description === 'string' ? `description="${String(project.description).slice(0, 220)}"` : '',
                Array.isArray(project.stack) && project.stack.length > 0
                    ? `stack=${project.stack.slice(0, 12).join(', ')}`
                    : '',
                Array.isArray(project.features) && project.features.length > 0
                    ? `fonctionnalités=${project.features.slice(0, 6).join(' | ')}`
                    : '',
                Array.isArray(project.outcomes) && project.outcomes.length > 0
                    ? `résultats=${project.outcomes.slice(0, 4).join(' | ')}`
                    : '',
                typeof project.liveUrl === 'string' && project.liveUrl ? `lien=${project.liveUrl}` : '',
                typeof project.githubUrl === 'string' && project.githubUrl ? `github=${project.githubUrl}` : '',
            ]
                .filter(Boolean)
                .join(' · ');
            lines.push(`- ${details.slice(0, 800)}`);
        }
    }
    if (experiences.length > 0) {
        lines.push('Expériences professionnelles :');
        for (const experience of experiences) {
            const period = typeof experience.startDate === 'string' ? experience.startDate.slice(0, 7) : '';
            const end = experience.isCurrent
                ? 'aujourd’hui'
                : typeof experience.endDate === 'string' && experience.endDate
                    ? experience.endDate.slice(0, 7)
                    : '';
            lines.push(`- ${experience.role} chez ${experience.company} (${[period, end].filter(Boolean).join(' → ')}) — ${String(experience.description ?? '').slice(0, 220)}`);
        }
    }
    if (educations.length > 0) {
        lines.push('Formations :');
        for (const education of educations) {
            lines.push(`- ${education.degree} à ${education.school}${typeof education.field === 'string' && education.field ? ` (${education.field})` : ''}`);
        }
    }
    if (certifications.length > 0) {
        lines.push('Certifications :');
        for (const certification of certifications) {
            lines.push(`- ${certification.title} — ${certification.issuer}`);
        }
    }
    if (blogs.length > 0) {
        lines.push('Articles de blog :');
        for (const blog of blogs) {
            lines.push(`- "${blog.title}" : ${String(blog.excerpt ?? '').slice(0, 200)}`);
        }
    }
    const value = lines.join('\n').slice(0, 14_000);
    contextCache = { builtAt: now, value };
    return value;
}
export async function chatWithPortfolio(messages) {
    const context = await buildPortfolioContext();
    const profile = PORTFOLIO_PROFILE;
    const conversation = messages
        .slice(-10)
        .map((message) => `${message.role === 'user' ? 'Visiteur' : 'Dupont AI'} : ${message.content.slice(0, 500)}`)
        .join('\n');
    const prompt = `Tu es « Dupont AI », l'assistant virtuel officiel du portfolio de ${profile.name}, ${profile.role}.

PROFIL DE ${profile.name.toUpperCase()} :
- Nom : ${profile.name}
- Rôle : ${profile.role}
- Tagline : ${profile.tagline}
- Localisation : ${profile.location}
- Disponibilité : ${profile.availability}
- Email : ${profile.email}
- Téléphone / WhatsApp : ${profile.phone}
- Site web : ${profile.website}

RÈGLES STRICTES :
1. Tu réponds UNIQUEMENT à propos de ${profile.name} et de son travail (profil, compétences, projets, expériences, formations, certifications, articles, services, disponibilité, contact).
2. Pour toute question hors de ce cadre (autre sujet, recruteur de concurrents, demande hors sujet…), réponds poliment que tu es là uniquement pour parler du profil et du travail de ${profile.name}.
3. Ne parle QUE de ${profile.name} : refuse poliment de parler d'autres personnes, entreprises ou outils à sa place.
4. Base-toi UNIQUEMENT sur le contexte fourni ci-dessous. Si l'information n'y figure pas, ne l'invente JAMAIS : dis que tu ne disposes pas de cette information et propose de contacter ${profile.name} par email (${profile.email}) ou WhatsApp (${profile.phone}).
5. Tu es son assistant IA, pas ${profile.name} lui-même. Ne te fais jamais passer pour lui.
6. Ton est chaleureux, professionnel et concis. Réponds en français (sauf si le visiteur écrit dans une autre langue, alors réponds dans cette langue).
7. Utilise un markdown léger si utile (listes, gras), sans titres. Réponse généralement courte (80 à 180 mots), sauf si le visiteur demande plus de détails.

CONTEXTE DU PORTFOLIO :
${context || 'Aucune donnée disponible pour le moment.'}

HISTORIQUE DE LA CONVERSATION :
${conversation || 'Aucun historique.'}

Réponds maintenant au dernier message du visiteur.`;
    return callGemini(prompt, 0.7);
}
//# sourceMappingURL=ai.service.js.map