import { useCallback, useEffect, useRef, useState } from 'react'
import Button from './ui/Button'
import {
  IconBolt,
  IconCheck,
  IconChevronRight,
  IconClock,
  IconClose,
  IconCompose,
  IconContactCard,
  IconFolder,
  IconHome,
  IconInbox,
  IconPointer,
  IconSettings,
  IconSidebarToggle,
  IconSparkles,
  IconUsers,
} from './ui/icons'
import { useT } from '../lib/i18n.jsx'

// El recorrido guiado. No es un carrusel de capturas ni una pila de modales: se
// hace **sobre la app de verdad** —el tour navega solo entre las pantallas y en
// cada paso recorta un agujero en el velo alrededor de la pieza de la que está
// hablando— y, en varios pasos, **lo toca el admin y no el tour**.
//
// Esa es la decisión que ordena el archivo. Un recorrido en el que lo único que
// se hace es apretar "Siguiente" once veces se lee como un folleto: se mira, no
// se aprende, y al terminar la persona sigue sin haber abierto una sola
// conversación. Los pasos con `accion` no tienen botón de avanzar — avanzan
// cuando la acción ocurrió de verdad en la app de abajo (se tocó *esa* fila, se
// escribió en *ese* cuadro), y recién ahí la tarjeta contesta con una tilde.
//
// Cuatro reglas sostienen que eso no se convierta en una trampa:
//
// - **Nadie queda encerrado.** Todo paso con acción ofrece "Seguir sin probar",
//   y las flechas del teclado siguen caminando el recorrido.
// - **Una acción cuyo elemento no está en pantalla no existe.** Sin ninguna
//   conversación no hay ninguna que abrir, y sin día abierto el composer es un
//   cartel sin campo adentro: ahí el paso vuelve a ser uno normal, con su botón
//   de siempre. Es la misma regla que ya tenían los objetivos (`saltear`), un
//   escalón más abajo.
// - **Nada de lo que se pide toca al cliente.** Se navega, se filtra, se abre
//   una conversación y se escribe un borrador. Por eso el paso del composer se
//   come el Enter mientras dura: escribir para probar es parte del recorrido,
//   mandarle eso a una persona de verdad no. Es lo que deja pedir la acción sin
//   ninguna advertencia al lado.
// - **Lo hecho queda hecho.** Volver atrás a un paso ya cumplido no lo vuelve a
//   pedir ni lo hace auto-avanzar: muestra la tilde y su botón.
//
// Y dos que vienen de antes y no cambiaron:
//
// - **El objetivo se busca por `data-tour` y no por una clase ni por una ref.**
//   Una ref obligaría a que cada pieza de la app —la barra, la lista, el
//   composer, la ficha— le pase algo al tour hacia arriba, y con eso el tour
//   pasaría a estar metido adentro de seis componentes que no tienen nada que
//   ver entre sí. Con el atributo, lo único que sabe la app del tour es una
//   palabra en un `div`.
// - **Un paso cuyo objetivo no aparece se saltea, no rompe.** Un tour que se
//   traba esperando algo que no va a llegar es peor que uno más corto.
//
// El movimiento es uno solo: el recorte viaja de un objetivo al siguiente y la
// tarjeta viaja con él. Lo único que late es el anillo de la pieza que hay que
// tocar, y late porque no adorna: es lo que la separa de las otras nueve que
// quedaron a la vista adentro del mismo recorte.
//
// **El cambio de paso sale entero o no sale.** Cambiar de paso no es cambiar el
// texto: es que el recorte arranque a viajar y la tarjeta cuente lo que va a
// señalar. Las dos cosas pasan en el mismo cuadro, y ese cuadro es el primero
// que tiene medido al objetivo nuevo (`mostrado`), no el del click. Antes eran
// dos momentos distintos —el texto cambiaba al instante y el recorte esperaba a
// que la página siguiente terminara de montar—, así que entre uno y otro la
// tarjeta explicaba el composer con el agujero todavía puesto sobre la barra.
//
// Lo que se movía de golpe también se acomodó: el cuerpo de la tarjeta **morfea
// de alto** en vez de saltar (los textos no miden lo mismo y la pista aparece y
// desaparece, y el alto es lo que centra la tarjeta contra el recorte, así que
// el salto la corría de lugar), y el texto entra desde el lado del que viene el
// recorrido, que es lo único que distingue un paso adelante de uno atrás cuando
// el recorte se corre dos filas.

// El recorrido general no tiene flag propio de "ya lo vio": quién lo ve la
// primera vez lo decide la bienvenida (`WelcomeTour.jsx`, que guarda el suyo) y
// volver a verlo lo pide la persona desde Configuración. Un segundo flag para lo
// mismo son dos lugares donde apagar la misma pantalla.
//
// El de armar un agente sí tiene el suyo, y no es una excepción a lo de arriba:
// no lo abre nadie, arranca solo al entrar a Agentes por primera vez, así que
// necesita recordar que ya pasó. Va acá al lado de la lista de pasos y no en un
// hook, por lo mismo que el de la bienvenida: son dos líneas y un try, y en
// incógnito con el almacenamiento bloqueado no poder recordarlo no es motivo
// para que la pantalla no abra.
const CLAVE_AGENTE = 'wsp-crm:tour-agente'

export function tourAgentePendiente() {
  try {
    return localStorage.getItem(CLAVE_AGENTE) !== 'visto'
  } catch {
    return false
  }
}

