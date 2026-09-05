import { useEffect, useState } from 'react'
import PageHeader from '../components/PageHeader'
import Card from '../components/ui/Card'
import EmptyState from '../components/ui/EmptyState'
import { SkeletonLinea } from '../components/ui/Skeleton'
import Button from '../components/ui/Button'
import AgentCard from '../components/agents/AgentCard'
import AgentDetail from '../components/agents/AgentDetail'
import { IconPlus, IconSparkles } from '../components/ui/icons'
import { useT } from '../lib/i18n.jsx'

// Agentes son dos pantallas y no una lista con un modal encima.
//
// La lista es una grilla de fichas con la misma forma que las tarjetas de
// conexión de Configuración: son las dos listas de "esto lo conectaste y
// trabaja solo", y hasta acá se veían como dos productos distintos. Entrar a una
// abre la pantalla del agente —configuración a la izquierda, una conversación de
// prueba a la derecha—, que es donde de verdad se lo arma.
//
// El modal que había antes no daba para eso: editar un agente es probar lo que
// contesta después de cada cambio, y con la configuración adentro de un diálogo
// no hay lugar para la prueba ni forma de mirar las dos cosas juntas.
//
// No hay router, así que cuál está abierto vive acá en un `useState`, igual que
// la sección elegida en Configuración. Volver a la lista es soltarlo.
export default function Agents({
  agents,
  stats,
  settings,
  productCount = 0,
  cargando = false,
  error,
  focus = null,
  onFocusHandled,
  onAdd,
  onUpdate,
  onDelete,
  onReorder,
  onNavigate,
}) {
  const t = useT()
  // El agente abierto: su id, 'nuevo', o null (la lista).
  const [abierto, setAbierto] = useState(null)

  // La barra de la izquierda entra acá pidiendo un agente puntual (o uno nuevo).
  // El pedido se consume apenas se abre: si quedara colgado, volver a la lista y
  // tocar el mismo agente no haría nada.
  useEffect(() => {
    if (focus == null) return
    if (focus !== 'nuevo' && !agents.some((a) => a.id === focus)) return // todavía no llegaron
    setAbierto(focus)
    onFocusHandled()
  }, [focus, agents, onFocusHandled])

  // El que contesta cuando ningún agente encaja claro: el primero *encendido*,
  // no el primero de la lista.
  const porDefecto = agents.find((a) => a.enabled)

  const agenteAbierto = abierto === 'nuevo' ? null : agents.find((a) => a.id === abierto)

  // Un agente que ya no está —lo borró alguien más, o se borró desde su propia
  // pantalla— devuelve a la lista en vez de dejar una pantalla en blanco.
  useEffect(() => {
    if (abierto && abierto !== 'nuevo' && !cargando && !agents.some((a) => a.id === abierto)) {
      setAbierto(null)
    }
  }, [abierto, agents, cargando])

  if (abierto) {
    return (
      <AgentDetail
        // La `key` remonta la pantalla al cambiar de agente: sin ella, el
        // borrador del formulario y el hilo de la prueba se quedarían con los
        // del anterior.
        key={abierto}
        agent={agenteAbierto ?? null}
        stats={agenteAbierto ? stats[agenteAbierto.key] : null}
        settings={settings}
        productCount={productCount}
        esPorDefecto={Boolean(agenteAbierto && porDefecto?.id === agenteAbierto.id)}
        nombrePorDefecto={porDefecto?.name ?? null}
        // Hacer que un agente conteste por defecto es ponerlo primero: el
        // orden es lo que decide quién atiende cuando ninguno encaja claro.
        onHacerPorDefecto={(id) =>
          onReorder([id, ...agents.filter((a) => a.id !== id).map((a) => a.id)]).catch(() => {})
        }
        onGuardar={onUpdate}
        onCrear={(draft) => onAdd(draft).then((creado) => setAbierto(creado.id))}
        onBorrar={onDelete}
        onVolver={() => setAbierto(null)}
        onNavigate={onNavigate}
      />
    )
  }

  return (
    <div>
      <PageHeader
        title={t('agentes.titulo')}
        description={t('agentes.bajada')}
        actions={
          // El paso del recorrido guiado señala el botón y no la lista: sin
          // ningún agente creado la lista es un estado vacío de alto variable, y
          // el botón está siempre, que además es lo que hay que tocar.
          <Button data-tour="agentes-nuevo" onClick={() => setAbierto('nuevo')}>
            <IconPlus size={14} />
            {t('agentes.nuevoAgente')}
          </Button>
        }
      />

      {error && (
        <p className="mb-4 rounded-xl border border-status-critical/25 bg-status-critical/10 px-4 py-2.5 text-[13px] text-status-critical">
          {error}
        </p>
      )}

      {/* Las fichas son de un renglón, así que entran varias por fila: en una
          columna, seis agentes son seis renglones sueltos con media pantalla
          vacía a la derecha. Lo que cada agente es —su estado, lo que viene
          haciendo, quién contesta por defecto— se lee adentro. */}
      <div
        className="stagger grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
        style={{ '--stagger-base': '30ms' }}
      >
        {agents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} onAbrir={() => setAbierto(agent.id)} />
        ))}
      </div>

      {/* "Todavía no hay agentes" es una afirmación, y mientras la lista viaja
          todavía no se sabe: dibujarla es contarle al cliente algo falso
          durante medio segundo. */}
      {/* El hueco tiene la forma de la ficha —la baldosa de la cara y el
          nombre—, no la de una tarjeta genérica: si midiera otra cosa, la
          página saltaría al llegar la lista. */}
      {cargando && agents.length === 0 && (
        <div
          role="status"
          aria-label={t('comun.cargando')}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex min-h-[7.5rem] flex-col rounded-xl border border-tint/[0.08] bg-surface-card p-4 shadow-card"
            >
              <div className="flex items-center gap-3">
                <SkeletonLinea className="h-9 w-9 rounded-lg" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <SkeletonLinea className="h-3 w-[60%]" />
                  <SkeletonLinea className="h-2.5 w-[35%]" />
                </div>
              </div>
              <div className="mt-auto flex justify-end border-t border-tint/[0.06] pt-3">
                <SkeletonLinea className="h-7 w-24 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!cargando && agents.length === 0 && (
        <Card bodyClassName="p-0">
          <EmptyState
            icon={<IconSparkles size={19} />}
            title={t('agentes.vacioTitulo')}
            description={t('agentes.vacioTexto')}
            action={
              // El mismo `data-tour` que el de la cabecera: el recorrido acepta
              // cualquiera de los dos, y sin ningún agente creado este es el que
              // la persona tiene adelante.
              <Button data-tour="agentes-nuevo" onClick={() => setAbierto('nuevo')}>
                <IconPlus size={14} />
                {t('agentes.nuevoAgente')}
              </Button>
            }
          />
        </Card>
      )}
    </div>
  )
}
