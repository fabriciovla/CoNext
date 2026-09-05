import { SECCIONES } from '../data/secciones.js'
import { t, pathFor } from '../i18n/utils.js'
import { anclaDeTitulo } from './ancla.js'
import { ORIGEN_CANONICO } from './seo.js'

// Catálogo para modelos (GEO), en el formato de llmstxt.org / respond.io:
// H1, bajada, y cada URL pública como `- [título SEO](url): descripción`.
// El -full incrusta el cuerpo, para que no haga falta parsear el HTML.
//
// EMAIL va acá y no por config.js: este módulo lo corre un script de Node al
// generar public/llms.txt, y config.js lee import.meta.env.

const ORIGEN = ORIGEN_CANONICO
const EMAIL = 'contact@conext.lat'

function abs(lang, path) {
  const ruta = pathFor(lang, path)
  return ruta === '/' ? `${ORIGEN}/` : `${ORIGEN}${ruta}`
}

function item(titulo, href, descripcion) {
  const nota = descripcion ? `: ${descripcion}` : ''
  return `- [${titulo}](${href})${nota}`
}

function plano(texto) {
  return String(texto)
    .replace(/<[^>]+>/g, '')
    .replace(/\{(\w+)\}/g, (_, k) => k)
    .replace(/\s+/g, ' ')
    .trim()
}

function seccionCopy(lang, clave) {
  return t(lang)[clave]
}

function itemsDeArticulo(lang, path, pagina, enLaPractica) {
  const url = abs(lang, path)
  const lineas = [item(pagina.title, url, pagina.description)]
  if (pagina.bajada && pagina.bajada !== pagina.description) {
    lineas.push(item(pagina.titulo, url, pagina.intro ? `${pagina.bajada} ${pagina.intro}` : pagina.bajada))
  }
  for (const seccion of pagina.secciones ?? []) {
    lineas.push(
      item(seccion.titulo, `${url}#${anclaDeTitulo(seccion.titulo)}`, plano(seccion.parrafos.join(' '))),
    )
  }
  if (pagina.pasos?.length) {
    const href = `${url}#${anclaDeTitulo(enLaPractica)}`
    for (const paso of pagina.pasos) {
      lineas.push(item(paso.titulo, href, paso.texto))
    }
  }
  if (pagina.cierre) {
    lineas.push(item(pagina.nombre, url, pagina.cierre))
  }
  return lineas
}

function itemsDeSeccion(lang, clave) {
  const def = SECCIONES[clave]
  const copy = seccionCopy(lang, def.i18n)
  const lineas = [
    item(
      copy.indice.title,
      abs(lang, def.path),
      [copy.indice.description, copy.indice.intro].filter(Boolean).join(' '),
    ),
  ]
  if (def.columnas) {
    for (const columna of def.columnas) {
      const nombres = columna.slugs.map((slug) => copy.paginas[slug].nombre).join(', ')
      lineas.push(item(copy.columnas[columna.id], abs(lang, `${def.path}#${columna.id}`), nombres))
    }
  }
  for (const meta of def.paginas) {
    lineas.push(
      ...itemsDeArticulo(lang, `${def.path}/${meta.slug}`, copy.paginas[meta.slug], copy.enLaPractica),
    )
  }
  return lineas
}

function itemsLanding(lang) {
  const l = t(lang).landing
  const home = abs(lang, '/')
  return [
    item(l.title, home, l.description),
    item(l.heroLineas.join(' '), home, l.heroBajada),
    item(l.ahorroTitulo, abs(lang, '/#funciones'), l.ahorroTexto),
    ...l.ahorros.map((a) =>
      item(`${a.figura} — ${a.metrica}`, abs(lang, '/#funciones'), a.contexto),
    ),
    item(l.controlTitulo, abs(lang, '/#control'), l.controlTexto),
    item(l.pasosTitulo, abs(lang, '/#como-funciona'), l.pasos.map((p) => `${p.titulo}: ${p.texto}`).join(' ')),
    ...l.pasos.map((p) => item(p.titulo, abs(lang, '/#como-funciona'), p.texto)),
    item(l.garantiasTitulo, abs(lang, '/#garantias'), l.garantiasTexto),
    ...l.garantias.map((g) => item(g.titulo, abs(lang, '/#garantias'), g.texto)),
    item(l.faqTitulo, abs(lang, '/#preguntas'), l.preguntas.map((q) => q.pregunta).join(' · ')),
    ...l.preguntas.map((q) => item(q.pregunta, abs(lang, '/#preguntas'), q.respuesta)),
  ]
}

function celda(valor, lang) {
  if (valor === true) return lang === 'es' ? 'incluido' : 'included'
  if (valor === false) return lang === 'es' ? 'no' : 'no'
  return String(valor)
}

