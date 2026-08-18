import { asc } from 'drizzle-orm'
import { useDb } from '../db'
import { products } from '../db/schema'

export default defineEventHandler(async () => {
  const db = useDb()
  return await db.select().from(products).orderBy(asc(products.name))
})
