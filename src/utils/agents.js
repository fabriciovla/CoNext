// Un mensaje o una conversación pueden apuntar a un agente que ya se borró o
// que todavía no cargó del server. En vez de romper la vista, se devuelve un
// agente "fantasma" con la misma forma, así los componentes leen agent.name y
// agent.emoji sin preguntar nada.
const UNKNOWN = { key: null, name: 'Sin agente', emoji: '🤖' }

export function findAgent(agents, key) {
  if (!agents?.length) return { ...UNKNOWN, key: key ?? null }
  if (!key) return agents[0]
  // Con el roster ya cargado, una key que no está es un agente borrado — antes
  // de que cargue no se puede afirmar eso, por eso el corte de arriba.
  return agents.find((a) => a.key === key) ?? { ...UNKNOWN, key, name: 'Agente eliminado' }
}
