import { useEffect, useRef, useState } from 'react'
import PageHeader from '../components/PageHeader'
import Button from '../components/ui/Button'
import Select from '../components/ui/Select'
import SettingCard from '../components/ui/SettingCard'
import { IconCheck, IconChevronDown, IconCopy, IconMoon, IconSun } from '../components/ui/icons'
import WhatsappConnection from '../components/WhatsappConnection'
import MetaConnection from '../components/MetaConnection'
import { weekDays } from '../data/mockData'
import { formatPhone } from '../utils/phone'
import { storeSchedule } from '../utils/metrics'
import { IDIOMAS, useIdioma } from '../lib/i18n.jsx'

// Configuración es una lista de ajustes, no un formulario largo: una tarjeta
// por cosa que se cambia, y una columna a la izquierda para saltar entre grupos
// sin scrollear la página entera. Es la forma de la consola de Vercel y está
// copiada a propósito — apilado en un solo scroll, el horario y los mensajes de
// la IA quedaban a media página de los canales, y no había forma de mandar a
// alguien "a la sección tal".
//
// Cada tarjeta guarda lo suyo y nada más. La página no tiene un borrador
// global: lo que se escribe se confirma con su botón (y se descarta cambiando
// de sección), y lo que se elige de una lista —los días, el tema— se manda al
// tocarlo, porque ahí no hay nada a medio escribir que confirmar. La franja de
// abajo de cada tarjeta dice cuál de las dos cosas es.

// El rótulo sale del diccionario por la misma clave, así que sumar una sección
// es una entrada acá, su bloque en el render y su texto en `textos/config.js`.
const SECCIONES = ['general', 'canales', 'horario', 'respuestas', 'apariencia']

// Los idiomas en los que la IA le puede escribir al cliente. Las claves son las
// mismas que valida el server (`server/src/services/ai/idioma.js`): si acá se
// agrega una que allá no está, el PUT la descarta y se queda la anterior.
//
// Los nombres se traducen —en la dashboard en inglés dice "Spanish", no
// "Español"—, y por eso no salen de la lista de idiomas de la propia dashboard,
// que son solo dos y se nombran siempre en su propio idioma.
const IDIOMAS_IA = [
  { value: 'auto', clave: 'idiomaIAAuto', hint: 'idiomaIAAutoHint' },
  { value: 'es', clave: 'idiomaIAEspanol' },
  { value: 'en', clave: 'idiomaIAIngles' },
  { value: 'pt', clave: 'idiomaIAPortugues' },
]

const IDIOMA_IA_POR_DEFECTO = 'es'

