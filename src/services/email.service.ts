import { env } from '../config/env.js'
import type { MessageInput } from '../validators/message.validator.js'

const BREVO_URL = 'https://api.brevo.com/v3/smtp/email'

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export async function sendContactEmail(data: MessageInput): Promise<void> {
  if (!env.brevoApiKey) {
    console.warn('[email] BREVO_API_KEY manquante, email non envoyé.')
    return
  }

  const htmlContent = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#ffffff;color:#0f172a;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
      <div style="background:linear-gradient(90deg,#00c2ff,#0099ff);padding:24px 32px">
        <h1 style="margin:0;color:#050f2c;font-size:20px">Nouveau message depuis le portfolio</h1>
      </div>
      <div style="padding:32px">
        <p style="margin:0 0 20px;color:#334155;font-size:14px;line-height:1.6">
          Un visiteur vient de vous envoyer un message via le formulaire de contact.
        </p>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr>
            <td style="padding:10px 0;color:#64748b;width:110px;vertical-align:top"><strong>Nom</strong></td>
            <td style="padding:10px 0;color:#0f172a">${escapeHtml(data.name)}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;color:#64748b;vertical-align:top"><strong>Email</strong></td>
            <td style="padding:10px 0;color:#0f172a">${escapeHtml(data.email)}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;color:#64748b;vertical-align:top"><strong>Sujet</strong></td>
            <td style="padding:10px 0;color:#0f172a">${escapeHtml(data.subject)}</td>
          </tr>
        </table>
        <div style="margin-top:20px;padding:16px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0">
          <p style="margin:0;color:#334155;font-size:14px;line-height:1.7;white-space:pre-wrap">${escapeHtml(data.message)}</p>
        </div>
        <p style="margin:24px 0 0;color:#64748b;font-size:12px">
          Répondez directement à cet email pour contacter le visiteur.
        </p>
      </div>
    </div>
  `

  const response = await fetch(BREVO_URL, {
    method: 'POST',
    headers: {
      'api-key': env.brevoApiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'Portfolio Dupont Djéague', email: env.emailFrom },
      to: [{ email: env.contactEmail, name: 'Dupont Djéague' }],
      replyTo: { email: data.email, name: data.name },
      subject: `[Portfolio] Nouveau message : ${data.subject}`,
      htmlContent,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Brevo API ${response.status}: ${body}`)
  }
}