export function marcarTourAgenteVisto() {
  try {
    localStorage.setItem(CLAVE_AGENTE, 'visto')
  } catch {
    /* ver tourAgentePendiente */
  }
}
//
// Las claves van escritas enteras, igual que en la bienvenida: un
// `t('tour.' + paso.clave + 'Titulo')` no lo encuentra ningún grep, que es como
// se llega a un texto huérfano en el diccionario y a otro faltando en pantalla.
//
// El orden es el de la app y no el de la importancia: se entra por Inicio, se
// baja por la barra, se trabaja en la bandeja y recién al final se configura.
// `lado` es solo una preferencia — si de ese lado no entra, se ubica sola.
//
// `accion.en` es qué se toca y **no es lo mismo que `target`**, que es lo que se
// ilumina: el recorte abre la barra entera para que se vea de qué lista se está
// hablando, y adentro late la única fila que hay que apretar. Cuando son la
// misma pieza, `en` se omite.
export const PASOS = [
  {
    clave: 'inicio',
    pagina: 'home',
    target: 'home-kpis',
    Icono: IconHome,
    lado: 'abajo',
    titulo: 'tour.inicioTitulo',
    bajada: 'tour.inicioBajada',
  },
  {
    clave: 'barra',
    target: 'nav-secciones',
    Icono: IconSidebarToggle,
    lado: 'derecha',
    titulo: 'tour.barraTitulo',
    bajada: 'tour.barraBajada',
    accion: { tipo: 'click', en: 'nav-inbox', pista: 'tour.accionBarra' },
  },
  {
    clave: 'carpetas',
    target: 'nav-carpetas',
    Icono: IconFolder,
    lado: 'derecha',
    titulo: 'tour.carpetasTitulo',
    bajada: 'tour.carpetasBajada',
    accion: { tipo: 'click', en: 'nav-pendientes', pista: 'tour.accionCarpetas' },
  },
  {
    clave: 'dia',
    target: 'nav-dia',
    Icono: IconClock,
    lado: 'derecha',
    titulo: 'tour.diaTitulo',
    bajada: 'tour.diaBajada',
  },
  // Vuelve a poner la carpeta "Todas". El paso anterior deja la bandeja
  // filtrada en Pendientes, y si ahí no hay ninguna, los tres pasos que siguen
  // —la lista, el hilo, el composer— se quedan sin nada que señalar por algo
  // que hizo el propio recorrido dos pasos antes.
  {
    clave: 'lista',
    pagina: 'inbox',
    filtro: 'todos',
    target: 'inbox-lista',
    Icono: IconInbox,
    lado: 'derecha',
    titulo: 'tour.listaTitulo',
    bajada: 'tour.listaBajada',
    accion: { tipo: 'click', en: 'inbox-conversacion', pista: 'tour.accionLista' },
  },
  {
    clave: 'hilo',
    pagina: 'inbox',
    target: 'inbox-hilo',
    Icono: IconInbox,
    lado: 'izquierda',
    titulo: 'tour.hiloTitulo',
    bajada: 'tour.hiloBajada',
  },
  {
    clave: 'composer',
    pagina: 'inbox',
    target: 'inbox-composer',
    Icono: IconCompose,
    lado: 'arriba',
    titulo: 'tour.composerTitulo',
    bajada: 'tour.composerBajada',
    // `cortaEnter`: mientras dure este paso el tour se come el Enter. Es de este
    // paso y no de todos los que piden escribir — la prueba de un agente no
    // escribe nada en ningún lado y ahí mandar es el punto.
    accion: {
      tipo: 'escribir',
      en: 'inbox-composer',
      cortaEnter: true,
      pista: 'tour.accionComposer',
    },
  },
  {
    clave: 'ficha',
    pagina: 'inbox',
    target: 'inbox-ficha',
    Icono: IconContactCard,
    lado: 'izquierda',
    titulo: 'tour.fichaTitulo',
    bajada: 'tour.fichaBajada',
  },
  {
    clave: 'agentes',
    pagina: 'agents',
    target: 'agentes-nuevo',
    Icono: IconSparkles,
    lado: 'abajo',
    titulo: 'tour.agentesTitulo',
    bajada: 'tour.agentesBajada',
  },
  {
    clave: 'canales',
    pagina: 'settings',
    seccion: 'canales',
    target: 'config-canales',
    Icono: IconSettings,
    lado: 'izquierda',
    titulo: 'tour.canalesTitulo',
    bajada: 'tour.canalesBajada',
  },
  // El último no señala nada y cae en el medio de la bandeja, que es donde se
  // trabaja: el tour termina dejando a la persona parada donde va a estar.
  //
  // `cta` es el botón del cierre. Vive en el paso y no en el componente porque
  // hay más de un recorrido: lo que sigue después de este es siempre conectar un
  // canal, y después del de armar un agente es otra cosa.
  {
    clave: 'final',
    pagina: 'inbox',
    filtro: 'todos',
    Icono: IconCheck,
    titulo: 'tour.finalTitulo',
    bajada: 'tour.finalBajada',
    cta: { texto: 'tour.finalConectar', ir: { pagina: 'settings', seccion: 'canales' } },
  },
]

// El segundo recorrido: **armar el primer agente, uno de verdad**. Arranca solo
// la primera vez que alguien entra a Agentes (`App.jsx`), y no se superpone con
// el general — ese señala el botón y explica qué es un agente; este se queda en
// la pantalla y lo hace.
//
// Es de punta a punta del admin: los seis pasos con acción son los seis
// movimientos que hay que hacer para tener un agente contestando, y ninguno lo
// hace el tour. El agente que sale es un **recepcionista**, que es el que sirve
// tenga el negocio que tenga: atiende al que escribe por primera vez, saluda,
// entiende qué necesita y deriva. Un ejemplo de "vendedor de zapatillas" no se
// puede copiar sin cambiarlo entero.
//
// Los textos de rol e instrucciones van escritos en la pista, listos para
// copiar. Es la parte que de verdad cuesta: la pantalla ya dice que el rol es
// "cuándo entra" y las instrucciones "cómo escribe", y aún así frente al campo
// vacío no se sabe qué poner.
export const PASOS_AGENTE = [
  {
    clave: 'aArmar',
    pagina: 'agents',
    target: 'agentes-nuevo',
    Icono: IconSparkles,
    lado: 'abajo',
    titulo: 'tourAgente.abrirTitulo',
    bajada: 'tourAgente.abrirBajada',
    accion: { tipo: 'click', pista: 'tourAgente.accionAbrir' },
  },
  {
    clave: 'nombre',
    target: 'agente-identidad',
    Icono: IconContactCard,
    lado: 'derecha',
    titulo: 'tourAgente.nombreTitulo',
    bajada: 'tourAgente.nombreBajada',
    accion: { tipo: 'escribir', en: 'agente-nombre', pista: 'tourAgente.accionNombre' },
  },
  {
    clave: 'rol',
    target: 'agente-rol',
    Icono: IconUsers,
    lado: 'derecha',
    titulo: 'tourAgente.rolTitulo',
    bajada: 'tourAgente.rolBajada',
    accion: { tipo: 'escribir', pista: 'tourAgente.accionRol' },
  },
  {
    clave: 'instrucciones',
    target: 'agente-instrucciones',
    Icono: IconCompose,
    lado: 'derecha',
    titulo: 'tourAgente.instruccionesTitulo',
    bajada: 'tourAgente.instruccionesBajada',
    accion: { tipo: 'escribir', pista: 'tourAgente.accionInstrucciones' },
  },
  {
    clave: 'comportamiento',
    target: 'agente-comportamiento',
    Icono: IconBolt,
    lado: 'derecha',
    titulo: 'tourAgente.comportamientoTitulo',
    bajada: 'tourAgente.comportamientoBajada',
  },
  {
    clave: 'crear',
    target: 'agente-guardar',
    Icono: IconCheck,
    lado: 'abajo',
    titulo: 'tourAgente.crearTitulo',
    bajada: 'tourAgente.crearBajada',
    accion: { tipo: 'click', pista: 'tourAgente.accionCrear' },
  },
  // Acá el Enter **no** se corta: la prueba no escribe nada en ningún lado —ni
  // conversación, ni mensaje, ni día— así que mandarlo es justamente el punto
  // del paso. Es al revés que el composer de la bandeja, donde ese mismo Enter
  // le llega a una persona de verdad.
  {
    clave: 'probar',
    target: 'agente-prueba',
    Icono: IconSparkles,
    lado: 'izquierda',
    titulo: 'tourAgente.probarTitulo',
    bajada: 'tourAgente.probarBajada',
    accion: { tipo: 'escribir', pista: 'tourAgente.accionProbar' },
  },
  {
    clave: 'final',
    Icono: IconCheck,
    titulo: 'tourAgente.finalTitulo',
    bajada: 'tourAgente.finalBajada',
    cta: { texto: 'tourAgente.finalConectar', ir: { pagina: 'settings', seccion: 'canales' } },
  },
]

