import { createApp } from './app.js'
import { env } from './config/env.js'
import { pingDatabase } from './config/mongo.js'

const app = createApp()

app.listen(env.port, () => {
  console.log(`[api] listening on http://localhost:${env.port} (${env.nodeEnv})`)
  void checkDatabase()
  logConfig()
})

async function checkDatabase() {
  try {
    await pingDatabase()
    console.log('[db] MongoDB Atlas connecté ✓')
  } catch (error) {
    console.error(
      '[db] Échec de connexion à MongoDB Atlas :',
      error instanceof Error ? error.message : error,
    )
  }
}

function logConfig() {
  console.log(`[config] CORS: ${env.corsOrigin}`)
  if (env.brevoApiKey) {
    console.log('[config] Brevo prêt ✓ (clé API configurée)')
  } else {
    console.warn('[config] BREVO_API_KEY manquante — les emails ne seront pas envoyés')
  }
}
