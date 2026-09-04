import { useRef, useState } from 'react'
import Card from '../ui/Card'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import Switch from '../ui/Switch'
import EmptyState from '../ui/EmptyState'
import { SkeletonLinea } from '../ui/Skeleton'
import { LABEL_CLASS } from '../ui/Input'
import { IconFile, IconLink, IconNote, IconPlus, IconSearch, IconTrash } from '../ui/icons'
import { useT } from '../../lib/i18n.jsx'

// El material con el que se entrena un agente.
//
// Lo que se guarda es el TEXTO, no el archivo: un PDF se lee una vez, al subirlo,
// y lo que queda es lo que va a leer el modelo. Por eso la tarjeta no ofrece
// "ver el archivo" —no lo tenemos— y por eso el nombre importa: es lo único con
// lo que después se encuentra una fuente en la lista.
//
// El interruptor de cada fila es de ESTE agente; el tacho borra la fuente del
// negocio entero. Son dos cosas distintas y por eso están separadas: apagar es
// el gesto de todos los días y borrar es el que hay que pensar, así que uno es
// un interruptor y el otro un ícono que recién toma color rojo al pasar el mouse.

const CAMPO = `w-full rounded-lg border border-tint/[0.12] bg-transparent px-3 py-2 text-[13px] text-ink-primary
  placeholder:text-ink-faint transition-colors duration-150
  focus:border-violet/60 focus:outline-none focus:ring-1 focus:ring-violet/30`

const ICONO = { archivo: IconFile, enlace: IconLink, texto: IconNote }

function pesoLegible(chars) {
  if (chars < 1000) return `${chars}`
  return `${Math.round(chars / 100) / 10}k`
}

// Una fuente de la lista. El origen abajo del nombre es el archivo o la
// dirección: es lo que distingue dos fuentes que alguien nombró parecido.
function Fila({ fuente, onToggle, onBorrar }) {
  const t = useT()
  const Icono = ICONO[fuente.kind] ?? IconFile
  const rotulo = t(`agentes.fuente${fuente.kind === 'archivo' ? 'Archivo' : fuente.kind === 'enlace' ? 'Enlace' : 'Texto'}`)

  // El tacho aparece al pasar el mouse, pero su lugar está reservado igual: si
  // apareciera de la nada, la fila entera se correría al cruzarla el puntero.
  return (
    <li className="group/fila flex items-center gap-3 py-2.5">
      <Icono size={15} className="shrink-0 text-ink-faint" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] text-ink-primary">{fuente.title}</p>
        <p className="truncate text-[11.5px] text-ink-muted">
          {rotulo}
          {fuente.origin ? ` · ${fuente.origin}` : ''} · {pesoLegible(fuente.chars)}
        </p>
      </div>

      <button
        type="button"
        aria-label={t('agentes.borrarFuente', { nombre: fuente.title })}
        title={t('agentes.borrarFuente', { nombre: fuente.title })}
        onClick={onBorrar}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-ink-faint opacity-0
          transition-colors duration-150 focus-visible:opacity-100 group-hover/fila:opacity-100
          hover:bg-status-critical/10 hover:text-status-critical"
      >
        <IconTrash size={14} />
      </button>

      <Switch
        block={false}
        checked={Boolean(fuente.enabled)}
        onChange={(valor) => onToggle(valor)}
        title={
          fuente.enabled
            ? t('agentes.apagarFuente', { nombre: fuente.title })
            : t('agentes.encenderFuente', { nombre: fuente.title })
        }
      />
    </li>
  )
}

