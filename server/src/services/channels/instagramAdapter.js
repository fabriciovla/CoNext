// sendMessage(conversation, text) -> Promise<{ externalId: string }>
export async function sendMessage(conversation, text) {
  const token = process.env.IG_ACCESS_TOKEN
  const igBusinessAccountId = process.env.IG_BUSINESS_ACCOUNT_ID

  if (!token || !igBusinessAccountId) {
    console.log(`[DEV][instagram] simulated send to ${conversation.phone}: ${text}`)
    return { externalId: `dev-${Date.now()}` }
  }

  const res = await fetch(`https://graph.facebook.com/v21.0/${igBusinessAccountId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      recipient: { id: conversation.phone },
      message: { text },
    }),
  })

  if (!res.ok) {
    throw new Error(`Instagram send failed: ${res.status} ${await res.text()}`)
  }

  const data = await res.json()
  return { externalId: data.message_id ?? null }
}
