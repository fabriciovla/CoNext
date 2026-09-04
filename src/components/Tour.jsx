import { useCallback, useEffect, useRef, useState } from 'react'
import Button from './ui/Button'
import { IconChevronRight, IconClose } from './ui/icons'
import { useT } from '../lib/i18n.jsx'

// El recorrido guiado: el paso a paso que la bienvenida venía prometiendo y que
// hasta ahora no existía. No es un carrusel de capturas — se hace **sobre la
// app de verdad**: el tour navega solo entre las pantallas, y en cada paso
// recorta un agujero en el velo alrededor de la pieza de la que está hablando.
//
// Dos decisiones que sostienen todo lo demás:
//
// - **El objetivo se busca por `data-tour` y no por una clase ni por una ref.**
//   Una ref obligaría a que cada pieza de la app —la barra, la lista, el
//   composer, la ficha— le pase algo al tour hacia arriba, y con eso el tour
//   pasaría a estar metido adentro de seis componentes que no tienen nada que
//   ver entre sí. Con el atributo, lo único que sabe la app del tour es una
//   palabra en un `div`.
// - **Un paso cuyo objetivo no aparece se saltea, no rompe.** La mitad de los
//   objetivos existen solo en ciertas condiciones: sin ninguna conversación no
//   hay hilo ni composer, y con el día cerrado el composer es un cartel. Un tour
//   que se traba esperando algo que no va a llegar es peor que uno más corto.
//
// El movimiento es uno solo: el recorte viaja de un objetivo al siguiente y la
// tarjeta viaja con él. No hay nada latiendo mientras se lee — el único destello
// es el anillo que se abre al aterrizar, que señala dónde quedó parado.

// Acá no hay ningún flag propio de "ya lo vio": quién ve esto la primera vez lo
// decide la bienvenida (`WelcomeTour.jsx`, que guarda el suyo) y volver a verlo
// lo pide la persona desde Configuración. Un segundo flag para lo mismo son dos
// lugares donde apagar la misma pantalla.
//
// Las claves van escritas enteras, igual que en la bienvenida: un
// `t('tour.' + paso.clave + 'Titulo')` no lo encuentra ningún grep, que es como
// se llega a un texto huérfano en el diccionario y a otro faltando en pantalla.
//
// El orden es el de la app y no el de la importancia: se entra por Inicio, se
// baja por la barra, se trabaja en la bandeja y recién al final se configura.
// `lado` es solo una preferencia — si de ese lado no entra, se ubica sola.
export const PASOS = [
  {
    clave: 'inicio',
    pagina: 'home',
    target: 'home-kpis',
    lado: 'abajo',
    titulo: 'tour.inicioTitulo',
    bajada: 'tour.inicioBajada',
  },
  {
    clave: 'barra',
    target: 'nav-secciones',
    lado: 'derecha',
    titulo: 'tour.barraTitulo',
    bajada: 'tour.barraBajada',
  },
  {
    clave: 'carpetas',
    target: 'nav-carpetas',
    lado: 'derecha',
    titulo: 'tour.carpetasTitulo',
    bajada: 'tour.carpetasBajada',
  },
  {
    clave: 'dia',
    target: 'nav-dia',
    lado: 'derecha',
    titulo: 'tour.diaTitulo',
    bajada: 'tour.diaBajada',
  },
  {
    clave: 'lista',
    pagina: 'inbox',
    target: 'inbox-lista',
    lado: 'derecha',
    titulo: 'tour.listaTitulo',
    bajada: 'tour.listaBajada',
  },
  {
    clave: 'hilo',
    pagina: 'inbox',
    target: 'inbox-hilo',
    lado: 'izquierda',
    titulo: 'tour.hiloTitulo',
    bajada: 'tour.hiloBajada',
  },
  {
    clave: 'composer',
    pagina: 'inbox',
    target: 'inbox-composer',
    lado: 'arriba',
    titulo: 'tour.composerTitulo',
    bajada: 'tour.composerBajada',
  },
  {
    clave: 'ficha',
    pagina: 'inbox',
    target: 'inbox-ficha',
    lado: 'izquierda',
    titulo: 'tour.fichaTitulo',
    bajada: 'tour.fichaBajada',
  },
  {
    clave: 'agentes',
    pagina: 'agents',
    target: 'agentes-nuevo',
    lado: 'abajo',
    titulo: 'tour.agentesTitulo',
    bajada: 'tour.agentesBajada',
  },
  {
    clave: 'canales',
    pagina: 'settings',
    seccion: 'canales',
    target: 'config-canales',
    lado: 'izquierda',
    titulo: 'tour.canalesTitulo',
    bajada: 'tour.canalesBajada',
  },
  // El último no señala nada y cae en el medio de la bandeja, que es donde se
  // trabaja: el tour termina dejando a la persona parada donde va a estar.
  {
    clave: 'final',
    pagina: 'inbox',
    titulo: 'tour.finalTitulo',
    bajada: 'tour.finalBajada',
  },
]