// Cuántos pasos de un recorrido piden que el admin haga algo. Se cuenta por
// lista y no una vez al cargar el módulo, porque ahora hay más de una: la del
// recorrido general y la de armar un agente.
const conAccion = (pasos) => pasos.filter((p) => p.accion).length

// Cuánto se espera a que aparezca el objetivo de un paso antes de darlo por
// inexistente y seguir. Alcanza para un cambio de página (que remonta el
// contenido) y para el salto de sección de Configuración, que es un efecto.
const ESPERA_MAX_MS = 1200
const AIRE_RECORTE = 8 // cuánto respira el agujero alrededor de la pieza
const AIRE_ANILLO = 3 // el de la pieza que hay que tocar: pegado, para señalarla
// El ancho de la tarjeta. 400 y no los 344 de antes: adentro va un título, un
// párrafo de tres o cuatro renglones y, en la mitad de los pasos, la pista de lo
// que hay que hacer —que en el recorrido del agente es un texto para copiar—.
// A 344 eso eran ocho renglones de 40 caracteres, que se lee como una nota al
// pie de la app y no como quien la está explicando. El resto de la tarjeta
// acompaña: 16px el título, 13.5 la bajada, 13 la pista.
const ANCHO_TARJETA = 400
const AIRE_TARJETA = 14 // entre el borde del recorte y la tarjeta
const MARGEN = 16 // mínimo contra el borde de la pantalla
const LADOS = ['derecha', 'izquierda', 'abajo', 'arriba']

// Lo que queda la tilde en pantalla antes de pasar al paso siguiente. Es el
// acuse de recibo de lo que la persona acaba de hacer: sin esa pausa, tocar la
// fila correcta se ve igual que haber apretado "Siguiente".
const FESTEJO_MS = 900

// Quien pidió menos movimiento no tiene por qué ver el recorte viajar: ahí el
// salto es instantáneo. Se lee una sola vez — nadie cambia esta preferencia
// mientras mira un tour de dos minutos.
const sinMovimiento = () => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

const acotar = (v, min, max) => Math.max(min, Math.min(max, v))

const buscar = (nombre) => (nombre ? document.querySelector(`[data-tour="${nombre}"]`) : null)

// Qué se toca en este paso. Son varios y no uno porque la pieza que se señala
// no siempre es la única que cumple: el anillo late sobre la primera fila de la
// lista, pero abrir la tercera conversación es exactamente lo mismo que se
// estaba enseñando, y un paso que no lo acepta le dice a alguien que acaba de
// hacerlo bien que lo hizo mal.
//
// Para "escribir" no alcanza con que esté el bloque: lo que hay que poder tocar
// es el campo, y el composer sin día abierto es un cartel sin ningún campo
// adentro. Devolver la lista vacía es lo que degrada el paso a uno normal, con
// su botón de avanzar.
function elementosDeAccion(paso) {
  const acc = paso?.accion
  if (!acc) return []
  const bases = Array.from(document.querySelectorAll(`[data-tour="${acc.en ?? paso.target}"]`))
  if (acc.tipo === 'escribir') {
    const campo = bases[0]?.querySelector('textarea, input[type="text"]')
    return campo ? [campo] : []
  }
  return bases
}

// El que se mide y se señala: el primero en el orden del documento.
const elDeAccion = (paso) => elementosDeAccion(paso)[0] ?? null

function recuadroDe(el, aire = AIRE_RECORTE) {
  const r = el.getBoundingClientRect()
  return {
    left: r.left - aire,
    top: r.top - aire,
    width: r.width + aire * 2,
    height: r.height + aire * 2,
  }
}

// Un paso sin objetivo no apaga el velo: el agujero se cierra hasta medir cero
// en el centro de la pantalla, y la sombra de 9999px que lo rodea pasa a tapar
// todo. Así el mismo elemento sirve para "señalá esto" y para "no señales nada",
// y la transición entre los dos casos es la de siempre.
const enElCentro = () => ({
  left: window.innerWidth / 2,
  top: window.innerHeight / 2,
  width: 0,
  height: 0,
})

// Cuánto tarda el recorte en viajar de un objetivo al siguiente. Es lento a
// propósito: el viaje es lo único que dice que el paso anterior y este son la
// misma pantalla, y a mitad de esa velocidad se lee como un salto con estela.
const DUR_VIAJE_MS = 520

// Cuánto tarda el cuerpo de la tarjeta en pasar del alto de un paso al del
// siguiente. Es bastante más corto que el viaje: el alto no es una distancia
// que haya que recorrer con la vista, es una caja que se acomoda, y estirado
// se lee como si la tarjeta respirara.
const DUR_CUERPO_MS = 260

// Arranca y frena, sin rebote: el recorte es una lupa, no un objeto con peso.
const suavizar = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2)

// El recorte no salta de un objetivo al otro: viaja. Va por tiempo y no
// acercándose un porcentaje por cuadro, que es lo que parece más simple y no
// lo es: con un porcentaje fijo, la misma animación dura la mitad en una
// pantalla de 120Hz que en una de 60, y encima nunca termina del todo —se
// acerca al destino para siempre—, así que hay que cortarla a mano por
// distancia. Con el reloj, dura lo que dice `DUR_VIAJE_MS` en cualquier
// máquina y llega exacto.
//
// El destino se vuelve a leer en cada cuadro y no se congela: mientras el
// recorte viaja, la pieza abajo del velo puede estar moviéndose (el scroll que
// la trae a la vista, una sección de la barra que se despliega).
function mezclar(desde, hasta, p) {
  return {
    left: desde.left + (hasta.left - desde.left) * p,
    top: desde.top + (hasta.top - desde.top) * p,
    width: desde.width + (hasta.width - desde.width) * p,
    height: desde.height + (hasta.height - desde.height) * p,
  }
}

