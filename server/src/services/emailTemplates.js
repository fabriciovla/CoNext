import { escaparHtml } from './email.js'

// Plantillas de correo. Van en tablas y estilos en línea a propósito: un
// cliente de correo no es un navegador (Outlook de escritorio renderiza con el
// motor de Word), así que nada de flexbox/grid ni CSS externo — lo único que
// llega entero a todos lados es esto.
//
// La imagen viaja como adjunto inline (`cid:`) y no como URL del sitio: varios
// clientes bloquean por default la carga de imágenes remotas, y un correo
// mostrando un cuadrado roto en vez del fantasma no es el saludo que se busca.

export const MASCOTA_CID = 'mascota-postulate'

// El idioma es el de la página desde la que se postuló (/postulate o
// /en/postulate), no una traducción automática: la persona ya leyó el form en
// ese idioma, así que el agradecimiento sigue en el mismo. Un idioma que no
// esté acá cae en español.
const TEXTOS = {
  es: {
    asunto: '¡Gracias por postularte a conext!',
    titulo: (nombre) => `¡Gracias por postularte, ${nombre}!`,
    cuerpo:
      'Recibimos tu postulación para sumarte al equipo de conext. En los próximos días te vamos a estar escribiendo para contarte cómo seguimos.',
    firma: 'El equipo de',
  },
  en: {
    asunto: 'Thanks for applying to conext!',
    titulo: (nombre) => `Thanks for applying, ${nombre}!`,
    cuerpo:
      "We got your application to join the conext team. We'll be in touch in the next few days to let you know how things go.",
    firma: 'The',
  },
}

export function asuntoPostulacionRecibida(idioma) {
  return (TEXTOS[idioma] ?? TEXTOS.es).asunto
}

export function postulacionRecibidaHtml({ nombre, idioma }) {
  const t = TEXTOS[idioma] ?? TEXTOS.es
  const primerNombre = escaparHtml(String(nombre).trim().split(/\s+/)[0])

  return `<!doctype html>
<html>
  <body style="margin:0;padding:32px 16px;background:#F7F2E8;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;">
      <tr>
        <td style="background:#ffffff;border-radius:20px;padding:40px 32px;text-align:center;">
          <img
            src="cid:${MASCOTA_CID}"
            width="88"
            height="88"
            alt=""
            style="display:block;margin:0 auto 20px;border-radius:50%;"
          />
          <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#18181b;font-weight:700;">
            ${t.titulo(primerNombre)}
          </h1>
          <p style="margin:0;font-size:15px;line-height:1.6;color:#52525b;">
            ${t.cuerpo}
          </p>
          <div style="margin:28px 0 0;height:1px;background:#eee;"></div>
          <p style="margin:20px 0 0;font-size:13px;color:#a1a1aa;">
            ${t.firma} <strong style="color:#4058ff;">conext</strong>
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`
}
