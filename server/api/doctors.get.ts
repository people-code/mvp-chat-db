import { asc } from 'drizzle-orm'
import { useDb } from '../db'
import { doctors } from '../db/schema'

export default defineEventHandler(async () => {
  const db = useDb()
  return await db.select().from(doctors).orderBy(asc(doctors.name))
})