// El alta. Las tres formas conviven en el mismo modal porque son la misma
// pregunta —¿de dónde sale este texto?— y separarlas en tres botones obligaba a
// elegir antes de saber qué se estaba por hacer.
function ModalNuevaFuente({ guardando, error, onArchivo, onEnlace, onTexto, onCerrar }) {
  const t = useT()
  const [tipo, setTipo] = useState('archivo')
  const [archivo, setArchivo] = useState(null)
  const [url, setUrl] = useState('')
  const [titulo, setTitulo] = useState('')
  const [contenido, setContenido] = useState('')
  const inputArchivo = useRef(null)

  const puedeGuardar =
    (tipo === 'archivo' && archivo) ||
    (tipo === 'enlace' && url.trim()) ||
    (tipo === 'texto' && titulo.trim() && contenido.trim())

  const guardar = () => {
    const accion =
      tipo === 'archivo'
        ? onArchivo(archivo, titulo.trim())
        : tipo === 'enlace'
          ? onEnlace(url.trim(), titulo.trim())
          : onTexto(titulo.trim(), contenido.trim())
    // El modal se cierra solo si salió bien: leer un PDF o abrir una página
    // falla seguido y por algo que se puede arreglar, y el aviso tiene que
    // quedar donde está el campo que hay que corregir.
    accion.then(onCerrar).catch(() => {})
  }

  return (
    <Modal
      width="lg"
      title={t('agentes.nuevaFuenteTitulo')}
      description={t('agentes.nuevaFuenteDesc')}
      onClose={onCerrar}
    >
      <div className="mb-4 flex gap-1 rounded-lg bg-tint/[0.04] p-1">
        {['archivo', 'enlace', 'texto'].map((valor) => (
          <button
            key={valor}
            type="button"
            onClick={() => setTipo(valor)}
            className={`flex-1 rounded-md px-3 py-1.5 text-[12.5px] transition-colors duration-150 ${
              tipo === valor
                ? 'bg-surface-raised text-ink-primary shadow-card'
                : 'text-ink-muted hover:text-ink-primary'
            }`}
          >
            {t(`agentes.fuenteTipo${valor[0].toUpperCase()}${valor.slice(1)}`)}
          </button>
        ))}
      </div>

      {tipo === 'archivo' && (
        <div>
          <input
            ref={inputArchivo}
            type="file"
            accept=".pdf,.txt,.md,.csv,.json,.html,.htm,text/*,application/pdf"
            onChange={(e) => {
              const elegido = e.target.files?.[0] ?? null
              setArchivo(elegido)
              if (elegido && !titulo.trim()) setTitulo(elegido.name)
            }}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => inputArchivo.current?.click()}
            className="flex w-full flex-col items-center gap-1 rounded-xl border border-dashed border-tint/20 px-4 py-7
              transition-colors duration-150 hover:border-violet/50"
          >
            <IconFile size={20} className="text-ink-faint" />
            <span className="mt-1 text-[13px] text-ink-primary">
              {archivo ? archivo.name : t('agentes.soltarArchivo')}
            </span>
            <span className="text-[11.5px] text-ink-muted">{t('agentes.formatosAceptados')}</span>
          </button>
        </div>
      )}

      {tipo === 'enlace' && (
        <label className="block">
          <span className={LABEL_CLASS}>{t('agentes.campoEnlace')}</span>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://minegocio.com/preguntas-frecuentes"
            className={CAMPO}
          />
          <span className="mt-1.5 block text-[11.5px] leading-snug text-ink-muted">
            {t('agentes.campoEnlaceHint')}
          </span>
        </label>
      )}

      {tipo === 'texto' && (
        <label className="block">
          <span className={LABEL_CLASS}>{t('agentes.campoContenido')}</span>
          <textarea
            rows={7}
            value={contenido}
            onChange={(e) => setContenido(e.target.value)}
            placeholder={t('agentes.campoContenidoPlaceholder')}
            className={`${CAMPO} resize-none leading-relaxed`}
          />
        </label>
      )}

      <label className="mt-4 block">
        <span className={LABEL_CLASS}>{t('agentes.campoTituloFuente')}</span>
        <input
          type="text"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          maxLength={120}
          placeholder={t('agentes.campoTituloFuenteHint')}
          className={CAMPO}
        />
      </label>

      {error && (
        <p className="mt-3 rounded-lg border border-status-critical/25 bg-status-critical/10 px-3 py-2 text-[12.5px] leading-snug text-status-critical">
          {error}
        </p>
      )}

      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onCerrar}>
          {t('comun.cancelar')}
        </Button>
        <Button disabled={!puedeGuardar || guardando} onClick={guardar}>
          {guardando ? t('agentes.leyendo') : t('agentes.agregar')}
        </Button>
      </div>
    </Modal>
  )
}