function itemsPrecios(lang) {
  const p = t(lang).precios
  const nombres = p.planes.map((plan) => plan.nombre)
  const lineas = [item(p.title, abs(lang, '/precios'), [p.description, p.nota].filter(Boolean).join(' '))]
  for (const plan of p.planes) {
    lineas.push(
      item(
        `${plan.nombre} — ${plan.precio} ${plan.periodo}`,
        abs(lang, '/precios'),
        `${plan.bajada}. ${lang === 'es' ? 'Anual' : 'Yearly'}: ${plan.precioAnual} ${plan.periodoAnual}.`,
      ),
    )
  }
  for (const grupo of p.grupos) {
    for (const fila of grupo.filas) {
      const detalle = nombres.map((n, i) => `${n}: ${celda(fila.valores[i], lang)}`).join('; ')
      lineas.push(item(`${grupo.nombre} — ${fila.nombre}`, abs(lang, '/precios'), detalle))
    }
  }
  for (const q of p.preguntas) {
    lineas.push(item(q.pregunta, abs(lang, '/precios'), q.respuesta))
  }
  return lineas
}

function itemsAyuda(lang) {
  const a = t(lang).ayuda
  const lineas = [item(a.title, abs(lang, '/ayuda'), a.description)]
  for (const tema of a.temas) {
    lineas.push(
      item(tema.nombre, abs(lang, `/ayuda#${tema.id}`), tema.preguntas.map((q) => q.pregunta).join(' · ')),
    )
    for (const q of tema.preguntas) {
      lineas.push(item(q.pregunta, abs(lang, `/ayuda#${tema.id}`), plano(q.respuesta)))
    }
  }
  return lineas
}

function itemsLegal(lang) {
  const legal = t(lang).legal
  return [
    item(legal.privacidadTitle, abs(lang, '/privacidad'), legal.privacidadDescription),
    item(legal.terminosTitle, abs(lang, '/terminos'), legal.terminosDescription),
    item(legal.eliminarTitle, abs(lang, '/eliminar-datos'), legal.eliminarDescription),
  ]
}

function itemsRecursos(lang) {
  const copy = t(lang)
  const es = lang === 'es'
  return [
    item(copy.landing.title, abs(lang, '/'), copy.landing.description),
    item(copy.producto.indice.title, abs(lang, '/producto'), copy.producto.indice.description),
    item(copy.comparar.indice.title, abs(lang, '/comparar'), copy.comparar.indice.description),
    item(copy.integraciones.indice.title, abs(lang, '/integraciones'), copy.integraciones.indice.description),
    item(copy.docs.indice.title, abs(lang, '/docs'), copy.docs.indice.description),
    item(copy.precios.title, abs(lang, '/precios'), copy.precios.description),
    item(copy.ayuda.title, abs(lang, '/ayuda'), copy.ayuda.description),
    item(
      es ? 'Contacto' : 'Contact',
      `mailto:${EMAIL}`,
      `${EMAIL}. ${es ? 'Facturación, cuentas y datos.' : 'Billing, accounts, and data.'}`,
    ),
  ]
}

function itemsOpcional(lang) {
  const es = lang === 'es'
  const indice = es ? `${ORIGEN}/llms.txt` : `${ORIGEN}/en/llms.txt`
  const full = es ? `${ORIGEN}/llms-full.txt` : `${ORIGEN}/en/llms-full.txt`
  const otroIndice = es ? `${ORIGEN}/en/llms.txt` : `${ORIGEN}/llms.txt`
  const otroFull = es ? `${ORIGEN}/en/llms-full.txt` : `${ORIGEN}/llms-full.txt`
  return [
    item(
      'llms.txt',
      indice,
      es
        ? 'Este archivo: índice de páginas públicas para modelos, formato llmstxt.org.'
        : 'This file: public-page index for language models, llmstxt.org format.',
    ),
    item(
      'llms-full.txt',
      full,
      es
        ? 'Cuerpo completo de las páginas del sitio, en Markdown, sin parsear HTML.'
        : 'Full page bodies in Markdown, so models do not have to parse HTML.',
    ),
    item(
      es ? 'llms.txt (English)' : 'llms.txt (español)',
      otroIndice,
      es ? 'The same catalog in English.' : 'El mismo catálogo en español.',
    ),
    item(
      es ? 'llms-full.txt (English)' : 'llms-full.txt (español)',
      otroFull,
      es ? 'Full English page bodies.' : 'Cuerpo completo en español.',
    ),
    item(
      'sitemap',
      `${ORIGEN}/sitemap-index.xml`,
      es ? 'Sitemap XML del sitio.' : 'XML sitemap for the site.',
    ),
    item(
      'robots.txt',
      `${ORIGEN}/robots.txt`,
      es
        ? 'Permite GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot y el resto de crawlers de modelos.'
        : 'Allows GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, and other model crawlers.',
    ),
  ]
}

