import 'dotenv/config'
import postgres from 'postgres'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set')
}

const sql = postgres(databaseUrl, { max: 1 })

const seedDoctors = [
  { name: 'Dra. Carolina Reyes', specialty: 'Medicina General', schedule: 'Lunes a viernes, 9:00-13:00' },
  { name: 'Dr. Felipe Soto', specialty: 'Pediatría', schedule: 'Martes y jueves, 14:00-18:00' },
  { name: 'Dra. Javiera Muñoz', specialty: 'Dermatología', schedule: 'Lunes, miércoles y viernes, 10:00-14:00' },
  { name: 'Dr. Ignacio Rojas', specialty: 'Traumatología', schedule: 'Miércoles y viernes, 9:00-12:00' }
]

const seedProducts = [
  { name: 'Pizza Napolitana', price: 8500, ingredients: 'Tomate, mozzarella, albahaca, aceite de oliva' },
  { name: 'Pizza Pepperoni', price: 9500, ingredients: 'Tomate, mozzarella, pepperoni' },
  { name: 'Empanada de Pino', price: 1800, ingredients: 'Carne, cebolla, huevo, aceituna, pasas' },
  { name: 'Ensalada César', price: 6500, ingredients: 'Lechuga, pollo, crutones, parmesano, aderezo césar' },
  { name: 'Jugo Natural', price: 2500, ingredients: 'Fruta de estación, agua o leche' }
]

const [{ count: doctorCount }] = await sql`select count(*)::int as count from doctors`
if (doctorCount === 0) {
  await sql`insert into doctors ${sql(seedDoctors, 'name', 'specialty', 'schedule')}`
  console.log(`Seeded ${seedDoctors.length} doctors`)
} else {
  console.log('Doctors table already has data, skipping seed')
}

const [{ count: productCount }] = await sql`select count(*)::int as count from products`
if (productCount === 0) {
  await sql`insert into products ${sql(seedProducts, 'name', 'price', 'ingredients')}`
  console.log(`Seeded ${seedProducts.length} products`)
} else {
  console.log('Products table already has data, skipping seed')
}

await sql.end()
