import Card from '../ui/Card'
import Button from '../ui/Button'
import { useT } from '../../lib/i18n.jsx'

// La ficha de un agente en la lista: el emoji, el nombre, si está trabajando y
// el botón que abre su pantalla. Nada más.
//
// Tuvo el rol, el estado en pastilla, las tres métricas y el interruptor, y era
// una tarjeta de doscientos píxeles de alto por agente para decir algo que se
// decide adentro. Todo eso vive en la pantalla del agente; acá la lista es una
// lista.
//
// **Son dos bandas y no un renglón.** Como fila de una línea ocupaba el ancho
// entero de la columna para tres palabras: una tarjeta larguísima y de dos
// centímetros de alto, con el nombre solo a la izquierda y medio metro de nada
// hasta el botón. Con el emoji y el nombre arriba y la acción abajo contra el
// borde —que es la misma forma que las tarjetas de conexión de Configuración—
// la ficha queda apaisada y entran tres por fila.
//
// El estado va como una palabra con su punto, no como pastilla de color: es lo
// único que hay que poder contestar sin entrar —¿está contestando o no?— y
// media docena de pastillas verdes se comen la página.
//
// La tarjeta entera abre, y el botón está igual: sin él, que sea clickeable hay
// que descubrirlo pasándole el mouse por encima. El botón que la cubre va antes
// en el DOM y es lo único posicionado además del `Configurar`, que viene
// después y por eso se queda con su click — un solo botón real, sin anidar unos
// adentro de otros.
export default function AgentCard({ agent, onAbrir }) {
  const t = useT()

  return (
    // El alto mínimo es lo que separa las dos bandas: sin él la tarjeta mide lo
    // que miden sus dos filas y quedan pegadas, y una ficha con nombre de dos
    // renglones sería más alta que la de al lado.
    <Card interactive className="group relative h-full" bodyClassName="flex h-full min-h-[7.5rem] flex-col p-4">
      <button
        type="button"
        onClick={onAbrir}
        aria-label={t('agentes.verAgente', { nombre: agent.name })}
        className="absolute inset-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet/50"
      />

      <div className="flex min-w-0 items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-tint/[0.08] bg-tint/[0.04] text-[18px] leading-none"
        >
          {agent.emoji || '🤖'}
        </span>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[13.5px] font-semibold leading-tight tracking-[-0.005em] text-ink-primary">
            {agent.name}
          </h3>
          <p className="mt-1 flex items-center gap-1.5 text-[11.5px] text-ink-muted">
            <span
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${agent.enabled ? 'bg-status-good' : 'bg-tint/30'}`}
            />
            {agent.enabled ? t('agentes.encendido') : t('agentes.apagado')}
          </p>
        </div>
      </div>

      {/* La franja de abajo es la misma de las tarjetas de conexión: el botón de
          cada ficha cae en el mismo eje, así que la fila se lee de un barrido.
          `mt-auto` la apoya abajo, para que con un nombre de dos renglones los
          botones sigan alineados entre sí. */}
      <div className="mt-auto flex justify-end border-t border-tint/[0.06] pt-3">
        <span className="relative">
          <Button size="sm" variant="secondary" onClick={onAbrir}>
            {t('agentes.configurar')}
          </Button>
        </span>
      </div>
    </Card>
  )
}
