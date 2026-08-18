import { z } from 'zod'
import { extractAndSaveRecord, missingFieldsMessage } from '../utils/records'

const bodySchema = z.object({
  conversationId: z.string().uuid(),
  domain: z.string()
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, bodySchema.parse)
  const result = await extractAndSaveRecord(body.conversationId, body.domain)

  if (!result.ok) {
    throw createError({
      statusCode: 400,
      statusMessage: missingFieldsMessage(result.missing)
    })
  }

  return result.record
})
