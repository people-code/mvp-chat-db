import { desc } from 'drizzle-orm'
import { useDb } from '../db'
import { records } from '../db/schema'

export default defineEventHandler(async () => {
  const db = useDb()
  return await db.select().from(records).orderBy(desc(records.createdAt))
})
