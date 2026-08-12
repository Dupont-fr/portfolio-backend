# Portfolio — Backend API

API REST du portfolio : authentification admin (JWT), gestion de contenu (projets, compétences, parcours, certifications, blog), formulaire de contact (Brevo), suivi des visites et statistiques du dashboard.

Stack : **Node.js, Express 5, TypeScript, MongoDB Atlas (driver natif), Zod, JWT, Helmet, Multer**.

## Prérequis

- Node.js ≥ 20
- Un cluster **MongoDB Atlas** (ou MongoDB local)
- (Optionnel) une clé API **Brevo** pour l'envoi d'emails

## Installation

```bash
npm install
cp .env.example .env   # puis renseigner les valeurs
npm run prisma:generate
```

## Scripts

| Commande | Description |
| --- | --- |
| `npm run dev` | Démarre le serveur en mode watch (`tsx`) |
| `npm run build` | Compile TypeScript vers `dist/` |
| `npm start` | Démarre le serveur compilé |
| `npm test` | Lance les tests unitaires (Vitest) |
| `npm run typecheck` | Vérifie les types sans émettre de code |
| `npm run seed` | Crée/mets à jour le compte administrateur |
| `npm run format` | Formate le code (Prettier) |

## Variables d'environnement

| Variable | Description | Défaut |
| --- | --- | --- |
| `NODE_ENV` | `development` \| `production` | `development` |
| `PORT` | Port du serveur | `5000` |
| `DATABASE_URL` | URI de connexion MongoDB | — |
| `JWT_SECRET` | Secret de signature des JWT | — |
| `JWT_EXPIRES_IN` | Durée de validité des tokens | `7d` |
| `CORS_ORIGIN` | Origine(s) autorisées (séparées par des virgules) | `http://localhost:5173` |
| `BREVO_API_KEY` | Clé API Brevo pour l'envoi d'emails | — |
| `EMAIL_USER` | Expéditeur et destinataire des emails de contact | — |

## Compte administrateur

```bash
ADMIN_EMAIL=admin@portfolio.com ADMIN_PASSWORD='UnMotDePasseLong!1' npm run seed
```

Le mot de passe doit contenir au moins 8 caractères.

## API

Préfixe : `/api` — Exemple : `GET /api/health`

### Santé

| Méthode | Route | Description |
| --- | --- | --- |
| `GET` | `/health` | État du serveur (uptime, timestamp) |

### Publique

| Méthode | Route | Description |
| --- | --- | --- |
| `GET` | `/projects` | Projets publiés |
| `GET` | `/projects/:slug` | Détail d'un projet publié |
| `GET` | `/skills` | Compétences publiées |
| `GET` | `/educations` | Formations publiées |
| `GET` | `/experiences` | Expériences publiées |
| `GET` | `/certifications` | Certifications publiées |
| `GET` | `/blog` | Articles publiés |
| `GET` | `/blog/:slug` | Détail d'un article publié |
| `POST` | `/visits` | Enregistre une visite (path, referrer) |
| `POST` | `/messages` | Envoie un message de contact |

### Authentification

| Méthode | Route | Description |
| --- | --- | --- |
| `POST` | `/auth/login` | Connexion admin (email + mot de passe) → `{ token, user }` |
| `GET` | `/auth/me` | Profil de l'utilisateur courant (token requis) |

### Admin (JWT requis — `Authorization: Bearer <token>`)

| Méthode | Route | Description |
| --- | --- | --- |
| `GET` | `/admin/dashboard/stats` | Compteurs de chaque collection |
| `GET` | `/admin/stats/visits` | Statistiques de visites (14 jours, top pages) |
| `GET/POST` | `/admin/skills` · `/admin/educations` · `/admin/experiences` · `/admin/projects` · `/admin/blog` · `/admin/certifications` | Liste / création |
| `GET/PATCH/DELETE` | `/admin/<ressource>/:id` | Lecture / mise à jour / suppression |
| `GET` | `/admin/messages` | Messages de contact |
| `GET` | `/admin/messages/:id` | Détail d'un message |
| `PATCH` | `/admin/messages/:id/read` | Marque un message comme lu |
| `DELETE` | `/admin/messages/:id` | Supprime un message |

Chaque ressource CRUD est validée par un schéma Zod dédié (`src/validators/*`). Les listes publiques ne renvoient que les entrées publiées.

## Structure

```
src/
├── app.ts                 # Création de l'application Express (helmet, cors, json)
├── index.ts               # Point d'entrée (démarrage, vérification MongoDB)
├── config/                # Env, connexion MongoDB, client Prisma
├── controllers/           # Handlers Express
├── middlewares/           # Auth JWT, gestion d'erreurs, 404
├── repositories/          # Accès aux données MongoDB
├── routes/                # Déclaration des routes (dont générateur CRUD)
├── scripts/               # seed-admin
├── services/              # Logique métier (auth, email)
├── utils/                 # ApiError, slugify
└── validators/            # Schémas Zod
```

## Tests

```bash
npm test
```

Les tests unitaires (Vitest) couvrent les validateurs Zod et les utilitaires (`tests/`).

## Déploiement

Le backend est prêt pour **Render** (voir `render.yaml`). Variables à configurer sur la plateforme : `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN` (URL du frontend déployé), `BREVO_API_KEY`, `EMAIL_USER`.
