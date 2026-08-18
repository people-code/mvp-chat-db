import { ilike } from 'drizzle-orm'
import { useDb } from '../db'
import { doctors, products } from '../db/schema'

export async function getDoctorsContext(): Promise<string> {
  const db = useDb()
  const rows = await db.select().from(doctors)
  if (rows.length === 0) return ''
  const lines = rows.map((d) => `- ${d.name} (${d.specialty}): disponible ${d.schedule}`).join('\n')
  return `Médicos disponibles (usa solo estos nombres y especialidades, no inventes otros):\n${lines}`
}

export async function getProductsContext(): Promise<string> {
  const db = useDb()
  const rows = await db.select().from(products)
  if (rows.length === 0) return ''
  const lines = rows.map((p) => `- ${p.name} ($${p.price}): ${p.ingredients}`).join('\n')
  return `Menú disponible (usa solo estos productos, no inventes otros):\n${lines}`
}

export async function findDoctorByName(name: string | null | undefined) {
  if (!name) return null
  const db = useDb()
  const [match] = await db.select().from(doctors).where(ilike(doctors.name, `%${name}%`)).limit(1)
  return match ?? null
}

export async function findDoctorBySpecialty(specialty: string | null | undefined) {
  if (!specialty) return null
  const db = useDb()
  const [match] = await db.select().from(doctors).where(ilike(doctors.specialty, `%${specialty}%`)).limit(1)
  return match ?? null
}

export async function findProductByName(name: string | null | undefined) {
  if (!name) return null
  const db = useDb()
  const [match] = await db.select().from(products).where(ilike(products.name, `%${name}%`)).limit(1)
  return match ?? null
}
