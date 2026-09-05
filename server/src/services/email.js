// Avisos por correo con Resend. Se pega directo a su API REST con `fetch` (Node
// trae uno propio) para no sumar una dependencia por un solo POST.
//
// Sin RESEND_API_KEY no se manda nada y no se rompe nada: quien no la cargó
// sigue viendo las filas en la base, que es como funcionaba antes de esto.
const RESEND_URL = 'https://api.resend.com/emails'

export function escaparHtml(valor) {
  return String(valor).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[c])
}

// `attachments` es para imágenes inline: [{ filename, content /* base64 */,
// contentId }], referenciadas en el html como `src="cid:<contentId>"`. Un
// correo no puede pedir un archivo del sitio como hace una página —muchos
// clientes bloquean la carga remota por default—, así que la imagen viaja
// adentro del mensaje.
export async function enviarCorreo({ to, subject, html, attachments }) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return

  // El dominio propio (conext.lat) recién manda una vez verificado en Resend;
  // hasta entonces el remitente de prueba de Resend entrega igual a cualquier
  // destinatario, así que es el default hasta que RESEND_FROM diga otra cosa.
  const from = process.env.RESEND_FROM || 'Conext <onboarding@resend.dev>'

  const r = await fetch(RESEND_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html,
      ...(attachments?.length ? { attachments } : {}),
    }),
  })

  if (!r.ok) {
    const detalle = await r.text().catch(() => '')
    throw new Error(`Resend respondió ${r.status}: ${detalle}`)
  }
}
