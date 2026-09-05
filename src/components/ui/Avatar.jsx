import ContactAvatar from './ContactAvatar'

// `photo` es para los contactos: sin foto de perfil (la Cloud API de Meta no
// nos la entrega), cada uno cae en uno de los doce fantasmas de
// `ContactAvatar`, siempre el mismo para el mismo contacto. El nombre va al
// lado en todos los lugares donde aparece, así que la cara no tiene que
// distinguir por sí sola: la fila se lee por el nombre.
//
// El equipo (el responsable de una conversación, el usuario de la barra, el
// Bot/Admin del hilo) se queda con la inicial: ahí sí hay pocas personas y
// distintas entre sí, que es cuando una letra identifica.
export default function Avatar({ name, size = 36, photo = false, seed, className = '' }) {
  if (photo) {
    // `seed` es el teléfono crudo cuando quien llama lo tiene —la identidad
    // real de una conversación (ver `utils/phone.js`)— y si no, el nombre.
    return <ContactAvatar seed={seed ?? name ?? ''} size={size} className={className} />
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
