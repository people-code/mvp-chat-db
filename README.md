# MVP Chat con LLM local (Ollama) + Postgres

Chat centrado en una sola página que conversa con un modelo local vía [Ollama](https://ollama.com). Cuando el usuario escribe "guardar", extrae un registro estructurado de la conversación (hora médica, pedido, etc.) y lo persiste en Postgres.

Stack: Nuxt 4 (Nitro server routes) · PostgreSQL 16 (`pgvector/pgvector:pg16`) · Drizzle ORM · Ollama.

## Requisitos

- [Ollama](https://ollama.com) instalado y corriendo en el host.
- Docker y Docker Compose.
- `make` (viene preinstalado en macOS y la mayoría de distros Linux) para el flujo de desarrollo local.

## Arranque rápido (Docker, recomendado)

```bash
ollama pull gemma4:e4b   # o el modelo que prefieras (ver Modelo más abajo)
docker compose up
```

Esto levanta Postgres, corre las migraciones y datos de ejemplo (`migrate`) y luego levanta la app en `http://localhost:3000`.

- macOS/Windows (Docker Desktop): la app alcanza Ollama en el host vía `host.docker.internal`, ya configurado en `docker-compose.yml`.
- Linux con Ollama en el host: edita `OLLAMA_BASE_URL` en `docker-compose.yml` (servicio `app`) a `http://172.17.0.1:11434` (o la IP del bridge `docker0`).

Para cambiar el dominio del asistente (`salud` ↔ `restaurant`), edita `APP_DOMAIN` en `docker-compose.yml` y reinicia — no requiere tocar código.

## Desarrollo local (sin Docker para la app)

```bash
cp .env.example .env
npm install
make dev   # levanta Postgres, aplica migraciones + seed, y corre `npm run dev`
```

`make dev` no reemplaza `docker compose up`: solo levanta el servicio `db` (Postgres) y corre la app directamente en el host con `npm run dev`, para tener hot-reload. `Ctrl+C` detiene `npm run dev`; el contenedor de Postgres queda corriendo hasta que ejecutes:

```bash
make down   # docker compose down — baja y elimina todos los containers
```

`.env` trae valores pensados para correr `npm run dev` en el host (Postgres en `localhost:5432`, Ollama en `localhost:11434`). Este archivo no lo lee `docker compose up` (ver comentario en `.env.example`).

## Datos de catálogo (médicos / menú)

Las tablas `doctors` (nombre, especialidad, horario) y `products` (nombre, precio, ingredientes) alimentan al asistente: su contenido se inyecta en el system prompt de cada turno, así el modelo puede responder preguntas como "¿qué médicos hay?" o "¿qué tiene la pizza napolitana?" sin inventar datos. Al guardar una cita o pedido, el registro queda enlazado al catálogo: `records.doctor_id` apunta al médico (dominio `salud`), y cada ítem dentro de `records.payload.items` lleva su `productId` (dominio `restaurant`). La resolución es por coincidencia de nombre (`ILIKE`) contra `doctors`/`products`; si no hay match, el campo queda en `null`.

`npm run db:seed` (o el servicio `migrate` en Docker) inserta datos de ejemplo solo si las tablas están vacías — es seguro correrlo más de una vez.

## Modelo

Por defecto usa `gemma4:e4b` (`OLLAMA_MODEL`). Cualquier modelo con soporte de `format: json` en Ollama funciona; `qwen2.5:7b-instruct` es una alternativa con buen soporte de español y JSON estructurado si tu máquina tiene más VRAM.

## Makefile

```bash
make dev   # docker compose up -d --wait db && npm run db:migrate && npm run db:seed && npm run dev
make down  # docker compose down — baja y elimina todos los containers
```

Atajo para el flujo de desarrollo local descrito arriba: un solo comando para tener Postgres, migraciones, seed y la app con hot-reload arriba.

## Scripts

```bash
npm run dev          # servidor de desarrollo
npm run build        # build de producción
npm run db:generate  # genera migraciones Drizzle a partir de server/db/schema.ts
npm run db:migrate   # aplica migraciones pendientes (requiere DATABASE_URL)
npm run db:seed      # inserta médicos/menú de ejemplo si las tablas están vacías
```

## Verificar registros guardados

```bash
curl http://localhost:3000/api/records
```

## Estructura

```
app/            # UI Nuxt (páginas, componentes, composable de chat)
server/api/     # chat.post.ts (SSE), records.post.ts, records.get.ts
server/db/      # schema.ts (Drizzle), cliente, migrate.mjs, seed.mjs
server/utils/   # ollama.ts (streaming/extracción), prompts.ts, records.ts, catalog.ts
drizzle/        # migraciones SQL generadas
```
