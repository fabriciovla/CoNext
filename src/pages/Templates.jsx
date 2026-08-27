import { useState } from 'react'
import PageHeader from '../components/PageHeader'
import PageActions from '../components/PageActions'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import Select from '../components/ui/Select'
import { IconPlus, IconTrash, IconTemplate } from '../components/ui/icons'

// Cómo se ve cada estado de Meta. `slate` para los que no dicen nada todavía:
// el color se guarda para lo que pide una acción (rechazada) o confirma que ya
// se puede usar (aprobada), igual que el stock en Productos.
const ESTADOS = {
  APPROVED: { tone: 'green', label: 'Aprobada' },
  PENDING: { tone: 'amber', label: 'En revisión' },
  IN_APPEAL: { tone: 'amber', label: 'En apelación' },
  REJECTED: { tone: 'red', label: 'Rechazada' },
  PAUSED: { tone: 'amber', label: 'Pausada' },
  DISABLED: { tone: 'red', label: 'Deshabilitada' },
}

const CATEGORIAS = [
  { value: 'UTILITY', label: 'Utilidad — avisos de un pedido, turnos, envíos' },
  { value: 'MARKETING', label: 'Marketing — promociones, novedades, catálogo' },
]

const IDIOMAS = [
  { value: 'es_AR', label: 'Español (Argentina)' },
  { value: 'es', label: 'Español' },
  { value: 'es_MX', label: 'Español (México)' },
  { value: 'en_US', label: 'Inglés (EE.UU.)' },
  { value: 'pt_BR', label: 'Portugués (Brasil)' },
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
        label="Nombre"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="pedido_enviado"
        autoFocus
      />
      <p className="-mt-2.5 text-[11.5px] text-ink-faint">
        Es el nombre interno con el que se manda, no lo ve el contacto. Se guarda en minúscula y
        con guiones bajos.
      </p>

      <div>
        <span className="mb-1.5 block text-[12.5px] text-ink-secondary">Categoría</span>
        <Select value={category} onChange={setCategory} options={CATEGORIAS} ariaLabel="Categoría" />
      </div>

      <div>
        <span className="mb-1.5 block text-[12.5px] text-ink-secondary">Idioma</span>
        <Select value={language} onChange={setLanguage} options={IDIOMAS} ariaLabel="Idioma" />
      </div>

      <label htmlFor="tpl-body" className="block">
        <span className="mb-1.5 block text-[12.5px] text-ink-secondary">Mensaje</span>
        <textarea
          id="tpl-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          placeholder="Hola {{1}}, tu pedido ya salió y llega el {{2}}."
          className="w-full resize-y rounded-lg border border-tint/[0.12] bg-transparent px-3 py-2 text-[13px]
            text-ink-primary placeholder:text-ink-faint transition-colors duration-150
            focus:border-violet/60 focus:outline-none focus:ring-1 focus:ring-violet/30"
        />
      </label>
      <p className="-mt-2.5 text-[11.5px] text-ink-faint">
        Con <span className="font-medium text-ink-muted">{'{{1}}'}</span>,{' '}
        <span className="font-medium text-ink-muted">{'{{2}}'}</span>… dejás huecos que se completan
        al mandar. Van numeradas desde 1 y sin saltos.
      </p>

      <Input
        id="tpl-footer"
        label="Pie (opcional)"
        value={footer}
        onChange={(e) => setFooter(e.target.value)}
        placeholder="Respondé este mensaje si necesitás algo"
      />

      {error && <p className="text-[12.5px] text-status-critical">{error}</p>}

      <p className="text-[11.5px] text-ink-faint">
        La revisa Meta antes de que se pueda usar. Suele tardar unos minutos.
      </p>

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="ghost" type="button" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={guardando}>
          {guardando ? 'Enviando…' : 'Crear plantilla'}
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
  const [creando, setCreando] = useState(false)
  const [borrando, setBorrando] = useState(null)

  const crear = async (datos) => {
    await onCreate(datos)
    setCreando(false)
  }

  return (
    <>
      <PageHeader title="Plantillas" />

      <p className="mx-auto mb-5 max-w-2xl text-center text-[13px] leading-relaxed text-ink-secondary">
        Son los mensajes con los que podés escribir <strong className="font-medium text-ink-primary">primero</strong>.
        Pasadas 24 horas desde el último mensaje del contacto, WhatsApp solo deja mandar una
        plantilla aprobada.
      </p>

      {error && (
        <Card className="mb-4 border-status-critical/30">
          <p className="text-[13px] text-status-critical">{error}</p>
        </Card>
      )}

      {!conectado && !cargando && (
        <Card className="mb-4">
          <p className="text-[13px] text-ink-secondary">
            Este negocio todavía no conectó su WhatsApp, así que no hay cuenta de dónde traer las
            plantillas. Conectalo desde Configuración.
          </p>
        </Card>
      )}

      {cargando && <p className="text-center text-[13px] text-ink-muted">Trayendo las plantillas…</p>}

      {!cargando && conectado && templates.length === 0 && (
        <Card>
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <IconTemplate size={20} className="text-ink-faint" />
            <p className="text-[13px] text-ink-secondary">Todavía no hay ninguna plantilla.</p>
            <p className="max-w-sm text-[12.5px] text-ink-faint">
              La primera suele ser la del pedido en camino: es la que más se manda y la que más
              rápido aprueban.
            </p>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-3">
        {templates.map((t) => {
          const estado = ESTADOS[t.status] ?? { tone: 'slate', label: t.status }
          return (
            <Card key={t.id} className="group">
              <div className="flex min-w-0 items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <h3 className="truncate text-[14px] font-medium text-ink-primary">{t.name}</h3>
                    <Badge tone={estado.tone}>{estado.label}</Badge>
                    <span className="text-[12px] text-ink-faint">
                      {t.category === 'MARKETING' ? 'Marketing' : 'Utilidad'} · {t.language}
                    </span>
                  </div>

                  <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-ink-secondary">
                    <CuerpoConVariables text={t.body} />
                  </p>

                  {t.footer && <p className="mt-1.5 text-[12px] text-ink-faint">{t.footer}</p>}

                  {t.status === 'REJECTED' && t.rejectedReason && (
                    <p className="mt-2 text-[12.5px] text-status-critical">
                      Meta la rechazó: {t.rejectedReason}
                    </p>
                  )}
                </div>

                {/* El espacio queda reservado con opacity y no con hidden: si
                    apareciera de la nada, la fila entera saltaría al pasar el
                    mouse. */}
                <div className="shrink-0 opacity-0 transition-opacity duration-150 focus-within:opacity-100 group-hover:opacity-100">
                  <button
                    type="button"
                    title="Borrar plantilla"
                    aria-label={`Borrar la plantilla ${t.name}`}
                    onClick={() => setBorrando(t)}
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

      <PageActions>
        <Button onClick={() => setCreando(true)} disabled={!conectado}>
          <IconPlus size={15} />
          Nueva plantilla
        </Button>
        <Button variant="ghost" onClick={onRefresh}>
          Actualizar estados
        </Button>
      </PageActions>

      {creando && (
        <Modal title="Nueva plantilla" onClose={() => setCreando(false)}>
          <FormularioPlantilla onCancel={() => setCreando(false)} onSubmit={crear} />
        </Modal>
      )}

      {borrando && (
        <Modal title="Borrar plantilla" onClose={() => setBorrando(null)} width="sm">
          <p className="text-[13px] leading-relaxed text-ink-secondary">
            Se borra <strong className="font-medium text-ink-primary">{borrando.name}</strong> de la
            cuenta de WhatsApp, en todos sus idiomas. Para volver a tenerla hay que crearla de nuevo
            y esperar que Meta la apruebe otra vez.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setBorrando(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                onDelete(borrando.name)
                setBorrando(null)
              }}
            >
              Borrar
            </Button>
          </div>
        </Modal>
      )}
    </>
  )
}
