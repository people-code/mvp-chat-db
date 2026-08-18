import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { useDb } from '../db'
import { messages as messagesTable, records as recordsTable } from '../db/schema'
import { extractRecord, type ChatMessage } from './ollama'
import type { Domain } from './prompts'
import { findDoctorByName, findDoctorBySpecialty, findProductByName } from './catalog'

const saludPayloadSchema = z.object({
  paciente: z.string().nullable(),
  rut: z.string().nullable(),
  especialidad: z.string().nullable(),
  profesional: z.string().nullable(),
  fecha: z.string().nullable(),
  hora: z.string().nullable(),
  motivo: z.string().nullable(),
  telefono: z.string().nullable()
})

const restaurantPayloadSchema = z.object({
  cliente: z.string().nullable(),
  tipo: z.string().nullable(),
  items: z.array(z.object({
    nombre: z.string(),
    cantidad: z.number(),
    notas: z.string().nullable()
  })),
  direccion: z.string().nullable(),
  telefono: z.string().nullable(),
  total_estimado: z.number().nullable()
})

const saludJsonSchema = {
  type: 'object',
  properties: {
    paciente: { type: ['string', 'null'] },
    rut: { type: ['string', 'null'] },
    especialidad: { type: ['string', 'null'] },
    profesional: { type: ['string', 'null'] },
    fecha: { type: ['string', 'null'] },
    hora: { type: ['string', 'null'] },
    motivo: { type: ['string', 'null'] },
    telefono: { type: ['string', 'null'] }
  },
  required: ['paciente', 'rut', 'especialidad', 'profesional', 'fecha', 'hora', 'motivo', 'telefono']
}

const restaurantJsonSchema = {
  type: 'object',
  properties: {
    cliente: { type: ['string', 'null'] },
    tipo: { type: ['string', 'null'] },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          nombre: { type: 'string' },
          cantidad: { type: 'number' },
          notas: { type: ['string', 'null'] }
        },
        required: ['nombre', 'cantidad', 'notas']
      }
    },
    direccion: { type: ['string', 'null'] },
    telefono: { type: ['string', 'null'] },
    total_estimado: { type: ['number', 'null'] }
  },
  required: ['cliente', 'tipo', 'items', 'direccion', 'telefono', 'total_estimado']
}

const EXTRACTION_PROMPTS: Record<Domain, string> = {
  salud: 'Extrae del historial de la conversación los datos del agendamiento médico. Si un dato no fue mencionado explícitamente, usa null. Nunca inventes valores.',
  restaurant: 'Extrae del historial de la conversación los datos del pedido. Si un dato no fue mencionado explícitamente, usa null. Nunca inventes valores.'
}

const MIN_FIELDS: Record<Domain, string[]> = {
  salud: ['paciente', 'especialidad', 'fecha', 'hora'],
  restaurant: ['cliente', 'tipo']
}

const FIELD_LABELS: Record<string, string> = {
  paciente: 'el nombre del paciente',
  especialidad: 'la especialidad',
  fecha: 'la fecha',
  hora: 'la hora',
  cliente: 'tu nombre',
  tipo: 'si es delivery o retiro en local'
}

function normalizeDomain(domain: string): Domain {
  return domain === 'restaurant' ? 'restaurant' : 'salud'
}

function missingMinFields(domain: Domain, payload: Record<string, unknown>): string[] {
  if (domain === 'restaurant') {
    const missing = MIN_FIELDS.restaurant.filter((f) => !payload[f])
    const items = payload.items as unknown[] | undefined
    if (!items || items.length === 0) missing.push('items')
    return missing
  }
  return MIN_FIELDS.salud.filter((f) => !payload[f])
}

export function missingFieldsMessage(missing: string[]): string {
  const labels = missing.map((f) => FIELD_LABELS[f] ?? f)
  return `Todavía me falta ${labels.join(', ')} para poder guardar. ¿Me lo puedes decir?`
}

export async function extractAndSaveRecord(conversationId: string, domain: string) {
  const db = useDb()
  const normalizedDomain = normalizeDomain(domain)

  const history = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, conversationId))
    .orderBy(messagesTable.createdAt)

  const chatMessages: ChatMessage[] = history
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))

  const jsonSchema = normalizedDomain === 'restaurant' ? restaurantJsonSchema : saludJsonSchema
  const zodSchema = normalizedDomain === 'restaurant' ? restaurantPayloadSchema : saludPayloadSchema

  const raw = await extractRecord(chatMessages, jsonSchema, EXTRACTION_PROMPTS[normalizedDomain])
  const payload = zodSchema.parse(raw)

  const missing = missingMinFields(normalizedDomain, payload as Record<string, unknown>)
  if (missing.length > 0) {
    return { ok: false as const, missing }
  }

  const summary = buildSummary(normalizedDomain, payload as Record<string, unknown>)

  let doctorId: string | null = null
  let finalPayload: Record<string, unknown> = payload as Record<string, unknown>

  if (normalizedDomain === 'salud') {
    const p = payload as z.infer<typeof saludPayloadSchema>
    const doctor = (await findDoctorByName(p.profesional)) ?? (await findDoctorBySpecialty(p.especialidad))
    doctorId = doctor?.id ?? null
  } else {
    const p = payload as z.infer<typeof restaurantPayloadSchema>
    const itemsWithProductId = await Promise.all(
      p.items.map(async (item) => {
        const product = await findProductByName(item.nombre)
        return { ...item, productId: product?.id ?? null }
      })
    )
    finalPayload = { ...p, items: itemsWithProductId }
  }

  const [record] = await db
    .insert(recordsTable)
    .values({
      conversationId,
      domain: normalizedDomain,
      summary,
      payload: finalPayload,
      status: 'confirmed',
      doctorId
    })
    .returning()

  return { ok: true as const, record }
}

function buildSummary(domain: Domain, payload: Record<string, unknown>): string {
  if (domain === 'restaurant') {
    const items = (payload.items as { nombre: string; cantidad: number }[]) ?? []
    const itemsText = items.map((i) => `${i.cantidad}x ${i.nombre}`).join(', ')
    return `Pedido de ${payload.cliente}: ${itemsText} (${payload.tipo})`
  }
  return `Hora para ${payload.paciente} - ${payload.especialidad} el ${payload.fecha} a las ${payload.hora}`
}