// De qué lado del recorte va la tarjeta. Se prueba el que pidió el paso y, si
// de ese lado no entra, los otros tres.
//
// El lado se decide **contra el recuadro final** y no contra el que se está
// dibujando, que es lo que lo mantiene quieto: mientras el recorte viaja, el
// mismo cálculo cuadro a cuadro va cambiando de opinión —a mitad de camino "a
// la derecha" todavía no entra— y la tarjeta salta de un lado al otro en pleno
// vuelo.
function elegirLado(destino, alto, preferido) {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const entra = {
    derecha: destino.left + destino.width + AIRE_TARJETA + ANCHO_TARJETA + MARGEN <= vw,
    izquierda: destino.left - AIRE_TARJETA - ANCHO_TARJETA - MARGEN >= 0,
    abajo: destino.top + destino.height + AIRE_TARJETA + alto + MARGEN <= vh,
    arriba: destino.top - AIRE_TARJETA - alto - MARGEN >= 0,
  }
  const orden = preferido ? [preferido, ...LADOS.filter((l) => l !== preferido)] : LADOS
  // Si no entra en ninguno queda acotada contra el borde: feo pero legible, y
  // solo pasa en una ventana muy chica.
  return orden.find((l) => entra[l]) ?? 'abajo'
}

// Dónde cae la tarjeta, ya con el lado decidido. Esta sí mira el recuadro que
// se está dibujando: es lo que la hace viajar junto con el recorte.
function ubicarTarjeta(caja, alto, lado) {
  const vw = window.innerWidth
  const vh = window.innerHeight
  if (!caja) {
    return { left: (vw - ANCHO_TARJETA) / 2, top: (vh - alto) / 2 }
  }

  const medioX = caja.left + caja.width / 2 - ANCHO_TARJETA / 2
  const medioY = caja.top + caja.height / 2 - alto / 2
  const posiciones = {
    derecha: { left: caja.left + caja.width + AIRE_TARJETA, top: medioY },
    izquierda: { left: caja.left - AIRE_TARJETA - ANCHO_TARJETA, top: medioY },
    abajo: { left: medioX, top: caja.top + caja.height + AIRE_TARJETA },
    arriba: { left: medioX, top: caja.top - AIRE_TARJETA - alto },
  }
  const p = posiciones[lado] ?? posiciones.abajo
  return {
    left: acotar(p.left, MARGEN, Math.max(MARGEN, vw - ANCHO_TARJETA - MARGEN)),
    top: acotar(p.top, MARGEN, Math.max(MARGEN, vh - alto - MARGEN)),
  }
}

const mismoRect = (a, b) =>
  a === b ||
  (!!a && !!b && a.left === b.left && a.top === b.top && a.width === b.width && a.height === b.height)

function mismaVista(prev, caja, tarjeta, accion) {
  if (!prev) return false
  return (
    mismoRect(prev.caja, caja) &&
    prev.tarjeta.left === tarjeta.left &&
    prev.tarjeta.top === tarjeta.top &&
    mismoRect(prev.accion, accion)
  )
}

// Los cuatro rectángulos que rodean al agujero, y que es lo que deja pasar el
// click en los pasos que piden algo: adentro del recorte manda la app, afuera
// sigue mandando el tour. El resto de los pasos tapan la pantalla entera con
// uno solo — abajo del velo la app está viva, y un click perdido en la barra
// cambiaría de página en medio de una explicación.
function marco(caja) {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const derecha = caja.left + caja.width
  const abajo = caja.top + caja.height
  const alto = Math.max(0, Math.min(vh, abajo) - Math.max(0, caja.top))
  const top = Math.max(0, caja.top)
  return [
    { left: 0, top: 0, width: vw, height: top },
    { left: 0, top: abajo, width: vw, height: Math.max(0, vh - abajo) },
    { left: 0, top, width: Math.max(0, caja.left), height: alto },
    { left: derecha, top, width: Math.max(0, vw - derecha), height: alto },
  ]
}