function catalogo(lang) {
  const es = lang === 'es'
  return [
    es ? '## Recursos' : '## Resources',
    '',
    ...itemsRecursos(lang),
    '',
    es ? '## Producto' : '## Product',
    '',
    ...itemsLanding(lang),
    ...itemsDeSeccion(lang, 'producto'),
    '',
    es ? '## Comparativas y alternativas' : '## Comparisons and alternatives',
    '',
    ...itemsDeSeccion(lang, 'comparar'),
    '',
    es ? '## Integraciones' : '## Integrations',
    '',
    ...itemsDeSeccion(lang, 'integraciones'),
    '',
    es ? '## Documentación' : '## Documentation',
    '',
    ...itemsDeSeccion(lang, 'docs'),
    '',
    es ? '## Precios' : '## Pricing',
    '',
    ...itemsPrecios(lang),
    '',
    es ? '## Ayuda' : '## Help',
    '',
    ...itemsAyuda(lang),
    '',
    '## Legal',
    '',
    ...itemsLegal(lang),
    '',
    '## Optional',
    '',
    ...itemsOpcional(lang),
  ]
}

export function armarLlmsTxt(lang = 'es') {
  const copy = t(lang)
  const l = copy.landing
  const es = lang === 'es'
  const intro = es
    ? [
        'Conext es un CRM para pequeñas empresas. Junta WhatsApp, Instagram y Messenger en una sola bandeja. Los agentes de IA responden con el catálogo, el horario y el rol que cargó el negocio, o dejan el borrador para que una persona lo mande. Corre sobre la Cloud API oficial de Meta: el número y la Página son del cliente. No usa WhatsApp Web ni clientes no oficiales.',
        'No es un constructor de flujos de marketing (Manychat), ni un contact center de veinte canales (Respond.io), ni una herramienta de campañas masivas de WhatsApp (Wati). No responde comentarios ni menciones de historias de Instagram. No hay voz IA ni conectores a Make, Zapier o un ERP. El webhook es de Meta hacia Conext, no al revés.',
        `Host canónico: ${ORIGEN}. Contacto: ${EMAIL}. El cuerpo completo de estas páginas está en ${ORIGEN}/llms-full.txt. La misma información en inglés: ${ORIGEN}/en y ${ORIGEN}/en/llms.txt.`,
      ]
    : [
        'Conext is a CRM for small businesses. It puts WhatsApp, Instagram, and Messenger in one inbox. AI agents reply from the catalog, hours, and role the business loaded, or leave a draft for a person to send. It runs on Meta’s official Cloud API: the number and the Page belong to the customer. It does not use WhatsApp Web or unofficial clients.',
        'It is not a marketing flow builder (Manychat), not a twenty-channel contact center (Respond.io), and not a WhatsApp broadcast tool (Wati). It does not reply to Instagram comments or story mentions. There is no voice AI and no Make, Zapier, or ERP connector. The webhook is from Meta into Conext, not the other way around.',
        `Canonical host: ${ORIGEN}. Contact: ${EMAIL}. Full page bodies: ${ORIGEN}/en/llms-full.txt. The same information in Spanish: ${ORIGEN}/ and ${ORIGEN}/llms.txt.`,
      ]

  const otro = es ? 'en' : 'es'
  const puente = es
    ? [
        '## English',
        '',
        `English catalog of the same public pages. Index: ${ORIGEN}/en/llms.txt. Full text: ${ORIGEN}/en/llms-full.txt.`,
        '',
      ]
    : [
        '## Español',
        '',
        `Catálogo en español de las mismas páginas. Índice: ${ORIGEN}/llms.txt. Texto completo: ${ORIGEN}/llms-full.txt.`,
        '',
      ]

  return [
    `# ${l.title}`,
    '',
    `> ${l.description}`,
    '',
    ...intro.flatMap((p) => [p, '']),
    ...catalogo(lang),
    '',
    ...puente,
    ...catalogo(otro),
    '',
  ].join('\n')
}

function mdArticulo(pagina, url) {
  const partes = [`# ${pagina.titulo}`, '', `Fuente: ${url}`, '', pagina.bajada, '']
  if (pagina.intro) partes.push(pagina.intro, '')
  for (const seccion of pagina.secciones ?? []) {
    partes.push(`## ${seccion.titulo}`, '')
    for (const parrafo of seccion.parrafos) partes.push(parrafo, '')
  }
  if (pagina.pasos?.length) {
    partes.push('## En la práctica', '')
    pagina.pasos.forEach((paso, i) => {
      partes.push(`${i + 1}. **${paso.titulo}.** ${paso.texto}`, '')
    })
  }
  if (pagina.cierre) partes.push(pagina.cierre, '')
  return partes.join('\n')
}

