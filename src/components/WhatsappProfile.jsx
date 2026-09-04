import { useEffect, useRef, useState } from 'react'
import Button from './ui/Button'
import Input, { LABEL_CLASS } from './ui/Input'
import Select from './ui/Select'
import SettingCard from './ui/SettingCard'
import { SkeletonLinea } from './ui/Skeleton'
import { useWhatsappProfile } from '../hooks/useWhatsappProfile'
import { useT } from '../lib/i18n.jsx'

// Los topes son de Meta. Se repiten acá para poder frenar antes de mandar; el
// corte de verdad está en el server, que es el que no puede confiar en lo que
// le llega.
const TOPES = { about: 139, description: 512, address: 256, email: 128 }

const CAMPO_CLASS =
  'w-full rounded-lg border border-tint/[0.12] bg-transparent px-3 py-2 text-[13px] text-ink-primary ' +
  'placeholder:text-ink-faint transition-colors duration-150 ' +
  'focus:border-violet/60 focus:outline-none focus:ring-1 focus:ring-violet/30'

// El perfil del negocio en WhatsApp: la foto, la descripción y los datos de
// contacto que ve el cliente al abrir el chat.
//
// Existe porque migrar el número a la Cloud API apaga la app del celular, que
// es donde el dueño editaba todo esto. Sin esta tarjeta, pasarse al CRM
// significa perder el perfil sin forma de volver a tocarlo.
//
// Va abajo de las dos fichas de conexión y no adentro de la de WhatsApp: esa
// ficha contesta "¿está conectado?" de un vistazo, y meterle un formulario de
// siete campos la convierte en otra cosa.
export default function WhatsappProfile({ className = '' }) {
  const t = useT()
  const { perfil, rubros, cargando, guardando, sinWhatsapp, error, guardar, subirFoto } =
    useWhatsappProfile()

  const [campos, setCampos] = useState(null)
  const [guardado, setGuardado] = useState(false)
  const archivo = useRef(null)
  const avisoTimer = useRef(null)
  // Lo último que vino del server. Sin esto, cada relectura pisaría lo que se
  // está escribiendo — el mismo motivo que en las tarjetas de Configuración.
  const remoto = useRef(null)

  useEffect(() => {
    if (!perfil) return
    const firma = JSON.stringify(perfil)
    if (remoto.current === firma) return
    remoto.current = firma
    setCampos({
      about: perfil.about ?? '',
      description: perfil.description ?? '',
      address: perfil.address ?? '',
      email: perfil.email ?? '',
      vertical: perfil.vertical ?? '',
      // La API acepta hasta dos sitios; la pantalla ofrece uno, que es lo que
      // usa un negocio. El segundo, si ya estaba, se respeta y no se pierde.
      website: perfil.websites?.[0] ?? '',
      resto: perfil.websites?.slice(1) ?? [],
    })
  }, [perfil])

  useEffect(() => () => clearTimeout(avisoTimer.current), [])

  const set = (campo) => (valor) => setCampos((c) => ({ ...c, [campo]: valor }))

  const sucio =
    campos &&
    perfil &&
    (campos.about !== (perfil.about ?? '') ||
      campos.description !== (perfil.description ?? '') ||
      campos.address !== (perfil.address ?? '') ||
      campos.email !== (perfil.email ?? '') ||
      campos.vertical !== (perfil.vertical ?? '') ||
      campos.website !== (perfil.websites?.[0] ?? ''))

  const onGuardar = async () => {
    if (!sucio) return
    const sitio = campos.website.trim()
    const ok = await guardar({
      about: campos.about.trim(),
      description: campos.description.trim(),
      address: campos.address.trim(),
      email: campos.email.trim(),
      vertical: campos.vertical || undefined,
      websites: sitio ? [sitio, ...campos.resto] : campos.resto,
    })
    if (!ok) return
    setGuardado(true)
    clearTimeout(avisoTimer.current)
    avisoTimer.current = setTimeout(() => setGuardado(false), 2400)
  }

  // La foto no espera al botón: no hay nada a medio escribir que confirmar, y
  // es el mismo criterio que los interruptores del resto de Configuración.
  const onElegirFoto = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) await subirFoto(file)
  }

  const marco = (children, hint, action) => (
    <SettingCard
      className={className}
      title={t('config.perfilWaTitulo')}
      description={t('config.perfilWaDesc')}
      hint={hint}
      action={action}
    >
      {children}
    </SettingCard>
  )

  if (cargando) {
    return marco(
      <div role="status" aria-label={t('canales.consultandoEstado')}>
        <SkeletonLinea className="h-2.5 w-[54%]" />
        <SkeletonLinea className="mt-4 h-9 w-full rounded-lg" />
        <SkeletonLinea className="mt-3 h-9 w-full rounded-lg" />
      </div>,
    )
  }

  // No es un error: es un cliente que todavía no conectó el canal. Decirlo en
  // rojo mandaría a buscar una falla que no existe.
  if (sinWhatsapp) return marco(null, t('config.perfilWaSinCanal'))
  if (!campos) return marco(null, error ?? t('config.perfilWaNoSePudo'))

  return marco(
    <div className="flex flex-col gap-4">
      {/* La foto arriba y sola: es lo primero que ve el cliente y lo único que
          no se escribe. */}
      <div className="flex items-center gap-4">
        {perfil.profilePictureUrl ? (
          <img
            src={perfil.profilePictureUrl}
            alt=""
            className="h-16 w-16 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-tint/[0.06] px-2 text-center text-[10.5px] leading-tight text-ink-faint">
            {t('config.perfilWaSinFoto')}
          </div>
        )}
        <div className="min-w-0">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => archivo.current?.click()}
            disabled={guardando}
          >
            {t('config.perfilWaCambiarFoto')}
          </Button>
          <p className="mt-1.5 text-[11.5px] text-ink-faint">{t('config.perfilWaFotoRegla')}</p>
          <input
            ref={archivo}
            type="file"
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={onElegirFoto}
          />
        </div>
      </div>

      <label className="block">
        <span className={LABEL_CLASS}>{t('config.perfilWaAbout')}</span>
        <input
          value={campos.about}
          maxLength={TOPES.about}
          placeholder={t('config.perfilWaAboutPlaceholder')}
          onChange={(e) => set('about')(e.target.value)}
          className={CAMPO_CLASS}
        />
      </label>

      <label className="block">
        <span className={LABEL_CLASS}>{t('config.perfilWaDescripcion')}</span>
        <textarea
          value={campos.description}
          maxLength={TOPES.description}
          rows={3}
          placeholder={t('config.perfilWaDescripcionPlaceholder')}
          onChange={(e) => set('description')(e.target.value)}
          className={`resize-y ${CAMPO_CLASS}`}
        />
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label={t('config.perfilWaDireccion')}
          value={campos.address}
          maxLength={TOPES.address}
          onChange={(e) => set('address')(e.target.value)}
        />
        <Input
          label={t('config.perfilWaEmail')}
          type="email"
          value={campos.email}
          maxLength={TOPES.email}
          onChange={(e) => set('email')(e.target.value)}
        />
        <Input
          label={t('config.perfilWaSitio')}
          value={campos.website}
          placeholder="https://"
          onChange={(e) => set('website')(e.target.value)}
        />
        <div className="min-w-0">
          <span className={LABEL_CLASS}>{t('config.perfilWaRubro')}</span>
          <Select
            value={campos.vertical}
            onChange={set('vertical')}
            ariaLabel={t('config.perfilWaRubro')}
            options={rubros.map((r) => ({ value: r, label: t(`config.rubro${r}`) }))}
          />
        </div>
      </div>
    </div>,
    guardado ? (
      <span className="text-status-good">{t('comun.guardado')}</span>
    ) : error ? (
      <span className="text-status-critical">{error}</span>
    ) : (
      t('config.perfilWaHint')
    ),
    <Button size="sm" onClick={onGuardar} disabled={!sucio || guardando}>
      {guardando ? t('comun.cargando') : t('comun.guardar')}
    </Button>,
  )
}
