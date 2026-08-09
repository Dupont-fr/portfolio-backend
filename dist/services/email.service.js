import { env } from '../config/env.js';
const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';
function escapeHtml(value) {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}
function emailShell(content) {
    return `
    <!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      </head>
      <body style="margin:0;padding:0;background-color:#050F2C">
        <div style="background-color:#050F2C;padding:32px 16px">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
            <tr>
              <td align="center">
                <table width="100%" style="max-width:560px;background-color:#0B1740;border:1px solid rgba(255,255,255,0.08);border-radius:18px;overflow:hidden" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="height:6px;background:linear-gradient(90deg,#00C2FF 0%,#0099FF 100%)"></td>
                  </tr>
                  <tr>
                    <td style="padding:36px 32px">
                      ${content}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </div>
      </body>
    </html>
  `;
}
function brandBlock() {
    return `
    <div style="text-align:center;margin-bottom:28px">
      <div style="font-family:'Segoe UI',Arial,sans-serif;color:#6EE7FF;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase">Dupont Djeague</div>
      <div style="font-family:'Segoe UI',Arial,sans-serif;color:#8CA3D4;font-size:11px;letter-spacing:1px">Développeur Full Stack JavaScript</div>
    </div>
  `;
}
function signatureBlock() {
    return `
    <div style="text-align:center;padding-top:20px;border-top:1px solid rgba(255,255,255,0.08)">
      <div style="font-family:'Segoe UI',Arial,sans-serif;color:#FFFFFF;font-size:14px;font-weight:600">Cordialement,</div>
      <div style="font-family:'Segoe UI',Arial,sans-serif;color:#FFFFFF;font-size:14px">Dupont Djeague</div>
      <div style="font-family:'Segoe UI',Arial,sans-serif;color:#8CA3D4;font-size:12px;margin-top:6px">Ouest Cameroun · ${escapeHtml(env.emailFrom)}</div>
    </div>
  `;
}
function confirmationContent(data) {
    return `
    ${brandBlock()}

    <div style="width:64px;height:64px;border-radius:50%;margin:0 auto 24px;background:linear-gradient(135deg,#00C2FF,#0099FF);text-align:center;line-height:64px">
      <span style="color:#050F2C;font-family:Arial,sans-serif;font-size:30px;font-weight:bold">✓</span>
    </div>

    <h1 style="margin:0 0 8px;font-family:'Segoe UI',Arial,sans-serif;color:#FFFFFF;font-size:24px;font-weight:700;text-align:center">Message bien reçu !</h1>
    <p style="margin:0 0 24px;font-family:'Segoe UI',Arial,sans-serif;color:#BFC7D5;font-size:14px;line-height:1.7;text-align:center">
      Bonjour ${escapeHtml(data.name)},<br/>
      merci de m'avoir contacté. J'ai bien reçu votre message et je vous répondrai personnellement dans les plus brefs délais, généralement sous 24 heures.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background-color:#050F2C;border:1px solid rgba(255,255,255,0.08);border-radius:12px;margin-bottom:24px">
      <tr>
        <td style="padding:20px">
          <div style="font-family:'Segoe UI',Arial,sans-serif;color:#00C2FF;font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8px">Rappel de votre message</div>
          <div style="font-family:'Segoe UI',Arial,sans-serif;color:#FFFFFF;font-size:15px;font-weight:600;margin-bottom:8px">${escapeHtml(data.subject)}</div>
          <div style="font-family:'Segoe UI',Arial,sans-serif;color:#BFC7D5;font-size:14px;line-height:1.6">${escapeHtml(data.message)}</div>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 28px;font-family:'Segoe UI',Arial,sans-serif;color:#BFC7D5;font-size:14px;line-height:1.7;text-align:center">
      En attendant, n'hésitez pas à explorer mon portfolio ou à me retrouver sur les réseaux sociaux.
    </p>

    ${signatureBlock()}
  `;
}
function notificationContent(data) {
    return `
    ${brandBlock()}

    <h1 style="margin:0 0 16px;font-family:'Segoe UI',Arial,sans-serif;color:#FFFFFF;font-size:22px;font-weight:700">Nouveau message reçu</h1>
    <p style="margin:0 0 24px;font-family:'Segoe UI',Arial,sans-serif;color:#BFC7D5;font-size:14px;line-height:1.7">
      Un visiteur vient de vous envoyer un message via le formulaire de contact du portfolio.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin-bottom:24px">
      <tr>
        <td style="padding:10px 0;color:#8CA3D4;font-family:'Segoe UI',Arial,sans-serif;font-size:13px;vertical-align:top;width:110px"><strong>Nom</strong></td>
        <td style="padding:10px 0;color:#FFFFFF;font-family:'Segoe UI',Arial,sans-serif;font-size:14px">${escapeHtml(data.name)}</td>
      </tr>
      <tr>
        <td style="padding:10px 0;color:#8CA3D4;font-family:'Segoe UI',Arial,sans-serif;font-size:13px;vertical-align:top"><strong>Email</strong></td>
        <td style="padding:10px 0;color:#00C2FF;font-family:'Segoe UI',Arial,sans-serif;font-size:14px"><a href="mailto:${escapeHtml(data.email)}" style="color:#00C2FF;text-decoration:none">${escapeHtml(data.email)}</a></td>
      </tr>
      <tr>
        <td style="padding:10px 0;color:#8CA3D4;font-family:'Segoe UI',Arial,sans-serif;font-size:13px;vertical-align:top"><strong>Sujet</strong></td>
        <td style="padding:10px 0;color:#FFFFFF;font-family:'Segoe UI',Arial,sans-serif;font-size:14px">${escapeHtml(data.subject)}</td>
      </tr>
    </table>

    <div style="background-color:#050F2C;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px;margin-bottom:24px">
      <div style="font-family:'Segoe UI',Arial,sans-serif;color:#00C2FF;font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8px">Message</div>
      <div style="font-family:'Segoe UI',Arial,sans-serif;color:#BFC7D5;font-size:14px;line-height:1.7;white-space:pre-wrap">${escapeHtml(data.message)}</div>
    </div>

    <p style="margin:0 0 28px;font-family:'Segoe UI',Arial,sans-serif;color:#BFC7D5;font-size:14px;line-height:1.7">
      Répondez directement à cet email pour contacter le visiteur (adresse en rappel).
    </p>

    ${signatureBlock()}
  `;
}
async function sendBrevo(payload) {
    if (!env.brevoApiKey) {
        console.warn('[email] BREVO_API_KEY manquante, email non envoyé.');
        return;
    }
    const response = await fetch(BREVO_URL, {
        method: 'POST',
        headers: {
            'api-key': env.brevoApiKey,
            'Content-Type': 'application/json; charset=utf-8',
            Accept: 'application/json',
        },
        body: JSON.stringify({
            sender: { name: 'Dupont Djeague — Portfolio', email: env.emailFrom },
            ...payload,
        }),
    });
    if (!response.ok) {
        const body = await response.text();
        console.error(`[email] Brevo API ${response.status} : ${body}`);
        throw new Error(`Brevo API ${response.status}: ${body}`);
    }
    console.log('[email] Email envoyé avec succès ✓');
}
export async function sendContactEmail(data) {
    console.log(`[email] Envoi de l’email de notification à ${env.contactEmail}...`);
    await sendBrevo({
        to: [{ email: env.contactEmail, name: 'Dupont Djeague' }],
        replyTo: { email: data.email, name: data.name },
        subject: `[Portfolio] Nouveau message : ${data.subject}`,
        htmlContent: emailShell(notificationContent(data)),
    });
}
export async function sendConfirmationEmail(data) {
    console.log(`[email] Envoi de l’email de confirmation à ${data.email}...`);
    await sendBrevo({
        to: [{ email: data.email, name: data.name }],
        subject: `Confirmation de réception — ${data.subject}`,
        htmlContent: emailShell(confirmationContent(data)),
    });
}
//# sourceMappingURL=email.service.js.map