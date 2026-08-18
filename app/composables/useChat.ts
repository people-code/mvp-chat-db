export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface SavedRecord {
  id: string
  domain: string
  summary: string
  payload: Record<string, unknown>
  status: string
  createdAt: string
}

const RESET_DELAY_MS = 3000

function getSessionId(): string {
  const existing = localStorage.getItem('chat_session_id')
  if (existing) return existing
  return startNewSession()
}

function startNewSession(): string {
  const id = crypto.randomUUID()
  localStorage.setItem('chat_session_id', id)
  return id
}

export function useChat() {
  const messages = useState<ChatMessage[]>('chat-messages', () => [])
  const isStreaming = useState<boolean>('chat-streaming', () => false)
  const lastSavedRecord = useState<SavedRecord | null>('chat-last-record', () => null)
  const errorMessage = useState<string | null>('chat-error', () => null)

  async function sendMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed || isStreaming.value) return

    errorMessage.value = null
    lastSavedRecord.value = null
    messages.value.push({ role: 'user', content: trimmed })
    messages.value.push({ role: 'assistant', content: '' })
    isStreaming.value = true

    const assistantIndex = messages.value.length - 1

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: getSessionId(), message: trimmed })
      })

      if (!response.ok || !response.body) {
        throw new Error(`Error del servidor (${response.status})`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split('\n\n')
        buffer = parts.pop() ?? ''

        for (const part of parts) {
          const lines = part.split('\n')
          const eventLine = lines.find((l) => l.startsWith('event:'))
          const dataLine = lines.find((l) => l.startsWith('data:'))
          if (!dataLine) continue

          const eventName = eventLine ? eventLine.replace('event:', '').trim() : 'message'
          const data = JSON.parse(dataLine.replace('data:', '').trim())

          if (eventName === 'token') {
            messages.value[assistantIndex].content += data.content
          } else if (eventName === 'record_saved') {
            lastSavedRecord.value = data.record
            setTimeout(() => {
              messages.value = []
              lastSavedRecord.value = null
              startNewSession()
            }, RESET_DELAY_MS)
          } else if (eventName === 'error') {
            errorMessage.value = data.message
          }
        }
      }
    } catch (err) {
      errorMessage.value = err instanceof Error ? err.message : 'No se pudo conectar con el servidor'
      messages.value[assistantIndex].content ||= 'Ocurrió un error. Intenta de nuevo.'
    } finally {
      isStreaming.value = false
    }
  }

  return { messages, isStreaming, lastSavedRecord, errorMessage, sendMessage }
}
