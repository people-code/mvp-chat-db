export type ChatRole = 'system' | 'user' | 'assistant'

export interface ChatMessage {
  role: ChatRole
  content: string
}

interface OllamaConfig {
  baseUrl: string
  model: string
}

function getOllamaConfig(): OllamaConfig {
  return {
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL || 'gemma4:e4b'
  }
}

export async function* streamChatTokens(messages: ChatMessage[]): AsyncGenerator<string> {
  const { baseUrl, model } = getOllamaConfig()

  let response: Response
  try {
    response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, stream: true, keep_alive: '30m' })
    })
  } catch {
    throw new Error('No se pudo conectar con Ollama. Verifica que esté corriendo.')
  }

  if (!response.ok || !response.body) {
    throw new Error(`Ollama respondió ${response.status}: ${await response.text().catch(() => '')}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue
      const parsed = JSON.parse(trimmed)
      const content: string | undefined = parsed?.message?.content
      if (content) yield content
    }
  }
}

export async function extractRecord(messages: ChatMessage[], schema: object, systemPrompt: string) {
  const { baseUrl, model } = getOllamaConfig()

  let response: Response
  try {
    response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        stream: false,
        format: schema,
        options: { temperature: 0 }
      })
    })
  } catch {
    throw new Error('No se pudo conectar con Ollama. Verifica que esté corriendo.')
  }

  if (!response.ok) {
    throw new Error(`Ollama respondió ${response.status}: ${await response.text().catch(() => '')}`)
  }

  const data = await response.json()
  const content: string = data?.message?.content ?? ''
  return JSON.parse(content)
}
