import { IconAlert, IconClose } from './ui/icons'
import { useT } from '../lib/i18n.jsx'

// Aviso de que la última llamada a la API falló. Va fijo arriba de todo y por
// encima de la bandeja, que se dibuja a pantalla completa: el caso que importa
// es justamente el server caído, donde sin esto la dashboard se ve igual que
// una dashboard vacía y los botones parecen no responder.
//
// La barra se apoya en la superficie elevada y no en un bloque de rojo: el rojo
// entra por el ícono y el borde de abajo, que es lo que alcanza para que se lea
// como un problema. Un slab rojo a todo el ancho, sobre el tema claro, tapaba
// media pantalla por un error que casi siempre es "todavía no levanté el server".
export default function ApiErrorBanner({ error, onDismiss }) {
  const t = useT()
  if (!error) return null

  return (
    <div
      role="alert"
      className="animate-fade-down fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-3
        border-b border-status-critical/30 bg-surface-raised px-4 py-2 text-[12.5px] shadow-pop"
    >
      <IconAlert size={14} className="shrink-0 text-status-critical" />
      {/* El hook guarda el origen como clave (`errores.enviarMensaje`) y la
          frase se arma acá: así el aviso sale en el idioma que esté puesto
          cuando se dibuja, y no en el que estaba cuando falló. */}
      <p className="min-w-0 truncate text-ink-secondary">
        {t('errores.plantilla', { que: t(`errores.${error.origen}`) })}:{' '}
        <span className="text-ink-muted">{error.message}</span>
      </p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label={t('errores.cerrarAviso')}
        title={t('errores.cerrarAviso')}
        className="-mr-1 shrink-0 rounded-md p-1 text-ink-muted transition-colors duration-150
          hover:bg-tint/[0.06] hover:text-ink-primary"
      >
        <IconClose size={13} />
      </button>
    </div>
  )
}
