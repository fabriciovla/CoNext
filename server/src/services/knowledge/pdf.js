import zlib from 'node:zlib'

// Sacarle el texto a un PDF, sin dependencias.
//
// Existe porque casi todo lo que un negocio tiene escrito de sí mismo —la lista
// de precios, la política de cambios, el instructivo de garantía— está en un
// PDF, y pedirle a alguien que lo copie y lo pegue a mano es pedirle que no
// entrene al agente.
//
// No es un lector de PDF: no dibuja, no mide, no le importan las posiciones.
// Hace lo mínimo que hace falta para que salga texto de verdad, que resultó ser
// más que buscar paréntesis:
//
//   1. Indexa los objetos del archivo (incluidos los que viven adentro de un
//      /ObjStm, que es donde los mete cualquier PDF de 1.5 para arriba).
//   2. Por cada página, junta sus streams de contenido y sus fuentes.
//   3. Decodifica las cadenas con el /ToUnicode de la fuente que esté activa.
//
// El paso 3 es el que importa. Un PDF exportado de Google Docs o de Word usa
// fuentes CID con /Encoding /Identity-H: adentro del contenido las cadenas no
// son letras sino números de glifo de dos bytes, así que leerlas crudas —que es
// lo que hace cualquier "extractor" de diez líneas— devuelve símbolos. El mapa
// para volver a Unicode está en el propio archivo, en el stream /ToUnicode de
// cada fuente, y sin usarlo el 90% de los PDF de oficina salen ilegibles.
//
// Sigue siendo BEST EFFORT y está asumido: de un PDF escaneado (que es una foto)
// no hay texto que sacar. Por eso esto devuelve null en vez de devolver basura
// —`pareceTexto` mira lo que salió— y la pantalla puede decir "no pudimos
// leerlo, pegá el texto" en vez de entrenar a un agente con un bloque de glifos.

// ---------------------------------------------------------------- utilidades

// Todo el parseo trabaja sobre latin1: un byte, un carácter. Es lo que permite
// mezclar en el mismo string el diccionario (texto) y el stream (binario) sin
// que los índices se corran, que es justo lo que pasaría con utf8.
function aTexto(buffer) {
  return buffer.toString('latin1')
}

function inflar(cuerpo) {
  try {
    return zlib.inflateSync(cuerpo)
  } catch {
    // Un stream truncado (los hay) revienta el inflate estricto pero deja leer
    // todo lo que alcanzó a escribir.
    try {
      return zlib.inflateSync(cuerpo, { finishFlush: zlib.constants.Z_SYNC_FLUSH })
    } catch {
      return null
    }
  }
}

// El `<< … >>` que empieza en `desde`, con los anidados adentro. Se cuenta a
// mano porque un diccionario de recursos tiene diccionarios adentro y cortar en
// el primer `>>` deja afuera justamente las fuentes.
function leerDiccionario(s, desde) {
  let nivel = 0
  let i = desde
  while (i < s.length) {
    if (s[i] === '<' && s[i + 1] === '<') {
      nivel += 1
      i += 2
      continue
    }
    if (s[i] === '>' && s[i + 1] === '>') {
      nivel -= 1
      i += 2
      if (nivel === 0) return s.slice(desde, i)
      continue
    }
    i += 1
  }
  return s.slice(desde)
}

// ------------------------------------------------------- índice de objetos

