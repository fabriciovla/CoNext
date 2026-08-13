// Express 4 no entiende de promesas: si un handler async rechaza, el error no
// llega al errorHandler — la request queda colgada hasta que el cliente corta y
// el server solo escupe un UnhandledPromiseRejection sin contexto.
//
// Con la base en Postgres **todos** los handlers pasaron a ser async, así que
// esto dejó de ser un detalle: sin el wrapper, cualquier consulta que falle es
// una request que nunca responde.
export const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)
