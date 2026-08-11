import { GoogleGenAI } from '@google/genai'

let client = null

// Un solo cliente para todo el pipeline (ruteo + redacción): la key se valida
// en un único lugar y no se instancia un SDK por cada paso.
export function getClient() {
  if (!client) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY no está configurada')
    }
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  }
  return client
}

// Los alias "-latest" evitan hardcodear una versión que Google puede retirar
// para las keys nuevas (mismo criterio que el .env.example).
export const DRAFT_MODEL = process.env.AI_MODEL || 'gemini-flash-latest'
// El ruteo es una decisión de una palabra sobre una lista corta: no necesita el
// mismo modelo que la redacción, así que puede apuntarse a uno más barato.
export const ROUTER_MODEL = process.env.AI_ROUTER_MODEL || DRAFT_MODEL
