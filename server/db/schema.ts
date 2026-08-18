import { pgTable, uuid, text, timestamp, jsonb, integer, index } from 'drizzle-orm/pg-core'

export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: text('session_id').notNull(),
  domain: text('domain').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
})

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').references(() => conversations.id, { onDelete: 'cascade' }).notNull(),
  role: text('role').notNull(), // 'user' | 'assistant' | 'system'
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => [
  index('messages_conversation_id_created_at_idx').on(table.conversationId, table.createdAt)
])

export const doctors = pgTable('doctors', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  specialty: text('specialty').notNull(),
  schedule: text('schedule').notNull(), // human-readable availability, e.g. "Lunes a viernes 9:00-13:00"
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
})

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  price: integer('price').notNull(), // CLP
  ingredients: text('ingredients').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
})

export const records = pgTable('records', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').references(() => conversations.id, { onDelete: 'cascade' }).notNull(),
  domain: text('domain').notNull(),
  summary: text('summary').notNull(),
  payload: jsonb('payload').notNull(),
  status: text('status').default('pending').notNull(), // 'pending' | 'confirmed'
  doctorId: uuid('doctor_id').references(() => doctors.id), // set when domain = 'salud' and a match was found
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => [
  index('records_conversation_id_idx').on(table.conversationId)
])