// `pasos` es qué recorrido se está haciendo. El componente no sabe cuál: mide
// objetivos, mueve el recorte y escucha lo que el paso pidió. Lo único que
// cambia entre uno y otro es la lista.
export default function Tour({ pasos = PASOS, onIr, onClose }) {
  const t = useT()
  const [indice, setIndice] = useState(0)
  const [vista, setVista] = useState(null)
  // Las acciones que ya cumplió el admin, por clave de paso. Sirven para dos
  // cosas: que volver atrás no vuelva a pedir lo mismo, y que el final pueda
  // decir cuántas hizo — que es toda la diferencia entre haber mirado la app y
  // haberla usado.
  const [hechos, setHechos] = useState([])
  // Qué paso está mostrando la tarjeta, y hacia dónde se venía. **No siempre es
  // `indice`**: la tarjeta no cambia de texto al cambiar de paso, cambia cuando
  // el recorte arranca a viajar hacia el nuevo objetivo.
  //
  // Es la diferencia entre un cambio de paso que se lee y uno que se sufre. El
  // objetivo del paso siguiente casi siempre está en otra pantalla, así que
  // entre el click y la primera medición hay un remonte entero de por medio; y
  // durante ese rato el recorte seguía parado sobre la pieza del paso anterior
  // mientras la tarjeta ya explicaba la que venía. O sea: el texto señalando lo
  // que no era, y recién después el salto. Ahora las dos cosas salen juntas.
  const [mostrado, setMostrado] = useState({ i: 0, sentido: 1 })
  // El paso que se acaba de cumplir. Vive aparte de `hechos` porque es un
  // estado momentáneo —la tilde y la pausa antes de avanzar— y no un registro.
  const [festejando, setFestejando] = useState(null)
  const cajaRef = useRef(null)
  const tarjetaRef = useRef(null)
  // El alto del cuerpo de la tarjeta. Existe para una sola cosa: que al cambiar
  // de paso la tarjeta **crezca o se achique** en vez de saltar. Los textos no
  // miden lo mismo y la pista punteada aparece y desaparece, así que sin esto
  // el alto cambia de golpe justo mientras la tarjeta viaja — y como el alto es
  // lo que centra la tarjeta contra el recorte, el salto también la corre de
  // lugar. Se mide con un ResizeObserver y no al cambiar de paso: el cuerpo se
  // reacomoda solo (la pista se enciende cuando el objetivo entra en pantalla,
  // la tilde de "ya lo hiciste" la reemplaza) y esos cambios son igual de
  // bruscos que el del paso.
  const [altoCuerpo, setAltoCuerpo] = useState(null)
  const observador = useRef(null)
  const medirCuerpo = useCallback((nodo) => {
    observador.current?.disconnect()
    observador.current = null
    if (!nodo) return
    setAltoCuerpo(nodo.offsetHeight)
    observador.current = new ResizeObserver(() => setAltoCuerpo(nodo.offsetHeight))
    observador.current.observe(nodo)
  }, [])
  useEffect(() => () => observador.current?.disconnect(), [])
  // Hacia dónde se estaba yendo. Sirve para saltear en la dirección correcta:
  // volviendo atrás, un paso sin objetivo tiene que seguir yendo hacia atrás, o
  // los dos pasos se rebotarían la pelota para siempre.
  const sentidoRef = useRef(1)
  // Se pregunta una sola vez, al montar: nadie cambia esa preferencia del
  // sistema mientras mira un recorrido de dos minutos, y `useState` con la
  // función de inicio es lo que evita consultar el media query en cada render.
  const [directo] = useState(sinMovimiento)

  const paso = pasos[indice]
  // El que se dibuja. Todo lo de la tarjeta —el texto, la pista, los botones,
  // el contador— sale de acá y no de `paso`, para que nada de lo que se lee
  // hable de una pieza que el recorte todavía no señala.
  const pasoVisible = pasos[mostrado.i]
  const ultimo = indice === pasos.length - 1
  const ultimoVisible = mostrado.i === pasos.length - 1
  // El paso actual, para los listeners que se montan una sola vez y no pueden
  // tenerlo como dependencia (ver el del teclado).
  const pasoRef = useRef(paso)
  pasoRef.current = paso

  const yaHecho = hechos.includes(pasoVisible.clave)
  // Un paso pide algo solo si lo que hay que tocar está en pantalla.
  const interactivo = Boolean(pasoVisible.accion && vista?.accion)
  const esperando = interactivo && !yaHecho

  const terminar = onClose

  const mover = useCallback(
    (sentido) => {
      sentidoRef.current = sentido
      setIndice((i) => {
        const siguiente = i + sentido
        if (siguiente < 0 || siguiente >= pasos.length) return i
        return siguiente
      })
    },
    [pasos],
  )

  const siguiente = useCallback(() => {
    if (ultimo) terminar()
    else mover(1)
  }, [ultimo, mover, terminar])

  const anterior = useCallback(() => mover(-1), [mover])

  // Un paso que no encontró su objetivo sigue de largo en el sentido en el que
  // se venía. Si no queda ninguno hacia ese lado, el tour termina.
  const saltear = useCallback(() => {
    const sentido = sentidoRef.current
    const destino = indice + sentido
    if (destino < 0 || destino >= pasos.length) terminar()
    else setIndice(destino)
  }, [indice, pasos, terminar])

  // Los efectos de abajo se montan una vez por paso y no una vez por render, y
  // para eso las acciones tienen que entrar por una ref. Con las funciones como
  // dependencia bastaba que quien monta el tour pasara un `onClose` inline para
  // que se rearmaran en cada cuadro del viaje del recorte: el bucle se
  // reiniciaría solo, el plazo de espera nunca se cumpliría y el
  // `scrollIntoView` del paso saldría sesenta veces por segundo.
  const acciones = useRef({})
  acciones.current = { saltear, terminar, siguiente, anterior }

  // Cada paso pide su pantalla antes de buscar nada: la mayoría de los objetivos
  // no existen hasta que la página que los contiene está montada. Va una vez por
  // paso —y por eso `onIr` entra por la ref, ver arriba—: pedirla en cada render
  // volvería a mandar el foco de sección de Configuración una y otra vez, y esa
  // pantalla lo consume y lo suelta, así que serían dos estados peloteándose.
  const irRef = useRef(onIr)
  irRef.current = onIr
  useEffect(() => {
    irRef.current(paso)
  }, [paso])

  // El bucle: mide el objetivo, acerca el recorte y reubica la tarjeta. Corre
  // mientras dura el paso y no una sola vez, porque abajo del velo la app sigue
  // viva —una sección de la barra que se despliega, la ventana que cambia de
  // tamaño, el scroll que acomoda el objetivo, la fila que aparece cuando entra
  // un mensaje— y el agujero tiene que quedar donde está la pieza y no donde
  // estaba al entrar. Cuando ya llegó, el estado deja de cambiar y React no
  // vuelve a dibujar aunque el bucle siga.
  useEffect(() => {
    let vivo = true
    let raf = 0
    let encontrado = false
    let enfocado = false
    const limite = performance.now() + ESPERA_MAX_MS
    // De dónde sale el viaje de este paso y cuándo arrancó. `desde` es donde
    // quedó el recorte del paso anterior; en el primero no hay ninguno y el
    // agujero aparece directamente en su lugar, sin viajar desde una esquina.
    const desde = cajaRef.current
    let inicio = 0
    // El cuadro en el que este paso pasa a ser el que muestra la tarjeta: el
    // primero que ya tiene dónde dibujar el agujero. Uno solo por paso.
    let anunciado = false

    const cuadro = () => {
      if (!vivo) return

      const el = buscar(paso.target)

      if (paso.target && !el) {
        // Saltear es para el objetivo que **nunca** apareció: en esta app, en
        // este estado, esa pieza no existe. Una que apareció y después se fue es
        // otra cosa —y es lo normal en los pasos que piden tocar algo que abre
        // otra pantalla: el botón "Nuevo agente" se lleva puesta la lista
        // entera—. Ahí el recorte se queda donde estaba hasta que el paso
        // cambie, que es un cuadro después; sin esta distinción el paso se
        // salteaba en el acto por haberse cumplido, sin la tilde y sin el
        // festejo, que es exactamente el acuse que hacía falta dar.
        if (!encontrado && performance.now() > limite) {
          vivo = false
          acciones.current.saltear()
          return
        }
        raf = requestAnimationFrame(cuadro)
        return
      }

      if (el && !encontrado) {
        encontrado = true
        // 'nearest' y no 'center': alcanza con que la pieza entre en pantalla, y
        // centrarla mueve la página entera aunque ya estuviera a la vista.
        el.scrollIntoView({
          block: 'nearest',
          inline: 'nearest',
          behavior: directo ? 'auto' : 'smooth',
        })
      }

      // El reloj del viaje arranca en el primer cuadro con objetivo a la vista
      // y no al montar el paso: lo que se espera mientras la página se arma no
      // es parte de la animación, y contándolo el recorte llegaría de golpe
      // justo en los pasos que cambian de pantalla.
      const ahora = performance.now()
      if (!inicio) inicio = ahora

      if (!anunciado) {
        anunciado = true
        setMostrado({ i: indice, sentido: sentidoRef.current })
      }

      const destino = el ? recuadroDe(el) : enElCentro()
      const avance = suavizar(Math.min(1, (ahora - inicio) / DUR_VIAJE_MS))
      const caja = !desde || directo || avance >= 1 ? destino : mezclar(desde, destino, avance)
      cajaRef.current = caja

      // La pieza que hay que tocar se mide en cada cuadro igual que el objetivo,
      // y por el mismo motivo: la fila de la barra se corre cuando se pliega una
      // sección, y el cuadro de escribir crece con el texto que se le mete.
      const elAccion = elDeAccion(paso)
      const accion = elAccion ? recuadroDe(elAccion, AIRE_ANILLO) : null

      // Pedir que se escriba en un cuadro que hay que ir a buscar con el mouse
      // son dos cosas. El foco va una sola vez por paso, cuando el campo
      // aparece, y sin mover el scroll: de eso ya se ocupó el objetivo.
      // `disabled` cuenta como todavía no estar: el cuadro de la prueba de un
      // agente se habilita recién cuando el agente existe, y el paso que pide
      // escribir ahí viene justo detrás del que lo crea. Marcarlo enfocado
      // mientras estaba apagado gastaba el único intento que hay por paso.
      if (elAccion && !enfocado && !elAccion.disabled && paso.accion.tipo === 'escribir') {
        enfocado = true
        elAccion.focus({ preventScroll: true })
      }

      const alto = tarjetaRef.current?.offsetHeight ?? 200
      const lado = el ? elegirLado(destino, alto, paso.lado) : null
      const tarjeta = ubicarTarjeta(el ? caja : null, alto, lado)
      setVista((prev) => (mismaVista(prev, caja, tarjeta, accion) ? prev : { caja, tarjeta, accion }))

      raf = requestAnimationFrame(cuadro)
    }

    cuadro()
    return () => {
      vivo = false
      cancelAnimationFrame(raf)
    }
  }, [paso, indice, directo])

  // Lo que convierte al recorrido en algo que se hace y no que se mira: mirar la
  // app de abajo hasta que pase lo que el paso pidió.
  //
  // Los dos escuchan **en `document` y en captura**, no en el elemento: el
  // objetivo se remonta solo (React redibuja la fila al cambiar el filtro, y la
  // lista entera cuando llega un mensaje), y un listener colgado del nodo se
  // quedaría pegado a un elemento que ya no está en la pantalla.
  //
  // Un paso ya cumplido no vuelve a escuchar: volviendo atrás, cada click
  // dispararía el festejo de nuevo y el recorrido se iría solo para adelante.
  useEffect(() => {
    if (!paso.accion || hechos.includes(paso.clave)) return

    const dentro = (nodo) =>
      nodo instanceof Node &&
      elementosDeAccion(paso).some((el) => el === nodo || el.contains(nodo))

    const cumplir = () => {
      setHechos((prev) => (prev.includes(paso.clave) ? prev : [...prev, paso.clave]))
      setFestejando(paso.clave)
    }

    const alClick = (e) => {
      if (paso.accion.tipo === 'click' && dentro(e.target)) cumplir()
    }
    // Dos caracteres y no uno: con uno solo la tilde aparece antes de que la
    // persona haya terminado de escribir la primera palabra, y el paso se va
    // solo mientras todavía está tipeando.
    const alEscribir = (e) => {
      if (paso.accion.tipo !== 'escribir') return
      if (dentro(e.target) && (e.target.value ?? '').trim().length >= 2) cumplir()
    }

    document.addEventListener('click', alClick, true)
    document.addEventListener('input', alEscribir, true)
    return () => {
      document.removeEventListener('click', alClick, true)
      document.removeEventListener('input', alEscribir, true)
    }
  }, [paso, hechos])

  // La tilde queda un momento en pantalla y recién ahí sigue el recorrido. El
  // festejo se apaga antes de mover: si quedara puesto, volver atrás a ese paso
  // lo haría auto-avanzar otra vez y no habría forma de quedarse mirándolo.
  useEffect(() => {
    if (festejando !== paso.clave) return
    const id = setTimeout(
      () => {
        setFestejando(null)
        if (!ultimo) mover(1)
      },
      directo ? 200 : FESTEJO_MS,
    )
    return () => clearTimeout(id)
  }, [festejando, paso.clave, ultimo, mover, directo])

  // Escape sale, las flechas caminan. Un tour que solo se puede recorrer con el
  // mouse obliga a soltar el teclado en la única pantalla que enseña a usar la
  // app con el teclado.
  useEffect(() => {
    const alTeclado = (e) => {
      if (e.key === 'Escape') {
        acciones.current.terminar()
        e.preventDefault()
        return
      }
      // Escribiendo en un campo no hay atajos: el paso del composer pide
      // justamente eso, y ahí las flechas mueven el cursor y Enter es del
      // cuadro (que además se lo come el listener de abajo).
      const enCampo =
        e.target instanceof HTMLElement &&
        (e.target.closest('input, textarea, select') || e.target.isContentEditable)
      if (enCampo) return
      // Enter no cuenta cuando el foco está en un botón del propio tour: ahí el
      // navegador ya lo convierte en un click, y sumarle este atajo haría que
      // "Atrás" caminara para los dos lados en la misma tecla.
      const enBoton = e.target instanceof HTMLElement && e.target.closest('button')
      if (e.key === 'ArrowRight' || (e.key === 'Enter' && !enBoton)) acciones.current.siguiente()
      else if (e.key === 'ArrowLeft') acciones.current.anterior()
      else return
      e.preventDefault()
    }

    // El Enter de los pasos marcados con `cortaEnter` se lo come el tour, y va
    // en captura para llegar antes que el `onKeyDown` del composer. Probar a
    // escribir es parte del recorrido; que ese "hola" de prueba le salga a un
    // cliente de verdad, no. Es lo que permite pedir la acción sin ninguna
    // advertencia al lado, y lo que deja el texto escrito ahí para cuando el
    // tour termine.
    //
    // La marca es del paso y no de todos los que piden escribir: la prueba de un
    // agente no manda nada a ningún lado —ni conversación, ni mensaje, ni día—,
    // así que ahí cortar el Enter sería impedir justo lo que se está enseñando.
    const alTecladoCaptura = (e) => {
      if (e.key !== 'Enter' || e.shiftKey) return
      const actual = pasoRef.current
      if (!actual?.accion?.cortaEnter) return
      if (e.target === elDeAccion(actual)) {
        e.preventDefault()
        e.stopPropagation()
      }
    }

    const overflowPrevio = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', alTecladoCaptura, true)
    document.addEventListener('keydown', alTeclado)
    return () => {
      document.body.style.overflow = overflowPrevio
      document.removeEventListener('keydown', alTecladoCaptura, true)
      document.removeEventListener('keydown', alTeclado)
    }
  }, [])

  // El foco va a la tarjeta apenas hay algo dibujado y una sola vez: es lo que
  // hace que un lector de pantalla lea el paso en vez de seguir parado en el
  // botón que abrió el recorrido, y que el Tab siguiente caiga adentro del
  // tour. Va con `tabIndex={-1}`, así el anillo de foco no se dibuja (la regla
  // de `index.css` deja afuera justamente ese valor).
  useEffect(() => {
    if (vista) tarjetaRef.current?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Boolean(vista)])

  // Hasta la primera medición no hay dónde dibujar el agujero. Un velo entero
  // por un cuadro se ve como un parpadeo negro, así que no se dibuja nada.
  if (!vista) return null

  const { caja, tarjeta, accion } = vista
  const { Icono } = pasoVisible
  const festejo = festejando === pasoVisible.clave

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('tour.aria')}
      // El contenedor deja pasar los clicks y cada pieza se los queda si los
      // necesita (ver `marco`). Lo que se puede tocar es lo que dibuja el tour y,
      // en los pasos que piden algo, lo que quedó adentro del recorte.
      className="pointer-events-none fixed inset-0 z-[60]"
    >
      {interactivo ? (
        marco(caja).map((r, i) => <div key={i} className="pointer-events-auto absolute" style={r} />)
      ) : (
        <div className="pointer-events-auto absolute inset-0" />
      )}

      {/* El velo es la sombra de este elemento, no un div aparte: así el
          agujero y lo que lo rodea son la misma pieza y no hay forma de que se
          desincronicen. El anillo va en su propio elemento —y no en una segunda
          sombra de este— porque en los pasos con acción late, y una animación
          sobre `box-shadow` se llevaría puesta también la sombra de 9999px que
          hace de velo. */}
      <div
        className="absolute rounded-2xl"
        style={{
          left: caja.left,
          top: caja.top,
          width: caja.width,
          height: caja.height,
          boxShadow: '0 0 0 9999px var(--scrim)',
        }}
      />

      {/* Sin objetivo no va el anillo: el agujero mide cero, y un contorno de
          2px alrededor de la nada es un puntito violeta en el medio de la
          pantalla. Ahí queda el velo liso, que es lo que corresponde.

          Cuando adentro hay una pieza esperando que la toquen, este anillo se
          hace fino y se apaga: dos contornos del mismo color y del mismo peso,
          uno adentro del otro, no señalan nada. */}
      {pasoVisible.target && (
        <div
          className="absolute rounded-2xl"
          style={{
            left: caja.left,
            top: caja.top,
            width: caja.width,
            height: caja.height,
            boxShadow: esperando
              ? '0 0 0 1px rgb(var(--violet) / 0.22)'
              : '0 0 0 2px rgb(var(--violet) / 0.5)',
          }}
        />
      )}

      {/* El anillo de la pieza que hay que tocar. Late mientras se la espera y
          se queda quieto cuando ya se la tocó: en un recorte que puede abarcar
          la barra entera, es lo único que dice cuál de las diez filas es. */}
      {accion && (
        <div
          className={`absolute rounded-xl ${esperando ? 'animate-invitar' : ''}`}
          // El anillo quieto va **siempre** en el estilo y el latido se le monta
          // encima: una animación le gana a la línea sin `!important`. Puesto
          // solo en el keyframe, quien pidió menos movimiento se quedaba sin
          // ningún anillo —la regla global de `index.css` corta la animación al
          // primer ciclo, y sin `forwards` el elemento vuelve a su estilo— o sea
          // que justo ahí desaparecía la única marca de qué hay que tocar.
          style={{
            left: accion.left,
            top: accion.top,
            width: accion.width,
            height: accion.height,
            boxShadow: '0 0 0 2px rgb(var(--violet) / 0.55)',
          }}
        >
          {/* El puntero se apoya en la esquina de abajo a la derecha, que es de
              donde viene la mano: adentro taparía justo el rótulo de la fila que
              se está pidiendo tocar. */}
          {esperando && (
            <span className="animate-tocar absolute -bottom-2.5 -right-2.5 flex size-6 items-center justify-center rounded-full bg-violet text-ink-inverted shadow-pop">
              <IconPointer size={13} />
            </span>
          )}
        </div>
      )}

      {/* El destello de llegada. Se remonta en cada paso (`key`), así que se ve
          una vez y se apaga: no es un latido de fondo, es el punto final del
          viaje del recorte. Y va retrasado lo que dura el viaje —el `backwards`
          de la utilidad lo deja invisible hasta entonces—, para que suene
          cuando el agujero llega y no mientras todavía está en camino. */}
      {pasoVisible.target && (
        <div
          key={pasoVisible.clave}
          className="animate-foco absolute rounded-2xl"
          style={{
            left: caja.left,
            top: caja.top,
            width: caja.width,
            height: caja.height,
            '--d': `${DUR_VIAJE_MS}ms`,
          }}
        />
      )}

      <div
        ref={tarjetaRef}
        tabIndex={-1}
        // La tarjeta no se remonta al cambiar de paso: viaja con el recorte y lo
        // que cambia adentro es el texto. Remontada, cada paso la haría
        // aparecer de la nada en otro lugar de la pantalla, y con eso se pierde
        // lo único que ata un paso con el siguiente.
        className="animate-scale-in pointer-events-auto absolute overflow-hidden rounded-2xl border border-tint/10 bg-surface-raised shadow-pop"
        style={{ left: tarjeta.left, top: tarjeta.top, width: ANCHO_TARJETA }}
      >
        {/* Un hilo de acento cruzando el borde de arriba. Es lo único que
            distingue a la tarjeta del tour de cualquier otra tarjeta de la app,
            y alcanza: el acento es el color que en esta dashboard señala. */}
        <span className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-violet/60 to-transparent" />

        <div className="flex items-center gap-2 px-5 pt-4">
          <span className="rounded-full bg-tint/[0.06] px-2.5 py-1 text-[11.5px] font-medium tabular-nums text-ink-muted">
            {t('tour.progreso', { n: mostrado.i + 1, total: pasos.length })}
          </span>
          {esperando && (
            <span className="animate-pop-in flex items-center gap-1 rounded-full bg-violet-soft px-2.5 py-1 text-[11.5px] font-semibold text-violet">
              <IconPointer size={12} />
              {t('tour.tuTurno')}
            </span>
          )}
          {festejo && (
            <span className="animate-pop-in flex items-center gap-1 rounded-full bg-status-good/[0.15] px-2.5 py-1 text-[11.5px] font-semibold text-status-good">
              <IconCheck size={12} />
              {t('tour.hecho')}
            </span>
          )}
          <button
            onClick={terminar}
            aria-label={t('tour.salir')}
            title={t('tour.salir')}
            className="-mr-1.5 ml-auto shrink-0 rounded-md p-1.5 text-ink-muted transition-colors duration-150 hover:bg-tint/[0.06] hover:text-ink-primary"
          >
            <IconClose size={15} />
          </button>
        </div>

        {/* El cuerpo cambia de alto entre pasos —los textos no miden lo mismo y la
            pista aparece y desaparece—, y ese cambio se anima en vez de saltar.
            El envoltorio lleva el alto medido y el recorte; adentro, el contenido
            se renueva entero. Sin esto la tarjeta pega un tirón vertical justo en
            el cuadro en que arranca a viajar, que es el momento en que más se ve.

            Solo el texto se renueva por paso, y entra **desde el lado del que
            viene el recorrido**: adelante entra por la derecha, atrás por la
            izquierda. Es la excepción a "lo que se mueve es la tarjeta y dos
            movimientos a la vez se pelean", y por un caso concreto: entre dos
            pasos vecinos —la barra y sus carpetas, dos filas más abajo— el
            recorte se corre treinta píxeles, y ahí un fundido a secas no alcanza
            para decir que pasó un paso, mucho menos hacia dónde. Son catorce
            píxeles y no le compite al viaje.

            El retraso es corto y no la mitad del viaje —el texto viejo se va con
            el cambio de paso, no se desvanece—, así que estirarlo deja la tarjeta
            volando vacía. */}
        <div
          className="overflow-hidden"
          style={{
            height: altoCuerpo ?? undefined,
            transition: `height ${DUR_CUERPO_MS}ms var(--ease-out-expo)`,
          }}
        >
          <div
            key={mostrado.i}
            ref={medirCuerpo}
            className={`px-5 pb-4 pt-3 ${
              mostrado.sentido >= 0 ? 'animate-fade-left' : 'animate-fade-right'
            }`}
            style={{ '--d': '140ms' }}
          >
            <div className="flex items-start gap-3">
              {/* La baldosa del ícono ubica el paso en la app —una casa, una
                  bandeja, un cuadro de escribir— antes de leer el título. */}
              <span className="mt-px flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet-soft text-violet">
                <Icono size={17} />
              </span>
              <div className="min-w-0">
                <h3 className="text-[16px] font-semibold tracking-[-0.01em] text-ink-primary">
                  {t(pasoVisible.titulo)}
                </h3>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-muted">
                  {t(pasoVisible.bajada)}
                </p>
              </div>
            </div>

            {/* Lo que hay que hacer va en su propio recuadro y no como un renglón
                más de la bajada: es lo único de la tarjeta que no se lee, se
                obedece. Punteado y en el acento, que es el mismo lenguaje del
                anillo que está latiendo del otro lado de la pantalla. */}
            {esperando && (
              <p className="mt-3.5 flex items-start gap-2.5 rounded-xl border border-dashed border-violet/40 bg-violet-soft px-3.5 py-2.5 text-[13px] leading-relaxed text-violet">
                <IconPointer size={14} className="mt-0.5 shrink-0" />
                {t(pasoVisible.accion.pista)}
              </p>
            )}
            {/* "Ya lo hiciste" es para cuando se vuelve atrás a un paso cumplido.
                En el momento de cumplirlo sería una respuesta rara a algo que se
                acaba de hacer, y encima ahí ya está la tilde del encabezado. */}
            {interactivo && yaHecho && !festejo && (
              <p className="mt-3.5 flex items-center gap-2.5 rounded-xl bg-status-good/[0.10] px-3.5 py-2.5 text-[13px] font-medium text-status-good">
                <IconCheck size={14} className="shrink-0" />
                {t('tour.loHiciste')}
              </p>
            )}

            {/* El final cuenta cuántas de las cosas que el recorrido pidió las hizo
                la persona. No es un puntaje: es lo que hace que el último paso no
                sea otro cartel de despedida, y lo único que se puede decir ahí que
                no se sabía al empezar. */}
            {ultimoVisible && hechos.length > 0 && (
              <p className="mt-3.5 flex items-center gap-2.5 rounded-xl bg-tint/[0.04] px-3.5 py-2.5 text-[13px] text-ink-secondary">
                <IconCheck size={14} className="shrink-0 text-status-good" />
                {t('tour.finalHechos', { n: hechos.length, total: conAccion(pasos) })}
              </p>
            )}
            {/* Lo que sigue después del recorrido es siempre lo mismo, así que el
                último paso lo ofrece en vez de nombrarlo. Cuál es depende del
                recorrido —después del general es conectar un canal, después del
                de armar un agente también, porque un agente sin canal no tiene a
                quién contestarle—, y por eso el destino viaja en el paso. */}
            {pasoVisible.cta && (
              <button
                onClick={() => {
                  irRef.current(pasoVisible.cta.ir)
                  terminar()
                }}
                className="mt-2.5 flex w-full items-center justify-between gap-2 rounded-xl border border-tint/[0.12] px-3 py-2.5 text-left text-[13.5px] font-medium text-ink-primary transition-colors duration-150 hover:border-tint/25 hover:bg-tint/[0.03]"
              >
                {t(pasoVisible.cta.texto)}
                <IconChevronRight size={15} className="shrink-0 text-ink-faint" />
              </button>
            )}
          </div>
        </div>

        {/* Cuánto falta, en un segmento por paso. Era una barra de 2px pegada al
            borde de abajo: decía la misma proporción sin decir de cuántos pasos
            se está hablando, que es justo lo que uno quiere saber cuando decide
            si lo hace ahora. Los pasos que se saltean por no tener su objetivo
            en pantalla pintan de a dos, que es exactamente lo que pasó. */}
        <div className="flex items-center gap-[3px] px-5">
          {pasos.map((p, i) => (
            <span
              key={p.clave}
              className={`h-[3px] flex-1 rounded-full transition-colors duration-300 ${
                i <= mostrado.i ? 'bg-violet' : 'bg-tint/[0.10]'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <Button variant="ghost" onClick={anterior} disabled={indice === 0}>
            <IconChevronRight size={14} className="rotate-180" />
            {t('tour.atras')}
          </Button>
          {/* Esperando una acción no hay botón de avanzar: si lo hubiera sería el
              camino corto y nadie tocaría nada. Queda la salida, en el tono más
              bajo que hay — nadie puede quedar encerrado en un paso porque la
              app todavía no tenga una conversación que abrir. */}
          {esperando ? (
            <Button variant="ghost" onClick={siguiente}>
              {t('tour.seguirSin')}
              <IconChevronRight size={14} />
            </Button>
          ) : (
            <Button onClick={siguiente}>
              {ultimoVisible ? t('tour.terminar') : t('tour.siguiente')}
              {!ultimoVisible && <IconChevronRight size={14} />}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
