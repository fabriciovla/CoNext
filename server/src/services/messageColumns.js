// Las columnas de `messages` que ve el frontend, en un solo lugar.
//
// Vivían duplicadas en conversationService y dayService, y al sumar el estado
// de entrega se actualizó una sola: la bandeja seguía sin recibir el campo
// aunque la base lo tuviera bien guardado. Cualquier columna nueva se agrega
// acá y llega a las dos consultas.
//
// Los alias van entre comillas dobles porque Postgres, a diferencia de SQLite,
// pasa a minúscula todo identificador sin comillar: sin ellas `AS agentKey`
// llega al frontend como `agentkey` y el campo aparece siempre vacío.
// `media_path` no está y no tiene que estar: es una ruta del disco del server.
// El frontend pide el archivo por el id del mensaje (GET /messages/media/:id),
// que es lo único que se puede scopear por tenant.
export const MESSAGE_COLUMNS = `
  id, customer, phone, text, direction, type, status, author,
  agent_key AS "agentKey", created_at AS "createdAt",
  delivery_status AS "deliveryStatus", delivery_error AS "deliveryError",
  media_kind AS "mediaKind", media_mime AS "mediaMime",
  media_name AS "mediaName", media_size AS "mediaSize"
`