// Cuánto se espera a que aparezca el objetivo de un paso antes de darlo por
// inexistente y seguir. Alcanza para un cambio de página (que remonta el
// contenido) y para el salto de sección de Configuración, que es un efecto.
const ESPERA_MAX_MS = 1200
const AIRE_RECORTE = 8 // cuánto respira el agujero alrededor de la pieza
const ANCHO_TARJETA = 320
const AIRE_TARJETA = 14 // entre el borde del recorte y la tarjeta
const MARGEN = 16 // mínimo contra el borde de la pantalla
const LADOS = ['derecha', 'izquierda', 'abajo', 'arriba']

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

function recuadroDe(el) {
  const r = el.getBoundingClientRect()
  return {
    left: r.left - AIRE_RECORTE,
    top: r.top - AIRE_RECORTE,
    width: r.width + AIRE_RECORTE * 2,
    height: r.height + AIRE_RECORTE * 2,
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

function mismaVista(prev, caja, tarjeta) {
  if (!prev) return false
  return (
    prev.caja.left === caja.left &&
    prev.caja.top === caja.top &&
    prev.caja.width === caja.width &&
    prev.caja.height === caja.height &&
    prev.tarjeta.left === tarjeta.left &&
    prev.tarjeta.top === tarjeta.top
  )
}

export default function Tour({ onIr, onClose }) {
  const t = useT()
  const [indice, setIndice] = useState(0)
  const [vista, setVista] = useState(null)
  const cajaRef = useRef(null)
  const tarjetaRef = useRef(null)
  // Hacia dónde se estaba yendo. Sirve para saltear en la dirección correcta:
  // volviendo atrás, un paso sin objetivo tiene que seguir yendo hacia atrás, o
  // los dos pasos se rebotarían la pelota para siempre.
  const sentidoRef = useRef(1)
  // Se pregunta una sola vez, al montar: nadie cambia esa preferencia del
  // sistema mientras mira un recorrido de dos minutos, y `useState` con la
  // función de inicio es lo que evita consultar el media query en cada render.
  const [directo] = useState(sinMovimiento)

  const paso = PASOS[indice]
  const ultimo = indice === PASOS.length - 1

  const terminar = onClose

  const mover = useCallback((sentido) => {
    sentidoRef.current = sentido
    setIndice((i) => {
      const siguiente = i + sentido
      if (siguiente < 0 || siguiente >= PASOS.length) return i
      return siguiente
    })
  }, [])

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
    if (destino < 0 || destino >= PASOS.length) terminar()
    else setIndice(destino)
  }, [indice, terminar])

  // Los dos efectos de abajo se montan una vez por paso y no una vez por
  // render, y para eso las acciones tienen que entrar por una ref. Con las
  // funciones como dependencia bastaba que quien monta el tour pasara un
  // `onClose` inline para que se rearmaran en cada cuadro del viaje del
  // recorte: el bucle se reiniciaría solo, el plazo de espera nunca se
  // cumpliría y el `scrollIntoView` del paso saldría sesenta veces por segundo.
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
  // tamaño, el scroll que acomoda el objetivo— y el agujero tiene que quedar
  // donde está la pieza y no donde estaba al entrar. Cuando ya llegó, el estado
  // deja de cambiar y React no vuelve a dibujar aunque el bucle siga.
  useEffect(() => {
    let vivo = true
    let raf = 0
    let encontrado = false
    const limite = performance.now() + ESPERA_MAX_MS
    // De dónde sale el viaje de este paso y cuándo arrancó. `desde` es donde
    // quedó el recorte del paso anterior; en el primero no hay ninguno y el
    // agujero aparece directamente en su lugar, sin viajar desde una esquina.
    const desde = cajaRef.current
    let inicio = 0

    const cuadro = () => {
      if (!vivo) return

      const el = paso.target ? document.querySelector(`[data-tour="${paso.target}"]`) : null

      if (paso.target && !el) {
        if (performance.now() > limite) {
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

      const destino = el ? recuadroDe(el) : enElCentro()
      const avance = suavizar(Math.min(1, (ahora - inicio) / DUR_VIAJE_MS))
      const caja = !desde || directo || avance >= 1 ? destino : mezclar(desde, destino, avance)
      cajaRef.current = caja

      const alto = tarjetaRef.current?.offsetHeight ?? 180
      const lado = el ? elegirLado(destino, alto, paso.lado) : null
      const tarjeta = ubicarTarjeta(el ? caja : null, alto, lado)
      setVista((prev) => (mismaVista(prev, caja, tarjeta) ? prev : { caja, tarjeta }))

      raf = requestAnimationFrame(cuadro)
    }

    cuadro()
    return () => {
      vivo = false
      cancelAnimationFrame(raf)
    }
  }, [paso, directo])

  // Escape sale, las flechas caminan. Un tour que solo se puede recorrer con el
  // mouse obliga a soltar el teclado en la única pantalla que enseña a usar la
  // app con el teclado.
  useEffect(() => {
    const alTeclado = (e) => {
      // Enter no cuenta cuando el foco está en un botón del propio tour: ahí el
      // navegador ya lo convierte en un click, y sumarle este atajo haría que
      // "Atrás" caminara para los dos lados en la misma tecla.
      const enBoton = e.target instanceof HTMLElement && e.target.closest('button')
      if (e.key === 'Escape') acciones.current.terminar()
      else if (e.key === 'ArrowRight' || (e.key === 'Enter' && !enBoton))
        acciones.current.siguiente()
      else if (e.key === 'ArrowLeft') acciones.current.anterior()
      else return
      e.preventDefault()
    }
    const overflowPrevio = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', alTeclado)
    return () => {
      document.body.style.overflow = overflowPrevio
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

  const { caja, tarjeta } = vista

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('tour.aria')}
      // El contenedor se come los clicks: abajo del velo la app está viva y un
      // click perdido en la barra cambiaría de página en medio de un paso. Lo
      // que se puede tocar es lo que dibuja el tour.
      className="fixed inset-0 z-[60]"
    >
      {/* El velo es la sombra de este elemento, no un div aparte: así el
          agujero y lo que lo rodea son la misma pieza y no hay forma de que se
          desincronicen. El anillo va primero en la lista para quedar dibujado
          arriba de la sombra grande. */}
      <div
        className="pointer-events-none absolute rounded-2xl"
        style={{
          left: caja.left,
          top: caja.top,
          width: caja.width,
          height: caja.height,
          // Sin objetivo no va el anillo: el agujero mide cero, y un contorno de
          // 2px alrededor de la nada es un puntito violeta en el medio de la
          // pantalla. Ahí queda el velo liso, que es lo que corresponde.
          boxShadow: paso.target
            ? '0 0 0 2px rgb(var(--violet) / 0.5), 0 0 0 9999px var(--scrim)'
            : '0 0 0 9999px var(--scrim)',
        }}
      />

      {/* El destello de llegada. Se remonta en cada paso (`key`), así que se ve
          una vez y se apaga: no es un latido de fondo, es el punto final del
          viaje del recorte. Y va retrasado lo que dura el viaje —el `backwards`
          de la utilidad lo deja invisible hasta entonces—, para que suene
          cuando el agujero llega y no mientras todavía está en camino. */}
      {paso.target && (
        <div
          key={paso.clave}
          className="animate-foco pointer-events-none absolute rounded-2xl"
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
        className="animate-scale-in absolute rounded-xl border border-tint/10 bg-surface-raised shadow-pop"
        style={{ left: tarjeta.left, top: tarjeta.top, width: ANCHO_TARJETA }}
      >
        <div className="flex items-start justify-between gap-2 px-4 pt-3">
          <span className="text-[11px] font-medium tabular-nums text-ink-faint">
            {t('tour.progreso', { n: indice + 1, total: PASOS.length })}
          </span>
          <button
            onClick={terminar}
            aria-label={t('tour.salir')}
            title={t('tour.salir')}
            className="-mr-1.5 -mt-1 shrink-0 rounded-md p-1.5 text-ink-muted transition-colors duration-150 hover:bg-tint/[0.06] hover:text-ink-primary"
          >
            <IconClose size={14} />
          </button>
        </div>

        {/* Solo el texto se renueva por paso, y entra con un fundido apenas
            retrasado: lo que se mueve es la tarjeta, y dos movimientos a la vez
            se pelean. El retraso es corto y no la mitad del viaje —el texto
            viejo se va con el cambio de paso, no se desvanece—, así que estirarlo
            deja la tarjeta volando vacía. */}
        <div key={indice} className="animate-fade-in px-4 pb-3.5 pt-1.5" style={{ '--d': '140ms' }}>
          <h3 className="text-[14px] font-semibold tracking-[-0.01em] text-ink-primary">
            {t(paso.titulo)}
          </h3>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-muted">{t(paso.bajada)}</p>
        </div>

        {/* La barra dice cuánto falta sin ocupar un renglón. Los pasos que se
            saltean por no tener su objetivo en pantalla la hacen avanzar de a
            dos, que es exactamente lo que pasó. */}
        <div className="h-[2px] w-full overflow-hidden bg-tint/[0.08]">
          <div
            className="h-full bg-violet transition-[width] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{ width: `${((indice + 1) / PASOS.length) * 100}%` }}
          />
        </div>

        <div className="flex items-center justify-between gap-2 px-3 py-2.5">
          <Button size="sm" variant="ghost" onClick={anterior} disabled={indice === 0}>
            <IconChevronRight size={13} className="rotate-180" />
            {t('tour.atras')}
          </Button>
          <Button size="sm" onClick={siguiente}>
            {ultimo ? t('tour.terminar') : t('tour.siguiente')}
            {!ultimo && <IconChevronRight size={13} />}
          </Button>
        </div>
      </div>
    </div>
  )
}
