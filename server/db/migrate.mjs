import 'dotenv/config'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set')
}

const client = postgres(databaseUrl, { max: 1 })
const db = drizzle(client)

await migrate(db, { migrationsFolder: new URL('../../drizzle', import.meta.url).pathname })
await client.end()

console.log('Migrations applied')
