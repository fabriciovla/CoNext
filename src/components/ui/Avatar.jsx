import ContactAvatar from './ContactAvatar'

// `photo` es para los contactos: sin foto de perfil (la Cloud API de Meta no
// nos la entrega), cada uno cae en uno de los doce fantasmas de
// `ContactAvatar`, siempre el mismo para el mismo contacto. El nombre va al
// lado en todos los lugares donde aparece, así que la cara no tiene que
// distinguir por sí sola: la fila se lee por el nombre.
//
// El equipo (el responsable de una conversación, el Bot/Admin del hilo) se
// queda con la inicial: ahí sí hay pocas personas y distintas entre sí, que es
// cuando una letra identifica. El usuario de la barra es la excepción: es
// siempre la misma persona en esta sesión, así que en vez de una inicial lleva
// una corona propia (`AdminAvatar`, del pliego `admin-avatar.svg`).
export default function Avatar({ name, size = 36, photo = false, admin = false, seed, className = '' }) {
  if (photo) {
    // `seed` es el teléfono crudo cuando quien llama lo tiene —la identidad
    // real de una conversación (ver `utils/phone.js`)— y si no, el nombre.
    return <ContactAvatar seed={seed ?? name ?? ''} size={size} className={className} />
  }

  if (admin) {
    return <AdminAvatar size={size} className={className} />
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

// Corona sobre violeta de marca, en línea como el resto de los avatares
// (`ContactAvatar`, `AgentAvatar`): la dashboard se publica bajo `/app/`, así
// que un `src="/admin-avatar.svg"` pediría el archivo a la landing (ver
// `ChannelLogo`). Colores literales a propósito, como el logo de WhatsApp: es
// una insignia de esta persona y no algo que tenga que darse vuelta con el tema.
function AdminAvatar({ size = 36, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      aria-hidden="true"
      className={`shrink-0 select-none rounded-xl ${className}`}
    >
      <circle cx="256" cy="256" r="256" fill="#4A3AA8" />
      <g transform="translate(256 262) scale(0.72) translate(-256 -256)" fill="#F2B44E">
        <path d="M112 168c0-17 19-26 32-15l50 44 48-76c11-18 37-18 48 0l48 76 50-44c13-11 32-2 32 15v128c0 38-24 56-70 56H182c-46 0-70-18-70-56V168Z" />
        <rect x="150" y="380" width="212" height="54" rx="27" />
      </g>
    </svg>
  )
}