// Un PDF es una lista de objetos numerados. La forma correcta de encontrarlos es
// la tabla xref, y es también la parte que más seguido está rota en los archivos
// de la vida real (offsets viejos, actualizaciones incrementales, generadores
// que la escriben mal). Se barren en orden: el cursor salta al final de cada
// objeto ya leído, así que un "12 0 obj" que caiga adentro de un binario no
// confunde al que sigue.
function indexarObjetos(s) {
  const objetos = new Map()
  const re = /(\d+)\s+(\d+)\s+obj\b/g
  let m

  while ((m = re.exec(s))) {
    const numero = Number(m[1])
    const cuerpoDesde = m.index + m[0].length
    const dictDesde = s.indexOf('<<', cuerpoDesde)
    const marcaStream = s.indexOf('stream', cuerpoDesde)
    const finObjeto = s.indexOf('endobj', cuerpoDesde)

    const dict =
      dictDesde !== -1 && (finObjeto === -1 || dictDesde < finObjeto)
        ? leerDiccionario(s, dictDesde)
        : s.slice(cuerpoDesde, finObjeto === -1 ? cuerpoDesde : finObjeto)

    let stream = null
    if (marcaStream !== -1 && (finObjeto === -1 || marcaStream < finObjeto)) {
      let datos = marcaStream + 'stream'.length
      if (s[datos] === '\r') datos += 1
      if (s[datos] === '\n') datos += 1

      // El /Length dice cuánto mide exactamente, y es la única forma de cortar
      // bien un stream que tenga "endstream" adentro de sus propios bytes.
      const largo = /\/Length\s+(\d+)(?!\s+\d+\s+R)/.exec(dict)
      let hasta = largo ? datos + Number(largo[1]) : -1
      if (hasta === -1 || !/^\s*endstream/.test(s.slice(hasta, hasta + 12))) {
        hasta = s.indexOf('endstream', datos)
      }
      if (hasta !== -1) {
        stream = { desde: datos, hasta }
        re.lastIndex = hasta
      }
    }

    if (!objetos.has(numero)) objetos.set(numero, { dict, stream })
  }

  return objetos
}

// Los bytes de un stream, descomprimidos si hacía falta. Los filtros que no son
// Flate (LZW, JPEG, JBIG2) no son texto: se saltean.
function datosDe(objeto, s) {
  if (!objeto?.stream) return null
  const crudo = Buffer.from(s.slice(objeto.stream.desde, objeto.stream.hasta), 'latin1')
  if (/\/FlateDecode/.test(objeto.dict)) return inflar(crudo)
  if (/\/Filter/.test(objeto.dict)) return null
  return crudo
}

// Desde 1.5 los objetos que no son streams pueden venir empaquetados adentro de
// otro (/Type /ObjStm), comprimidos todos juntos. Sin abrirlos no hay páginas
// que encontrar: en un PDF exportado de Word está ahí adentro todo el árbol.
function expandirObjStm(objetos, s) {
  for (const objeto of [...objetos.values()]) {
    if (!/\/Type\s*\/ObjStm/.test(objeto.dict)) continue
    const datos = datosDe(objeto, s)
    if (!datos) continue

    const primero = Number(/\/First\s+(\d+)/.exec(objeto.dict)?.[1] ?? 0)
    const cantidad = Number(/\/N\s+(\d+)/.exec(objeto.dict)?.[1] ?? 0)
    const texto = aTexto(datos)
    const cabecera = texto.slice(0, primero).trim().split(/\s+/).map(Number)

    for (let i = 0; i < cantidad; i += 1) {
      const numero = cabecera[i * 2]
      const desplazamiento = cabecera[i * 2 + 1]
      if (!Number.isFinite(numero) || !Number.isFinite(desplazamiento)) continue
      if (objetos.has(numero)) continue
      const inicio = primero + desplazamiento
      const dictDesde = texto.indexOf('<<', inicio)
      const dict =
        dictDesde !== -1 && dictDesde - inicio < 4 ? leerDiccionario(texto, dictDesde) : texto.slice(inicio, inicio + 400)
      objetos.set(numero, { dict, stream: null })
    }
  }
}

// ------------------------------------------------------------- /ToUnicode

function hexAcadena(hex) {
  let salida = ''
  for (let i = 0; i + 3 < hex.length; i += 4) salida += String.fromCharCode(parseInt(hex.slice(i, i + 4), 16))
  // Un dst de dos dígitos (fuentes simples) también existe.
  if (hex.length === 2) return String.fromCharCode(parseInt(hex, 16))
  return salida
}