// Las zonas que puede elegir un cliente de acá. No es la lista entera de IANA
// —son cuatrocientas y pico— sino las que se van a usar de verdad; cualquier
// otra entra igual por la base, porque el server valida contra Intl y no contra
// esta lista.
const ZONAS = [
  { value: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires' },
  { value: 'America/Argentina/Cordoba', label: 'Córdoba' },
  { value: 'America/Argentina/Mendoza', label: 'Mendoza' },
  { value: 'America/Argentina/Tucuman', label: 'Tucumán' },
  { value: 'America/Argentina/Salta', label: 'Salta' },
  { value: 'America/Montevideo', label: 'Montevideo' },
  { value: 'America/Santiago', label: 'Santiago de Chile' },
  { value: 'America/Asuncion', label: 'Asunción' },
  { value: 'America/Sao_Paulo', label: 'São Paulo' },
  { value: 'America/Bogota', label: 'Bogotá' },
  { value: 'America/Lima', label: 'Lima' },
  { value: 'America/Mexico_City', label: 'Ciudad de México' },
  { value: 'Europe/Madrid', label: 'Madrid' },
]

const ZONA_POR_DEFECTO = 'America/Argentina/Buenos_Aires'

// El desfase se pregunta y no se escribe al lado de cada zona: con el horario
// de verano, una tabla de "GMT-3" hecha a mano queda mal medio año.
function desfase(zona, locale) {
  try {
    return (
      new Intl.DateTimeFormat(locale, { timeZone: zona, timeZoneName: 'shortOffset' })
        .formatToParts(new Date())
        .find((p) => p.type === 'timeZoneName')?.value ?? ''
    )
  } catch {
    return ''
  }
}

function horaEn(zona, locale) {
  try {
    return new Intl.DateTimeFormat(locale, {
      timeZone: zona,
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date())
  } catch {
    return ''
  }
}

function horariosDe(settings) {
  const guardados = settings.weeklyHours ?? {}
  if (Object.keys(guardados).length > 0) {
    return Object.fromEntries(weekDays.map((day) => [day, guardados[day] ?? null]))
  }

  const abiertos = new Set(settings.daysOpen ?? [])
  return Object.fromEntries(
    weekDays.map((day) => [
      day,
      abiertos.has(day)
        ? {
            openTime: settings.openTime || '09:00',
            closeTime: settings.closeTime || '18:00',
          }
        : null,
    ]),
  )
}

const ESTADO_HORARIO = {
  abierto: 'inicio.horarioAtendiendo',
  'antes-de-abrir': 'inicio.horarioNoAbriste',
  'ya-cerro': 'inicio.horarioFuera',
  'no-laborable': 'inicio.horarioNoLaborable',
}

const HORAS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTOS = ['00', '15', '30', '45']

function partesDe(hhmm) {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(hhmm ?? ''))
  if (!m) return { hh: '09', mm: '00' }
  return { hh: m[1].padStart(2, '0'), mm: m[2] }
}

// Selector propio: el `input type="time"` lo dibuja el sistema y no hay forma
// de vestirlo. Acá la hora se elige en una grilla (las 24) y los minutos en
// cuartos: se ve entero, sin el reloj nativo ni un desplegable de 96 filas.
function TimePicker({ value, onChange, ariaLabel }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState(null)
  const triggerRef = useRef(null)
  const { hh, mm } = partesDe(value)
  const minutos = MINUTOS.includes(mm) ? MINUTOS : [...MINUTOS, mm].sort()

  const abrir = () => {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (!rect) return
    const alto = 248
    const ancho = 280
    const haciaArriba = rect.bottom + alto > window.innerHeight - 8
    const left = Math.min(rect.left, window.innerWidth - ancho - 8)
    setPos(
      haciaArriba
        ? { left, bottom: window.innerHeight - rect.top + 6 }
        : { left, top: rect.bottom + 6 },
    )
    setOpen(true)
  }

  const cerrar = () => setOpen(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') {
        cerrar()
        triggerRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => (open ? cerrar() : abrir())}
        className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[13px] font-medium tabular-nums
          transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet/30
          ${
            open
              ? 'border-violet/60 bg-violet-soft text-violet'
              : 'border-tint/[0.1] bg-tint/[0.03] text-ink-primary hover:border-tint/25'
          }`}
      >
        {hh}:{mm}
        <IconChevronDown
          size={12}
          className={`text-ink-faint transition-transform duration-200 ${open ? 'rotate-180 text-violet' : ''}`}
        />
      </button>

      {open && pos && (
        <>
          {/* Fijo al viewport: la tarjeta recorta con overflow-hidden, y un
              `absolute` nacería cortado por el borde redondeado. */}
          <div className="fixed inset-0 z-20" onClick={cerrar} />
          <div
            role="dialog"
            aria-label={ariaLabel}
            className="animate-scale-in fixed z-30 w-[17.5rem] rounded-xl border border-tint/10 bg-surface-raised p-2.5 shadow-pop"
            style={pos}
          >
            <div className="grid grid-cols-6 gap-0.5">
              {HORAS.map((h) => {
                const activa = h === hh
                return (
                  <button
                    key={h}
                    type="button"
                    onClick={() => onChange(`${h}:${mm}`)}
                    className={`h-8 rounded-md text-[12.5px] tabular-nums transition-colors duration-100
                      ${
                        activa
                          ? 'bg-violet-soft font-medium text-violet'
                          : 'text-ink-secondary hover:bg-tint/[0.06] hover:text-ink-primary'
                      }`}
                  >
                    {h}
                  </button>
                )
              })}
            </div>
            <div className="mt-2 grid grid-cols-4 gap-0.5">
              {minutos.map((m) => {
                const activa = m === mm
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      onChange(`${hh}:${m}`)
                      setOpen(false)
                    }}
                    className={`h-8 rounded-md text-[12.5px] tabular-nums transition-colors duration-100
                      ${
                        activa
                          ? 'bg-violet-soft font-medium text-violet'
                          : 'text-ink-secondary hover:bg-tint/[0.06] hover:text-ink-primary'
                      }`}
                  >
                    :{m}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function FilaDia({ day, horario, onToggle, onEditarHora, className = '' }) {
  const t = useIdioma().t
  const nombre = t(`dias.${day}`)
  return (
    <div className={`flex min-h-12 items-center gap-2.5 py-2 ${className}`}>
      {horario ? (
        <>
          <p className="w-[6.75rem] shrink-0 text-[13px] font-medium text-ink-primary">{nombre}</p>
          <TimePicker
            value={horario.openTime}
            ariaLabel={t('config.horaApertura', { dia: nombre })}
            onChange={(value) => onEditarHora('openTime', value)}
          />
          <span className="text-[12px] text-ink-faint">{t('config.a')}</span>
          <TimePicker
            value={horario.closeTime}
            ariaLabel={t('config.horaCierre', { dia: nombre })}
            onChange={(value) => onEditarHora('closeTime', value)}
          />
          <button
            type="button"
            onClick={onToggle}
            className="ml-auto text-[12px] text-ink-faint transition-colors duration-150 hover:text-ink-primary
              focus-visible:outline-none focus-visible:text-ink-primary"
          >
            {t('config.cerrar')}
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center gap-2.5 text-left focus-visible:outline-none focus-visible:text-ink-primary"
        >
          <span className="w-[6.75rem] shrink-0 text-[13px] text-ink-muted">{nombre}</span>
          <span className="text-[13px] text-ink-faint transition-colors duration-150 hover:text-ink-primary">
            {t('config.cerradoDia')}
          </span>
        </button>
      )}
    </div>
  )
}

// La columna de secciones. Abajo de `sm` no hay lugar para una columna, así que
// las mismas filas se acuestan en una tira que scrollea de costado — que es lo
// que hace cualquier app en un teléfono, y no un acordeón que esconde dónde
// está parado uno.
function NavConfig({ actual, onIr }) {
  const t = useIdioma().t
  return (
    <nav
      aria-label={t('config.secciones')}
      className="-mx-1 flex shrink-0 gap-1 overflow-x-auto px-1 pb-1 sm:mx-0 sm:w-48 sm:flex-col sm:overflow-visible sm:px-0 sm:pb-0"
    >
      {SECCIONES.map((seccion) => {
        const activa = seccion === actual
        return (
          <button
            key={seccion}
            type="button"
            aria-current={activa ? 'page' : undefined}
            onClick={() => onIr(seccion)}
            className={`shrink-0 rounded-lg px-2.5 py-2 text-left text-[13.5px] transition-colors duration-150
              ${
                activa
                  ? 'bg-tint/[0.09] font-medium text-ink-primary'
                  : 'text-ink-muted hover:bg-tint/[0.05] hover:text-ink-primary'
              }`}
          >
            {t(`config.seccion${seccion.charAt(0).toUpperCase()}${seccion.slice(1)}`)}
          </button>
        )
      })}
    </nav>
  )
}

const CAMPO = `w-full rounded-lg border border-tint/[0.12] bg-tint/[0.03] px-3 py-2 text-[13px] text-ink-primary
  placeholder:text-ink-faint transition-colors duration-150 hover:border-tint/25
  focus:border-violet/60 focus:outline-none focus:ring-1 focus:ring-violet/30`

// Una tarjeta con un campo de texto y su botón de guardar. El botón se enciende
// recién cuando lo escrito difiere de lo guardado: apagado es la única forma de
// decir "esto ya quedó así" sin escribir un cartel.
function TarjetaTexto({
  title,
  description,
  hint,
  valor,
  onGuardar,
  maxLength,
  placeholder,
  filas,
  requerido = false,
  contador = false,
}) {
  const [texto, setTexto] = useState(valor ?? '')
  const [guardado, setGuardado] = useState(false)
  // Lo último que se vio del server. Sirve para no pisar lo que se está
  // escribiendo en cada render, pero sí adoptar el valor que llega cuando
  // responde el GET (que arranca vacío y se completa después).
  const remoto = useRef(valor)
  const avisoTimer = useRef(null)
  const t = useIdioma().t

  useEffect(() => {
    if (remoto.current === valor) return
    remoto.current = valor
    setTexto(valor ?? '')
  }, [valor])

  useEffect(() => () => clearTimeout(avisoTimer.current), [])

  const limpio = texto.trim()
  const sucio = limpio !== String(valor ?? '').trim()
  const valido = !requerido || limpio.length > 0

  const guardar = () => {
    if (!sucio || !valido) return
    remoto.current = limpio
    setTexto(limpio)
    onGuardar(limpio)
    setGuardado(true)
    clearTimeout(avisoTimer.current)
    avisoTimer.current = setTimeout(() => setGuardado(false), 2400)
  }

  return (
    <SettingCard
      title={title}
      description={description}
      hint={
        guardado ? (
          <span className="animate-pop-in flex items-center gap-1.5 font-medium text-status-good">
            <IconCheck size={13} />
            {t('comun.guardado')}
          </span>
        ) : (
          hint
        )
      }
      action={
        <>
          {contador && (
            <span className="text-[11px] tabular-nums text-ink-faint">{texto.length}</span>
          )}
          <Button size="sm" variant="secondary" disabled={!sucio || !valido} onClick={guardar}>
            {t('comun.guardar')}
          </Button>
        </>
      }
    >
      {filas ? (
        <textarea
          rows={filas}
          aria-label={title}
          placeholder={placeholder}
          maxLength={maxLength}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          className={`${CAMPO} resize-none leading-relaxed`}
        />
      ) : (
        <input
          type="text"
          aria-label={title}
          placeholder={placeholder}
          maxLength={maxLength}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && guardar()}
          className={`${CAMPO} max-w-sm`}
        />
      )}
    </SettingCard>
  )
}

function BotonCopiar({ texto, ariaLabel }) {
  const [copiado, setCopiado] = useState(false)
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopiado(false), 1600)
    } catch {
      // Sin permiso de portapapeles no hay nada que hacer, y tampoco hay nada
      // roto: el dato está a la vista para copiarlo a mano.
    }
  }

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={copiar}
      className="shrink-0 rounded-md p-1.5 text-ink-faint transition-colors duration-150 hover:bg-tint/[0.06] hover:text-ink-primary"
    >
      {copiado ? <IconCheck size={14} className="text-status-good" /> : <IconCopy size={14} />}
    </button>
  )
}

export default function Settings({ settings, onUpdate, theme, onToggleTheme }) {
  const { t, idioma, setIdioma, locale } = useIdioma()
  const [seccion, setSeccion] = useState('general')
  const [zona, setZona] = useState(settings.timezone || ZONA_POR_DEFECTO)
  const zonaRemota = useRef(settings.timezone)

  // Igual que en los campos de texto: la zona elegida no se pisa mientras no se
  // guarde, pero sí adopta lo que llega del server la primera vez.
  useEffect(() => {
    if (zonaRemota.current === settings.timezone) return
    zonaRemota.current = settings.timezone
    setZona(settings.timezone || ZONA_POR_DEFECTO)
  }, [settings.timezone])

  const horarios = horariosDe(settings)
  const diasConfigurados = weekDays.filter((day) => horarios[day]).length
  const estadoHorario =
    diasConfigurados > 0 ? storeSchedule({ ...settings, weeklyHours: horarios }) : null

  const guardarHorarios = (cambios) => onUpdate({ weeklyHours: { ...horarios, ...cambios } })

  const toggleDay = (day) =>
    guardarHorarios({
      [day]: horarios[day]
        ? null
        : { openTime: settings.openTime || '09:00', closeTime: settings.closeTime || '18:00' },
    })

  const editarHora = (day, field, value) =>
    guardarHorarios({ [day]: { ...horarios[day], [field]: value } })

  const zonaGuardada = settings.timezone || ZONA_POR_DEFECTO
  const numero = settings.whatsappNumber ?? ''
  const idiomaIA = settings.aiLanguage || IDIOMA_IA_POR_DEFECTO
  const opcionesZona = ZONAS.map((z) => ({ ...z, hint: desfase(z.value, locale) }))
  // Una zona guardada que no esté en la lista corta (la puso el alta u otro
  // cliente) tiene que poder seguir elegida: sin esto el desplegable mostraría
  // el placeholder y guardar la cambiaría sin que nadie lo pidiera.
  if (zona && !opcionesZona.some((z) => z.value === zona)) {
    opcionesZona.unshift({ value: zona, label: zona, hint: desfase(zona, locale) })
  }

  return (
    // La columna entera va centrada, que es la única de la app que lo hace: es
    // un formulario angosto adentro de un layout de 1280, y pegado a la
    // izquierda deja un vacío del ancho de una tarjeta a la derecha. No rompe la
    // regla de que nada se centra —el texto y los títulos siguen alineados a la
    // izquierda adentro de la columna—, es dónde se apoya la columna.
    <div className="mx-auto max-w-[62rem]">
      <PageHeader title={t('config.titulo')} description={t('config.bajada')} />

      <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:gap-8">
        {/* La columna se queda a la vista mientras el contenido scrollea: con
            el horario abierto, la lista de secciones quedaba arriba de todo y
            había que volver para cambiar de grupo. */}
        <div className="sm:sticky sm:top-0 sm:self-start">
          <NavConfig actual={seccion} onIr={setSeccion} />
        </div>

        {/* La `key` remonta el contenido al cambiar de sección, y con eso vuelve
            a correr la entrada: sin ella el bloque se reemplaza en seco y no se
            lee que cambió toda la columna, solo que parpadeó. */}
        <div
          key={seccion}
          className="stagger animate-fade-in min-w-0 flex-1 space-y-4"
          style={{ '--stagger-base': '50ms' }}
        >
          {seccion === 'general' && (
            <>
              <TarjetaTexto
                title={t('config.nombreNegocio')}
                description={t('config.nombreNegocioDesc')}
                hint={t('config.nombreNegocioHint')}
                placeholder={t('config.nombreNegocioPlaceholder')}
                maxLength={40}
                requerido
                valor={settings.storeName}
                onGuardar={(storeName) => onUpdate({ storeName })}
              />

              <SettingCard
                title={t('config.zonaHoraria')}
                description={t('config.zonaHorariaDesc')}
                hint={
                  zona === zonaGuardada
                    ? t('config.zonaHorariaAhi', { hora: horaEn(zona, locale) })
                    : t('config.zonaHorariaCambio', { hora: horaEn(zona, locale) })
                }
                action={
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={zona === zonaGuardada}
                    onClick={() => {
                      zonaRemota.current = zona
                      onUpdate({ timezone: zona })
                    }}
                  >
                    {t('comun.guardar')}
                  </Button>
                }
              >
                <Select
                  value={zona}
                  options={opcionesZona}
                  onChange={setZona}
                  ariaLabel={t('config.zonaHorariaAria')}
                  className="max-w-sm"
                />
              </SettingCard>

              <SettingCard
                title={t('config.numeroWhatsapp')}
                description={t('config.numeroWhatsappDesc')}
                hint={numero ? t('config.numeroWhatsappHint') : t('config.numeroWhatsappSinHint')}
                action={
                  <Button size="sm" variant="secondary" onClick={() => setSeccion('canales')}>
                    {t('config.irACanales')}
                  </Button>
                }
              >
                {numero ? (
                  <div className="flex max-w-sm items-center gap-1 rounded-lg border border-tint/[0.12] bg-tint/[0.03] py-1.5 pl-3 pr-1.5">
                    <span className="min-w-0 flex-1 truncate text-[13px] tabular-nums text-ink-primary">
                      {formatPhone(numero)}
                    </span>
                    <BotonCopiar texto={numero} ariaLabel={t('config.copiarNumero')} />
                  </div>
                ) : (
                  <p className="text-[13px] text-ink-faint">{t('config.sinNumero')}</p>
                )}
              </SettingCard>
            </>
          )}

          {seccion === 'canales' && (
            // Los canales van en grilla y no apilados: son un catálogo de
            // servicios que se enganchan, y puestos al lado lo que se compara de
            // un vistazo es cuál está conectado y cuál no, que es la única
            // pregunta que traen. Con `items-start` y no estirados a la misma
            // altura: la ficha de Meta tiene dos interruptores que la de
            // WhatsApp no tiene, e igualarlas deja cien píxeles de nada adentro
            // de la de WhatsApp.
            <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
              <WhatsappConnection />
              <MetaConnection />
            </div>
          )}

          {seccion === 'horario' && (
            <SettingCard
              title={t('config.horarioTitulo')}
              description={t('config.horarioDesc')}
              hint={
                estadoHorario
                  ? t('config.horarioHint', { n: diasConfigurados })
                  : t('config.horarioSinDias')
              }
              action={
                <span
                  className={`flex items-center gap-1.5 text-[12px] font-medium ${
                    estadoHorario?.isOpen ? 'text-status-good' : 'text-ink-secondary'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      estadoHorario?.isOpen ? 'bg-status-good' : 'bg-tint/30'
                    }`}
                  />
                  {estadoHorario ? t(ESTADO_HORARIO[estadoHorario.reason]) : t('config.sinHorario')}
                </span>
              }
            >
              <div className="grid grid-cols-1 border-t border-tint/[0.06] sm:grid-cols-2 sm:gap-x-8">
                {weekDays.slice(0, 6).map((day) => (
                  <FilaDia
                    key={day}
                    day={day}
                    horario={horarios[day]}
                    onToggle={() => toggleDay(day)}
                    onEditarHora={(field, value) => editarHora(day, field, value)}
                    className="border-b border-tint/[0.06]"
                  />
                ))}
                {/* Domingo abajo, a caballo de las dos columnas. */}
                <FilaDia
                  day="Dom"
                  horario={horarios.Dom}
                  onToggle={() => toggleDay('Dom')}
                  onEditarHora={(field, value) => editarHora('Dom', field, value)}
                  className="border-b border-tint/[0.06] sm:col-span-2"
                />
              </div>
            </SettingCard>
          )}

          {seccion === 'respuestas' && (
            <>
              <TarjetaTexto
                title={t('config.tonoCasa')}
                description={t('config.tonoCasaDesc')}
                hint={t('config.tonoCasaHint')}
                placeholder={t('config.tonoCasaPlaceholder')}
                filas={4}
                contador
                valor={settings.welcomeMessage}
                onGuardar={(welcomeMessage) => onUpdate({ welcomeMessage })}
              />

              <TarjetaTexto
                title={t('config.fueraDeHorario')}
                description={t('config.fueraDeHorarioDesc')}
                hint={t('config.fueraDeHorarioHint')}
                placeholder={t('config.fueraDeHorarioPlaceholder')}
                filas={4}
                contador
                valor={settings.awayMessage}
                onGuardar={(awayMessage) => onUpdate({ awayMessage })}
              />

              {/* En qué idioma le contesta la IA al cliente. Va acá y no en
                  Apariencia porque no es una preferencia de quien mira la
                  pantalla: es lo que reciben los clientes del negocio, se
                  guarda en la base y lo ven todos los del equipo. Se manda al
                  elegirlo, como el tema y los días: de una lista no queda nada
                  a medio escribir que haya que confirmar. */}
              <SettingCard
                title={t('config.idiomaIA')}
                description={t('config.idiomaIADesc')}
                hint={t('config.idiomaIAHint')}
              >
                <Select
                  value={idiomaIA}
                  onChange={(aiLanguage) => onUpdate({ aiLanguage })}
                  ariaLabel={t('config.idiomaIAAria')}
                  className="max-w-sm"
                  options={IDIOMAS_IA.map((op) => ({
                    value: op.value,
                    label: t(`config.${op.clave}`),
                    hint: op.hint ? t(`config.${op.hint}`) : undefined,
                  }))}
                />
              </SettingCard>
            </>
          )}

          {seccion === 'apariencia' && (
            <>
            <SettingCard
              title={t('config.tema')}
              description={t('config.temaDesc')}
              hint={t('config.temaHint')}
            >
              <div className="inline-flex rounded-lg border border-tint/[0.1] bg-tint/[0.03] p-0.5">
                {[
                  { id: 'light', label: t('config.temaClaro'), Icono: IconSun },
                  { id: 'dark', label: t('config.temaOscuro'), Icono: IconMoon },
                ].map(({ id, label, Icono }) => {
                  const activo = theme === id
                  return (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={activo}
                      onClick={() => !activo && onToggleTheme()}
                      className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] transition-colors duration-150
                        ${
                          activo
                            ? 'bg-surface-card font-medium text-ink-primary shadow-card'
                            : 'text-ink-muted hover:text-ink-primary'
                        }`}
                    >
                      <Icono size={14} />
                      {label}
                    </button>
                  )
                })}
              </div>
            </SettingCard>

            {/* El idioma de la dashboard va al lado del tema porque es la misma
                clase de ajuste: se guarda en el navegador de este equipo y no
                sale para ningún lado. El de las respuestas de la IA es otra
                cosa y vive en Respuestas automáticas — la bajada de cada uno lo
                aclara, porque es exactamente la confusión que se presta. */}
            <SettingCard
              title={t('config.idioma')}
              description={t('config.idiomaDesc')}
              hint={t('config.idiomaHint')}
            >
              {/* Los nombres de los idiomas van siempre en su propio idioma
                  ("English", no "Inglés"): quien viene a cambiarlo es justamente
                  quien no entiende el que está puesto. */}
              <div className="inline-flex rounded-lg border border-tint/[0.1] bg-tint/[0.03] p-0.5">
                {IDIOMAS.map(({ value, label }) => {
                  const activo = idioma === value
                  return (
                    <button
                      key={value}
                      type="button"
                      lang={value}
                      aria-pressed={activo}
                      onClick={() => !activo && setIdioma(value)}
                      className={`rounded-md px-3 py-1.5 text-[13px] transition-colors duration-150
                        ${
                          activo
                            ? 'bg-surface-card font-medium text-ink-primary shadow-card'
                            : 'text-ink-muted hover:text-ink-primary'
                        }`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </SettingCard>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
