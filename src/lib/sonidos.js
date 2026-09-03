// Los avisos de la bandeja: uno para cuando el cliente escribe y otro para lo
// que mandamos nosotros. Bajo volumen a propósito, es un aviso de fondo y no
// una alarma. La URL sale de BASE_URL y no de una barra adelante: el CRM se
// publica en /app/ y un `src="/sonidos/…"` a secas pediría el archivo a la
// raíz del dominio, que es la landing.
const VOLUMEN = 0.35

const elementos = {}

function elemento(nombre) {
  if (!elementos[nombre]) {
    const audio = new Audio(`${import.meta.env.BASE_URL || '/'}sonidos/${nombre}.wav`)
    audio.volume = VOLUMEN
    elementos[nombre] = audio
  }
  return elementos[nombre]
}

// Reintentar desde el principio si ya estaba sonando (dos mensajes seguidos
// en menos de un segundo), y tragarse el rechazo del navegador si todavía no
// hubo ninguna interacción en la página: mejor un mensaje mudo que un error
// en la consola por algo que no rompe nada.
function reproducir(nombre) {
  const audio = elemento(nombre)
  audio.currentTime = 0
  audio.play().catch(() => {})
}

export const sonidoEnviar = () => reproducir('enviarmensaje')
export const sonidoRecibir = () => reproducir('recibirmensaje')
