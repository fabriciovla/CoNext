import { PROVEEDORES_OAUTH } from '../../lib/auth'
import { IconGitHub, IconGoogle } from '../ui/icons'

const ICONOS = {
  google: IconGoogle,
  github: IconGitHub,
}

// Grilla de proveedores. Vive afuera de la tarjeta del correo: son otro camino,
// no un campo más del formulario. El click se lo come el padre (`onElegir`)
// para que el mismo bloque sirva en "Iniciar sesión" y en "Crear cuenta".
export default function SocialButtons({ onElegir, pending = false, separador = 'o con tu correo' }) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        {PROVEEDORES_OAUTH.map(({ id, label }) => {
          const Icono = ICONOS[id]
          return (
            <button
              key={id}
              type="button"
              disabled={pending}
              onClick={() => onElegir(id)}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-tint/[0.12] text-[12.5px] font-medium text-ink-secondary
                transition-colors duration-150
                hover:border-tint/25 hover:text-ink-primary
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tint/20 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-page
                disabled:cursor-not-allowed disabled:opacity-40"
            >
              {Icono ? <Icono size={15} /> : null}
              {label}
            </button>
          )
        })}
      </div>
      <div className="relative my-5 text-center">
        <span className="absolute inset-x-0 top-1/2 border-t border-tint/[0.08]" />
        <span className="relative bg-surface-page px-2 text-[12px] text-ink-faint">{separador}</span>
      </div>
    </div>
  )
}
