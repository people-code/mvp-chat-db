import { z } from 'zod'
import { and, eq, asc } from 'drizzle-orm'
import { useDb } from '../db'
import { conversations, messages as messagesTable } from '../db/schema'
import { streamChatTokens, type ChatMessage } from '../utils/ollama'
import { getSystemPrompt, SAVE_INTENT_REGEX } from '../utils/prompts'
import { extractAndSaveRecord, missingFieldsMessage } from '../utils/records'
import { getDoctorsContext, getProductsContext } from '../utils/catalog'

const HISTORY_LIMIT = 20

const bodySchema = z.object({
  sessionId: z.string().min(1),
  message: z.string().min(1),
  domain: z.string().optional()
})

async function getOrCreateConversation(sessionId: string, domain: string) {
  const db = useDb()
  const [existing] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.sessionId, sessionId), eq(conversations.domain, domain)))
    .limit(1)

  if (existing) return existing

  const [created] = await db.insert(conversations).values({ sessionId, domain }).returning()
  return created
}

function sseEvent(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
}

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, bodySchema.parse)
  const domain = body.domain || process.env.APP_DOMAIN || 'salud'

  const db = useDb()
  const conversation = await getOrCreateConversation(body.sessionId, domain)

  await db.insert(messagesTable).values({
    conversationId: conversation.id,
    role: 'user',
    content: body.message
  })

  setResponseHeaders(event, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive'
  })

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder()
      const send = (event: string, data: unknown) => controller.enqueue(encoder.encode(sseEvent(event, data)))

      try {
        if (SAVE_INTENT_REGEX.test(body.message)) {
          const result = await extractAndSaveRecord(conversation.id, domain)

          if (result.ok) {
            const text = `Listo, quedó guardado: ${result.record.summary}. ¿Te puedo ayudar en algo más?`
            await db.insert(messagesTable).values({ conversationId: conversation.id, role: 'assistant', content: text })
            send('token', { content: text })
            send('record_saved', { record: result.record })
          } else {
            const text = missingFieldsMessage(result.missing)
            await db.insert(messagesTable).values({ conversationId: conversation.id, role: 'assistant', content: text })
            send('token', { content: text })
          }

          send('done', {})
          controller.close()
          return
        }

        const history = await db
          .select()
          .from(messagesTable)
          .where(eq(messagesTable.conversationId, conversation.id))
          .orderBy(asc(messagesTable.createdAt))
          .limit(HISTORY_LIMIT)

        const catalogContext = domain === 'restaurant' ? await getProductsContext() : await getDoctorsContext()
        const systemPrompt = [getSystemPrompt(domain), catalogContext].filter(Boolean).join('\n\n')

        const chatMessages: ChatMessage[] = [
          { role: 'system', content: systemPrompt },
          ...history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))
        ]

        let fullText = ''
        for await (const token of streamChatTokens(chatMessages)) {
          fullText += token
          send('token', { content: token })
        }

        await db.insert(messagesTable).values({ conversationId: conversation.id, role: 'assistant', content: fullText })
        send('done', {})
        controller.close()
      } catch (err) {
        send('error', { message: err instanceof Error ? err.message : 'Error inesperado' })
        controller.close()
      }
    }
  })

  return stream
})
