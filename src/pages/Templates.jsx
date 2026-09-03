import { useState } from 'react'
import PageHeader from '../components/PageHeader'
import Card from '../components/ui/Card'
import EmptyState from '../components/ui/EmptyState'
import Skeleton from '../components/ui/Skeleton'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Input, { LABEL_CLASS } from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import Select from '../components/ui/Select'
import { IconPlus, IconTrash, IconTemplate } from '../components/ui/icons'
import { useT } from '../lib/i18n.jsx'

// Cómo se ve cada estado de Meta. `slate` para los que no dicen nada todavía:
// el color se guarda para lo que pide una acción (rechazada) o confirma que ya
// se puede usar (aprobada), igual que el stock en Productos.
const ESTADOS = {
  APPROVED: { tone: 'green', clave: 'estadoAprobada' },
  PENDING: { tone: 'amber', clave: 'estadoEnRevision' },
  IN_APPEAL: { tone: 'amber', clave: 'estadoEnApelacion' },
  REJECTED: { tone: 'red', clave: 'estadoRechazada' },
  PAUSED: { tone: 'amber', clave: 'estadoPausada' },
  DISABLED: { tone: 'red', clave: 'estadoDeshabilitada' },
}

const CATEGORIAS = [
  { value: 'UTILITY', clave: 'categoriaUtilidadLarga' },
  { value: 'MARKETING', clave: 'categoriaMarketingLarga' },
]

// El idioma de una plantilla es el del mensaje que le va a llegar al cliente,
// no el de la dashboard: son los códigos de Meta y la lista es la misma en los
// dos idiomas, solo cambia cómo se nombra cada uno.
const IDIOMAS = [
  { value: 'es_AR', clave: 'idiomaEsAr' },
  { value: 'es', clave: 'idiomaEs' },
  { value: 'es_MX', clave: 'idiomaEsMx' },
  { value: 'en_US', clave: 'idiomaEnUs' },
  { value: 'pt_BR', clave: 'idiomaPtBr' },
]

// Las variables son {{1}}, {{2}}… y se pintan aparte del texto: leídas en medio
// de una oración parecen un error de tipeo, y son justamente lo que hay que
// revisar antes de mandar.
function CuerpoConVariables({ text }) {
  return (
    <span>
      {text.split(/(\{\{\d+\}\})/g).map((parte, i) =>
        /^\{\{\d+\}\}$/.test(parte) ? (
          <span key={i} className="rounded bg-violet/10 px-1 font-medium text-violet">
            {parte}
          </span>
        ) : (
          parte
        ),
      )}
    </span>
  )
}

function FormularioPlantilla({ onCancel, onSubmit }) {
  const t = useT()
  const [name, setName] = useState('')
  const [category, setCategory] = useState('UTILITY')
  const [language, setLanguage] = useState('es_AR')
  const [body, setBody] = useState('')
  const [footer, setFooter] = useState('')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const enviar = async (e) => {
    e.preventDefault()
    setError('')
    setGuardando(true)
    try {
      await onSubmit({ name, category, language, body, footer })
    } catch (err) {
      // El error de Meta se contesta acá abajo y no en el cartel de la página:
      // es sobre lo que está escrito en este formulario, que sigue abierto.
      setError(err.message)
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={enviar} className="space-y-4">
      <Input
        id="tpl-name"
        label={t('plantillas.campoNombre')}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t('plantillas.campoNombrePlaceholder')}
        autoFocus
      />
      <p className="-mt-2.5 text-[11.5px] text-ink-faint">{t('plantillas.campoNombreHint')}</p>

      <div>
        <span className={LABEL_CLASS}>{t('plantillas.campoCategoria')}</span>
        <Select
          value={category}
          onChange={setCategory}
          options={CATEGORIAS.map((c) => ({ value: c.value, label: t(`plantillas.${c.clave}`) }))}
          ariaLabel={t('plantillas.campoCategoria')}
        />
      </div>

      <div>
        <span className={LABEL_CLASS}>{t('plantillas.campoIdioma')}</span>
        <Select
          value={language}
          onChange={setLanguage}
          options={IDIOMAS.map((i) => ({ value: i.value, label: t(`plantillas.${i.clave}`) }))}
          ariaLabel={t('plantillas.campoIdioma')}
        />
      </div>

      <label htmlFor="tpl-body" className="block">
        <span className={LABEL_CLASS}>{t('plantillas.campoMensaje')}</span>
        <textarea
          id="tpl-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          placeholder={t('plantillas.campoMensajePlaceholder')}
          className="w-full resize-y rounded-lg border border-tint/[0.12] bg-transparent px-3 py-2 text-[13px]
            text-ink-primary placeholder:text-ink-faint transition-colors duration-150
            focus:border-violet/60 focus:outline-none focus:ring-1 focus:ring-violet/30"
        />
      </label>
      <p className="-mt-2.5 text-[11.5px] text-ink-faint">
        {t('plantillas.variablesAntes')}
        <span className="font-medium text-ink-muted">{'{{1}}'}</span>,{' '}
        <span className="font-medium text-ink-muted">{'{{2}}'}</span>
        {t('plantillas.variablesDespues')}
      </p>

      <Input
        id="tpl-footer"
        label={t('plantillas.campoPie')}
        value={footer}
        onChange={(e) => setFooter(e.target.value)}
        placeholder={t('plantillas.campoPiePlaceholder')}
      />

      {error && <p className="text-[12.5px] text-status-critical">{error}</p>}

      <p className="text-[11.5px] text-ink-faint">{t('plantillas.revisaMeta')}</p>

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="ghost" type="button" onClick={onCancel}>
          {t('comun.cancelar')}
        </Button>
        <Button type="submit" disabled={guardando}>
          {guardando ? t('plantillas.enviando') : t('plantillas.crearPlantilla')}
        </Button>
      </div>
    </form>
  )
}