// El mapa de la fuente: número de glifo → texto. Sale del CMap /ToUnicode, que
// es texto plano adentro del PDF y trae dos formas, `bfchar` (uno por uno) y
// `bfrange` (un rango corrido, que es como se escriben los alfabetos).
function parsearToUnicode(texto) {
  const mapa = new Map()

  for (const bloque of texto.matchAll(/beginbfchar([\s\S]*?)endbfchar/g)) {
    for (const par of bloque[1].matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]*)>/g)) {
      mapa.set(parseInt(par[1], 16), hexAcadena(par[2]))
    }
  }

  for (const bloque of texto.matchAll(/beginbfrange([\s\S]*?)endbfrange/g)) {
    // Rango con destino corrido: <20> <7e> <0020>
    for (const r of bloque[1].matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/g)) {
      const desde = parseInt(r[1], 16)
      const hasta = parseInt(r[2], 16)
      const base = parseInt(r[3], 16)
      // Un rango disparatado (un archivo roto) llenaría la memoria de entradas.
      if (hasta - desde > 65_535) continue
      for (let c = desde; c <= hasta; c += 1) mapa.set(c, String.fromCharCode(base + (c - desde)))
    }
    // Rango con lista: <20> <22> [<0041> <0042> <0043>]
    for (const r of bloque[1].matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*\[([\s\S]*?)\]/g)) {
      const desde = parseInt(r[1], 16)
      let i = 0
      for (const d of r[3].matchAll(/<([0-9a-fA-F]*)>/g)) {
        mapa.set(desde + i, hexAcadena(d[1]))
        i += 1
      }
    }
  }

  const anchos = [...texto.matchAll(/begincodespacerange([\s\S]*?)endcodespacerange/g)]
    .flatMap((b) => [...b[1].matchAll(/<([0-9a-fA-F]+)>/g)].map((h) => h[1].length / 2))
  const bytes = anchos.length > 0 ? Math.max(...anchos) : 2

  return { mapa, bytes }
}

// Cómo se decodifica una cadena escrita con esta fuente. Sin /ToUnicode se
// asume una fuente simple de un byte, que es lo que usan los PDF viejos y los
// generados por LaTeX: ahí el código *es* el carácter.
function decodificadorDeFuente(objetos, s, numero) {
  const fuente = objetos.get(numero)
  if (!fuente) return null

  const ref = /\/ToUnicode\s+(\d+)\s+\d+\s+R/.exec(fuente.dict)
  const compuesta = /\/Subtype\s*\/Type0/.test(fuente.dict) || /\/Encoding\s*\/Identity-[HV]/.test(fuente.dict)

  if (!ref) return { mapa: null, bytes: compuesta ? 2 : 1 }

  const datos = datosDe(objetos.get(Number(ref[1])), s)
  if (!datos) return { mapa: null, bytes: compuesta ? 2 : 1 }

  const { mapa, bytes } = parsearToUnicode(aTexto(datos))
  return { mapa, bytes: compuesta ? Math.max(bytes, 2) : bytes }
}

function decodificar(bytesCrudos, fuente) {
  if (!fuente || (!fuente.mapa && fuente.bytes === 1)) return bytesCrudos
  const ancho = fuente.bytes
  let salida = ''
  for (let i = 0; i + ancho - 1 < bytesCrudos.length; i += ancho) {
    let codigo = 0
    for (let b = 0; b < ancho; b += 1) codigo = (codigo << 8) | bytesCrudos.charCodeAt(i + b)
    salida += fuente.mapa?.get(codigo) ?? (ancho === 1 ? bytesCrudos[i] : '')
  }
  return salida
}

// --------------------------------------------------- streams de contenido

// Las cadenas literales de PostScript: `(texto)`, con paréntesis balanceados,
// escapes con barra y octales. Devuelve los BYTES, no el texto: qué letra es
// cada byte lo decide la fuente, no este parser.
function leerLiteral(s, i) {
  let nivel = 1
  let salida = ''
  while (i < s.length) {
    const c = s[i]
    if (c === '\\') {
      const octal = /^[0-7]{1,3}/.exec(s.slice(i + 1, i + 4))
      if (octal) {
        salida += String.fromCharCode(parseInt(octal[0], 8))
        i += 1 + octal[0].length
        continue
      }
      const sig = s[i + 1]
      const ESCAPES = { n: '\n', r: '\r', t: '\t', b: '\b', f: '\f' }
      // Una barra antes de un salto de línea es una continuación: no aporta nada.
      if (sig !== '\n' && sig !== '\r') salida += ESCAPES[sig] ?? sig
      i += 2
      continue
    }
    if (c === '(') nivel += 1
    if (c === ')') {
      nivel -= 1
      if (nivel === 0) return { texto: salida, i: i + 1 }
    }
    salida += c
    i += 1
  }
  return { texto: salida, i }
}