function mdSeccion(lang, clave) {
  const def = SECCIONES[clave]
  const copy = seccionCopy(lang, def.i18n)
  const bloques = [
    mdArticulo(
      {
        titulo: copy.indice.titulo,
        bajada: copy.indice.bajada,
        intro: copy.indice.intro,
        secciones: [],
        pasos: [],
        cierre: '',
      },
      abs(lang, def.path),
    ),
  ]
  for (const meta of def.paginas) {
    bloques.push(mdArticulo(copy.paginas[meta.slug], abs(lang, `${def.path}/${meta.slug}`)))
  }
  return bloques.join('\n---\n\n')
}

export function armarLlmsFull(lang = 'es') {
  const copy = t(lang)
  const l = copy.landing
  const p = copy.precios
  const a = copy.ayuda
  const es = lang === 'es'

  const landing = [
    `# ${l.heroLineas.join(' ')}`,
    '',
    `Fuente: ${abs(lang, '/')}`,
    '',
    l.heroBajada,
    '',
    `## ${l.ahorroTitulo}`,
    '',
    l.ahorroTexto,
    '',
    ...l.ahorros.flatMap((x) => [`### ${x.figura} — ${x.metrica}`, '', x.contexto, '']),
    `## ${l.controlTitulo}`,
    '',
    l.controlTexto,
    '',
    `## ${l.pasosTitulo}`,
    '',
    ...l.pasos.flatMap((paso, i) => [`${i + 1}. **${paso.titulo}.** ${paso.texto}`, '']),
    `## ${l.garantiasTitulo}`,
    '',
    l.garantiasTexto,
    '',
    ...l.garantias.flatMap((g) => [`### ${g.titulo}`, '', g.texto, '']),
    `## ${l.faqTitulo}`,
    '',
    ...l.preguntas.flatMap((q) => [`### ${q.pregunta}`, '', q.respuesta, '']),
  ].join('\n')

  const precios = [
    `# ${p.titulo}`,
    '',
    `Fuente: ${abs(lang, '/precios')}`,
    '',
    p.bajada,
    '',
    p.nota,
    '',
    ...p.planes.flatMap((plan) => [
      `## ${plan.nombre}: ${plan.precio} ${plan.periodo}`,
      '',
      plan.bajada,
      '',
      `${es ? 'Anual' : 'Yearly'}: ${plan.precioAnual} ${plan.periodoAnual}`,
      '',
    ]),
    ...p.grupos.flatMap((grupo) => [
      `## ${grupo.nombre}`,
      '',
      ...grupo.filas.map(
        (fila) =>
          `- ${fila.nombre}: ${p.planes.map((plan, i) => `${plan.nombre} ${celda(fila.valores[i], lang)}`).join('; ')}`,
      ),
      '',
    ]),
    ...p.preguntas.flatMap((q) => [`### ${q.pregunta}`, '', q.respuesta, '']),
  ].join('\n')

  const ayuda = [
    `# ${a.titulo}`,
    '',
    `Fuente: ${abs(lang, '/ayuda')}`,
    '',
    a.bajada,
    '',
    ...a.temas.flatMap((tema) => [
      `## ${tema.nombre}`,
      '',
      ...tema.preguntas.flatMap((q) => [`### ${q.pregunta}`, '', plano(q.respuesta), '']),
    ]),
  ].join('\n')

  const legal = copy.legal
  const legales = [
    `# ${legal.privacidadHeading}`,
    '',
    `Fuente: ${abs(lang, '/privacidad')}`,
    '',
    legal.privacidadDescription,
    '',
    `# ${legal.terminosHeading}`,
    '',
    `Fuente: ${abs(lang, '/terminos')}`,
    '',
    legal.terminosDescription,
    '',
    `# ${legal.eliminarHeading}`,
    '',
    `Fuente: ${abs(lang, '/eliminar-datos')}`,
    '',
    legal.eliminarDescription,
    '',
  ].join('\n')

  return [
    es ? `# Conext — texto completo para modelos` : `# Conext — full text for language models`,
    '',
    es
      ? `Índice: ${ORIGEN}/llms.txt. Host: ${ORIGEN}.`
      : `Index: ${ORIGEN}/en/llms.txt. Host: ${ORIGEN}.`,
    '',
    landing,
    '',
    '---',
    '',
    mdSeccion(lang, 'producto'),
    '',
    '---',
    '',
    mdSeccion(lang, 'comparar'),
    '',
    '---',
    '',
    mdSeccion(lang, 'integraciones'),
    '',
    '---',
    '',
    mdSeccion(lang, 'docs'),
    '',
    '---',
    '',
    precios,
    '',
    '---',
    '',
    ayuda,
    '',
    '---',
    '',
    legales,
  ].join('\n')
}