export default function KnowledgeCard({
  fuentes,
  cargando,
  guardando,
  error,
  limpiarError,
  onAgregarArchivo,
  onAgregarEnlace,
  onAgregarTexto,
  onAlternar,
  onBorrar,
  deshabilitado = false,
}) {
  const t = useT()
  const [busqueda, setBusqueda] = useState('')
  const [agregando, setAgregando] = useState(false)
  const [confirmarBorrado, setConfirmarBorrado] = useState(null)

  const query = busqueda.trim().toLowerCase()
  const visibles = query
    ? fuentes.filter(
        (f) => f.title.toLowerCase().includes(query) || (f.origin ?? '').toLowerCase().includes(query),
      )
    : fuentes

  const abrirAlta = () => {
    limpiarError?.()
    setAgregando(true)
  }

  return (
    <Card
      title={t('agentes.entrenar')}
      description={t('agentes.entrenarDesc')}
      actions={
        <Button size="sm" variant="secondary" disabled={deshabilitado} onClick={abrirAlta}>
          <IconPlus size={13} />
          {t('agentes.agregarFuente')}
        </Button>
      }
    >
      {/* El buscador aparece recién cuando hay algo que buscar: con tres fuentes
          es un campo de más arriba de una lista que entra entera en pantalla. */}
      {fuentes.length > 5 && (
        <div className="relative mb-1">
          <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            aria-label={t('agentes.buscarFuente')}
            placeholder={t('agentes.buscarFuente')}
            className={`${CAMPO} pl-9`}
          />
        </div>
      )}

      {cargando && (
        <div role="status" aria-label={t('comun.cargando')} className="space-y-3 py-2">
          <SkeletonLinea className="h-3 w-[55%]" />
          <SkeletonLinea className="h-3 w-[72%]" />
          <SkeletonLinea className="h-3 w-[40%]" />
        </div>
      )}

      {!cargando && fuentes.length === 0 && (
        <EmptyState
          className="py-8"
          icon={<IconFile size={18} />}
          title={t('agentes.entrenarVacioTitulo')}
          description={t('agentes.entrenarVacio')}
          action={
            <Button disabled={deshabilitado} onClick={abrirAlta}>
              <IconPlus size={14} />
              {t('agentes.agregarFuente')}
            </Button>
          }
        />
      )}

      {!cargando && fuentes.length > 0 && (
        <ul className="divide-y divide-tint/[0.06]">
          {visibles.map((fuente) => (
            <Fila
              key={fuente.id}
              fuente={fuente}
              onToggle={(valor) => onAlternar(fuente.id, valor).catch(() => {})}
              onBorrar={() => setConfirmarBorrado(fuente)}
            />
          ))}
          {visibles.length === 0 && (
            <li className="py-6 text-center text-[12.5px] text-ink-muted">
              {t('agentes.sinResultadosFuente', { query: busqueda.trim() })}
            </li>
          )}
        </ul>
      )}

      {/* El error de una fuente que no se pudo leer se muestra adentro del modal
          mientras está abierto; este es el de los interruptores y los borrados,
          que pasan con el modal cerrado. */}
      {error && !agregando && (
        <p className="mt-3 rounded-lg border border-status-critical/25 bg-status-critical/10 px-3 py-2 text-[12.5px] text-status-critical">
          {error}
        </p>
      )}

      {agregando && (
        <ModalNuevaFuente
          guardando={guardando}
          error={error}
          onArchivo={onAgregarArchivo}
          onEnlace={onAgregarEnlace}
          onTexto={onAgregarTexto}
          onCerrar={() => {
            setAgregando(false)
            limpiarError?.()
          }}
        />
      )}

      {confirmarBorrado && (
        <Modal title={t('agentes.borrarFuenteTitulo')} onClose={() => setConfirmarBorrado(null)}>
          <p className="text-sm leading-relaxed text-ink-secondary">
            {t('agentes.seVaABorrar')}{' '}
            <span className="text-ink-primary">{confirmarBorrado.title}</span>.{' '}
            {t('agentes.borrarFuenteDetalle')}
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmarBorrado(null)}>
              {t('comun.cancelar')}
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                onBorrar(confirmarBorrado.id)
                  .then(() => setConfirmarBorrado(null))
                  .catch(() => setConfirmarBorrado(null))
              }}
            >
              {t('comun.borrar')}
            </Button>
          </div>
        </Modal>
      )}
    </Card>
  )
}