function leerHex(s, i) {
  const cierre = s.indexOf('>', i)
  if (cierre === -1) return { texto: '', i: s.length }
  let hex = s.slice(i, cierre).replace(/[^0-9a-fA-F]/g, '')
  if (hex.length % 2 === 1) hex += '0'
  let salida = ''
  for (let p = 0; p < hex.length; p += 2) salida += String.fromCharCode(parseInt(hex.slice(p, p + 2), 16))
  return { texto: salida, i: cierre + 1 }
}

// Un corrimiento hacia atrás dentro de un TJ es lo que un PDF usa para separar
// palabras: muchos generadores no escriben el espacio, lo dibujan moviendo el
// cursor. Sin esto sale "elhorariodeatención". Vale solo adentro del array de un
// TJ: afuera, un número negativo es una coordenada.
const CORRIMIENTO_ESPACIO = -120

// El contenido de una página es una lista de operandos seguidos de su operador.
// Los que dibujan texto son Tj (una cadena), TJ (un array de cadenas y
// corrimientos), y ' y " que además bajan un renglón.
//
// **Dónde corta el renglón se decide por la coordenada Y, en el momento de
// dibujar.** Es la parte que hay que mirar dos veces. Un PDF de Google Docs
// dibuja cada letra con su propio `tx 0 Td <glifo> Tj` y abre un BT/ET por
// palabra, así que las dos reglas obvias fallan de maneras distintas: cortar en
// cada Td devuelve el documento en vertical, una letra por línea, y cortar en
// cada ET lo devuelve con una palabra por línea. Lo único que separa de verdad
// dos renglones es que la Y del texto cambió, y eso se sabe recién cuando se lo
// dibuja: se lleva la traslación de la matriz de línea (Tm la fija, Td la
// corre) y se compara contra la del último texto que salió.
function textoDeContenido(contenido, fuentes) {
  const s = contenido
  let salida = ''
  let pendiente = ''
  let fuente = null
  let tamaño = 12
  let operandos = []
  let enArray = false
  // Traslación de la matriz de línea, y la Y del último texto dibujado.
  let x = 0
  let y = 0
  let ultimaY = null
  let saltoPedido = false
  let i = 0

  // La matriz del dibujo (`cm`) con su pila (`q`/`Q`). Hace falta para comparar
  // dos textos que están en grupos distintos: cada celda de una tabla se dibuja
  // adentro de su propio `q … cm … Q` y arranca la Y de cero, así que sin
  // sumarle la del grupo la tabla entera parece un solo renglón. Se llevan solo
  // escala y traslación: un texto rotado no es lo que estamos leyendo acá.
  let ctm = { a: 1, d: 1, e: 0, f: 0 }
  const pila = []

  const numero = (indice) => {
    const v = operandos[indice < 0 ? operandos.length + indice : indice]
    return typeof v === 'number' ? v : 0
  }

  const yAbsoluta = () => ctm.f + ctm.d * y
  const altoDeLinea = () => Math.abs(tamaño * ctm.d) || tamaño

  // Escribe lo acumulado, poniendo adelante el corte de renglón que
  // corresponda. Dos saltos si el hueco vertical es más de una línea y media:
  // ahí no cambió de renglón, cambió de párrafo.
  const dibujar = () => {
    if (!pendiente) return
    const actual = yAbsoluta()
    const salto = Math.abs(actual - (ultimaY ?? actual))
    if (saltoPedido || (ultimaY !== null && salto > 0.5)) {
      salida += salto > altoDeLinea() * 1.6 ? '\n\n' : '\n'
    }
    salida += pendiente
    pendiente = ''
    ultimaY = actual
    saltoPedido = false
  }

  while (i < s.length) {
    const c = s[i]

    if (c === '(') {
      const { texto, i: sig } = leerLiteral(s, i + 1)
      pendiente += decodificar(texto, fuente)
      i = sig
      continue
    }
    if (c === '<' && s[i + 1] === '<') {
      // Un diccionario inline (el marcado de contenido) no dibuja nada, y
      // adentro puede haber paréntesis que confundirían al lector de cadenas.
      i += leerDiccionario(s, i).length
      continue
    }
    if (c === '<') {
      const { texto, i: sig } = leerHex(s, i + 1)
      pendiente += decodificar(texto, fuente)
      i = sig
      continue
    }
    if (c === '[' || c === ']') {
      enArray = c === '['
      i += 1
      continue
    }
    if (c === '/') {
      const m = /^\/([^\s/[\]<>(]*)/.exec(s.slice(i))
      operandos.push({ nombre: m[1] })
      i += m[0].length
      continue
    }
    if (c === '-' || c === '+' || c === '.' || (c >= '0' && c <= '9')) {
      const m = /^[-+]?\d*\.?\d+/.exec(s.slice(i))
      if (m) {
        const n = Number(m[0])
        if (enArray && n <= CORRIMIENTO_ESPACIO && pendiente && !pendiente.endsWith(' ')) pendiente += ' '
        operandos.push(n)
        i += m[0].length
        continue
      }
    }

    // El operador es el token entero: cortando en el prefijo, un `qwerty`
    // cualquiera pasaría por el `q` que apila la matriz.
    const op = /^([A-Za-z*]+|'|")/.exec(s.slice(i))
    if (op) {
      switch (op[1]) {
        case 'Tf': {
          const nombre = operandos.find((o) => o?.nombre)?.nombre
          fuente = fuentes.get(nombre) ?? null
          if (numero(-1)) tamaño = Math.abs(numero(-1))
          break
        }
        case 'Tj':
        case 'TJ':
          dibujar()
          break
        case "'":
        case '"':
          saltoPedido = true
          dibujar()
          break
        case 'Td':
        case 'TD':
          // Corre la línea. Td es relativo: `14.8 0 Td` entre dos glifos es
          // avanzar dentro del mismo renglón, no bajar de renglón.
          x += numero(-2)
          y += numero(-1)
          break
        case 'Tm':
          // a b c d e f — la traslación son los dos últimos.
          x = numero(-2)
          y = numero(-1)
          break
        case 'T*':
          saltoPedido = true
          break
        case 'BT':
          x = 0
          y = 0
          break
        case 'ET':
          // Cierra el bloque pero no corta el renglón: un generador que abre un
          // BT por palabra devolvería una palabra por línea.
          dibujar()
          break
        case 'q':
          pila.push({ ...ctm })
          break
        case 'Q':
          ctm = pila.pop() ?? { a: 1, d: 1, e: 0, f: 0 }
          break
        case 'cm':
          ctm = {
            a: numero(-6) * ctm.a,
            d: numero(-3) * ctm.d,
            e: numero(-2) * ctm.a + ctm.e,
            f: numero(-1) * ctm.d + ctm.f,
          }
          break
        // Cualquier otro operador (dibujo, color, estado) no aporta texto, pero
        // igual descarta sus operandos: si no, sus números quedarían adelante de
        // los del próximo y el Td siguiente leería la coordenada equivocada.
      }
      operandos = []
      i += op[1].length
      continue
    }

    i += 1
  }

  dibujar()
  return salida
}

// ------------------------------------------------------------------ páginas

function refsDe(valor) {
  return [...String(valor).matchAll(/(\d+)\s+\d+\s+R/g)].map((m) => Number(m[1]))
}

// El `/Font << /F1 12 0 R … >>` de una página, ya resuelto a decodificadores.
function fuentesDePagina(objetos, s, dictPagina) {
  const fuentes = new Map()

  let recursos = null
  const inline = /\/Resources\s*<</.exec(dictPagina)
  if (inline) {
    recursos = leerDiccionario(dictPagina, dictPagina.indexOf('<<', inline.index + '/Resources'.length))
  } else {
    const ref = /\/Resources\s+(\d+)\s+\d+\s+R/.exec(dictPagina)
    if (ref) recursos = objetos.get(Number(ref[1]))?.dict ?? null
  }
  if (!recursos) return fuentes

  let dictFuentes = null
  const fuentesInline = /\/Font\s*<</.exec(recursos)
  if (fuentesInline) {
    dictFuentes = leerDiccionario(recursos, recursos.indexOf('<<', fuentesInline.index + '/Font'.length))
  } else {
    const ref = /\/Font\s+(\d+)\s+\d+\s+R/.exec(recursos)
    if (ref) dictFuentes = objetos.get(Number(ref[1]))?.dict ?? null
  }
  if (!dictFuentes) return fuentes

  for (const m of dictFuentes.matchAll(/\/([^\s/[\]<>]+)\s+(\d+)\s+\d+\s+R/g)) {
    const decodificador = decodificadorDeFuente(objetos, s, Number(m[2]))
    if (decodificador) fuentes.set(m[1], decodificador)
  }
  return fuentes
}

function textoDePaginas(objetos, s) {
  let salida = ''

  for (const objeto of objetos.values()) {
    if (!/\/Type\s*\/Page[^s]/.test(`${objeto.dict} `)) continue

    const contenidos = /\/Contents\s*\[([^\]]*)\]/.exec(objeto.dict)
    const refs = contenidos ? refsDe(contenidos[1]) : refsDe(/\/Contents\s+(\d+\s+\d+\s+R)/.exec(objeto.dict)?.[1] ?? '')
    if (refs.length === 0) continue

    const fuentes = fuentesDePagina(objetos, s, objeto.dict)

    for (const ref of refs) {
      const datos = datosDe(objetos.get(ref), s)
      if (!datos) continue
      salida += textoDeContenido(aTexto(datos), fuentes)
    }
    salida += '\n\n'
  }

  return salida
}

// El camino de atrás: si el árbol de páginas no se pudo recorrer (un archivo
// raro, un generador que no escribe /Type /Page), se leen todos los streams que
// parezcan contenido. Sin fuentes no hay CID que resolver, pero para un PDF
// viejo de fuentes simples alcanza — y es mejor que devolver nada.
function textoDeTodosLosStreams(objetos, s) {
  let salida = ''
  for (const objeto of objetos.values()) {
    if (/\/Subtype\s*\/Image|\/Length1|\/Type\s*\/(ObjStm|XRef|Metadata)/.test(objeto.dict)) continue
    const datos = datosDe(objeto, s)
    if (!datos) continue
    const texto = aTexto(datos)
    if (!/\b(Tj|TJ)\b/.test(texto)) continue
    salida += textoDeContenido(texto, new Map())
  }
  return salida
}

// ¿Lo que salió es texto o son glifos? Se mide sobre lo que no es espacio: un
// PDF con fuente CID sin /ToUnicode devuelve caracteres de control y símbolos en
// la misma proporción que las letras, y eso adentro de un prompt es peor que no
// tener nada — el modelo lo lee como si el negocio lo hubiera escrito.
function pareceTexto(texto) {
  const limpio = texto.replace(/\s+/g, '')
  if (limpio.length < 40) return false
  const legibles = limpio.match(/[\p{L}\p{N}\p{P}$€%+=]/gu)?.length ?? 0
  return legibles / limpio.length > 0.85
}

function limpiar(texto) {
  return texto
    .replace(/\r/g, '\n')
    // Los saltos que mete cada Td son uno por línea dibujada, así que un párrafo
    // llega partido renglón por renglón. Se juntan los espacios y se dejan como
    // mucho dos saltos seguidos, que es lo que separa un párrafo del siguiente.
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function extraerPdf(buffer) {
  const s = aTexto(buffer)
  const objetos = indexarObjetos(s)
  expandirObjStm(objetos, s)

  const porPaginas = limpiar(textoDePaginas(objetos, s))
  if (pareceTexto(porPaginas)) return porPaginas

  const porStreams = limpiar(textoDeTodosLosStreams(objetos, s))
  return pareceTexto(porStreams) ? porStreams : null
}
