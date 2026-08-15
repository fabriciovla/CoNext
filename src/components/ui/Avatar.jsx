// Marcador gris de contacto sin foto. La Cloud API de Meta no nos entrega la
// foto de perfil de WhatsApp, así que todos los contactos caen en el mismo
// dibujo — el mismo que muestra WhatsApp cuando no hay foto. El nombre va al
// lado en todos los lugares donde aparece, así que la inicial no hacía falta
// para distinguir: la fila se lee por el nombre, no por la letra.
const SIN_FOTO = '/IconoSinFoto.webp'

// `photo` es para los contactos. El equipo (el responsable de una conversación,
// el usuario de la barra, el Bot/Admin del hilo) se queda con la inicial: ahí sí
// hay pocas personas y distintas entre sí, que es cuando una letra identifica.
export default function Avatar({ name, size = 36, photo = false, className = '' }) {
  if (photo) {
    return (
      <img
        src={SIN_FOTO}
        alt=""
        draggable={false}
        className={`shrink-0 select-none rounded-xl object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    )
  }

  const initial = name?.trim()?.[0]?.toUpperCase() ?? '?'

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-xl border border-tint/15 bg-tint/10 font-semibold text-ink-primary ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initial}
    </div>
  )
}