export default function Templates({
  templates,
  conectado,
  cargando,
  error,
  onRefresh,
  onCreate,
  onDelete,
}) {
  const t = useT()
  const [creando, setCreando] = useState(false)
  const [borrando, setBorrando] = useState(null)

  const crear = async (datos) => {
    await onCreate(datos)
    setCreando(false)
  }

  return (
    <>
      <PageHeader
        title={t('plantillas.titulo')}
        description={
          <>
            {t('plantillas.bajadaAntes')}
            <strong className="font-medium text-ink-primary">{t('plantillas.bajadaFuerte')}</strong>
            {t('plantillas.bajadaDespues')}
          </>
        }
        actions={
          <>
            <Button variant="secondary" onClick={onRefresh}>
              {t('plantillas.actualizarEstados')}
            </Button>
            <Button onClick={() => setCreando(true)} disabled={!conectado}>
              <IconPlus size={15} />
              {t('plantillas.nuevaPlantilla')}
            </Button>
          </>
        }
      />

      {error && (
        <Card className="mb-4 border-status-critical/30">
          <p className="text-[13px] text-status-critical">{error}</p>
        </Card>
      )}

      {!conectado && !cargando && (
        <Card className="mb-4">
          <p className="text-[13px] text-ink-secondary">{t('plantillas.sinWhatsapp')}</p>
        </Card>
      )}

      {/* Un renglón que decía "Trayendo las plantillas…" y nada más: la página
          quedaba vacía con una frase en el medio, y al llegar la respuesta
          aparecía la lista entera de golpe. El hueco tiene la forma de lo que
          viene, así que lo que pasa es que se rellena. Y acá importa más que en
          ningún lado: las plantillas se leen en vivo de Graph en cada visita. */}
      {cargando && <Skeleton cards={3} lineas={3} className="grid grid-cols-1 gap-3" />}

      {!cargando && conectado && templates.length === 0 && (
        <Card bodyClassName="p-0">
          <EmptyState
            icon={<IconTemplate size={19} />}
            title={t('plantillas.vacioTitulo')}
            description={t('plantillas.vacioTexto')}
            action={
              <Button onClick={() => setCreando(true)}>
                <IconPlus size={15} />
                {t('plantillas.nuevaPlantilla')}
              </Button>
            }
          />
        </Card>
      )}

      <div className="grid grid-cols-1 gap-3">
        {/* La plantilla se llama `p` y no `t`: `t` es la función de textos. */}
        {templates.map((p) => {
          const estado = ESTADOS[p.status]
          return (
            <Card key={p.id} className="group">
              <div className="flex min-w-0 items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <h3 className="truncate text-[14px] font-medium text-ink-primary">{p.name}</h3>
                    <Badge tone={estado?.tone ?? 'slate'}>
                      {estado ? t(`plantillas.${estado.clave}`) : p.status}
                    </Badge>
                    <span className="text-[12px] text-ink-faint">
                      {p.category === 'MARKETING'
                        ? t('plantillas.categoriaMarketing')
                        : t('plantillas.categoriaUtilidad')}{' '}
                      · {p.language}
                    </span>
                  </div>

                  <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-ink-secondary">
                    <CuerpoConVariables text={p.body} />
                  </p>

                  {p.footer && <p className="mt-1.5 text-[12px] text-ink-faint">{p.footer}</p>}

                  {p.status === 'REJECTED' && p.rejectedReason && (
                    <p className="mt-2 text-[12.5px] text-status-critical">
                      {t('plantillas.rechazoMeta', { motivo: p.rejectedReason })}
                    </p>
                  )}
                </div>

                {/* El espacio queda reservado con opacity y no con hidden: si
                    apareciera de la nada, la fila entera saltaría al pasar el
                    mouse. */}
                <div className="shrink-0 opacity-0 transition-opacity duration-150 focus-within:opacity-100 group-hover:opacity-100">
                  <button
                    type="button"
                    title={t('plantillas.borrarPlantilla')}
                    aria-label={t('plantillas.borrarPlantillaAria', { nombre: p.name })}
                    onClick={() => setBorrando(p)}
                    className="flex h-6 w-6 items-center justify-center rounded-md text-ink-muted transition-colors duration-150 hover:bg-status-critical/10 hover:text-status-critical"
                  >
                    <IconTrash size={15} />
                  </button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {creando && (
        <Modal title={t('plantillas.nuevaPlantilla')} onClose={() => setCreando(false)}>
          <FormularioPlantilla onCancel={() => setCreando(false)} onSubmit={crear} />
        </Modal>
      )}

      {borrando && (
        <Modal title={t('plantillas.borrarPlantilla')} onClose={() => setBorrando(null)} width="sm">
          <p className="text-[13px] leading-relaxed text-ink-secondary">
            {t('plantillas.borrarAntes')}
            <strong className="font-medium text-ink-primary">{borrando.name}</strong>
            {t('plantillas.borrarDespues')}
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setBorrando(null)}>
              {t('comun.cancelar')}
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                onDelete(borrando.name)
                setBorrando(null)
              }}
            >
              {t('comun.borrar')}
            </Button>
          </div>
        </Modal>
      )}
    </>
  )
}
