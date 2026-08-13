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
export const MESSAGE_COLUMNS = `
  id, customer, phone, text, direction, type, status, author,
  agent_key AS "agentKey", created_at AS "createdAt",
  delivery_status AS "deliveryStatus", delivery_error AS "deliveryError"
`
