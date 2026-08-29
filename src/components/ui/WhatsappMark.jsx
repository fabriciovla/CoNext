// El logo de WhatsApp, en un solo lugar. Antes era el mismo `path` de SVG
// copiado en la lista de conversaciones y en el composer, dibujado a mano sobre
// un círculo verde: dos copias que había que mantener iguales y que no eran el
// logo, eran una aproximación.
//
// Va como imagen y no como SVG inline porque el logo trae su propio contorno
// blanco, que es lo que lo despega del avatar gris cuando se apoya encima. Es
// una de las tres marcas que no pasan por la paleta semántica: el verde de
// WhatsApp es el mismo en los dos temas.
export default function WhatsappMark({ size = 14, className = '' }) {
  return (
    <img
      src={`${import.meta.env.BASE_URL || '/'}logowsp.webp`}
      alt=""
      draggable={false}
      className={`shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
    />
  )
}
