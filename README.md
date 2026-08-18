# MVP Chat con LLM local (Ollama) + Postgres

Chat centrado en una sola página que conversa con un modelo local vía [Ollama](https://ollama.com). Cuando el usuario escribe "guardar", extrae un registro estructurado de la conversación (hora médica, pedido, etc.) y lo persiste en Postgres.

Stack: Nuxt 4 (Nitro server routes) · PostgreSQL 16 (`pgvector/pgvector:pg16`) · Drizzle ORM · Ollama.

## Requisitos

- Docker y Docker Compose.
- Node.js 22+ y npm.
- `make` (viene preinstalado en macOS y la mayoría de distros Linux).

## Guía rápida de instalación

### 1. Instalar Ollama (si no lo tienes)

```bash
ollama -v   # ¿ya lo tienes? si el comando existe, salta al paso 2
```

- macOS: `brew install ollama`, o descargar desde [ollama.com/download](https://ollama.com/download).
- Linux: `curl -fsSL https://ollama.com/install.sh | sh`.

Confirma que el servicio esté corriendo (en macOS la app de Ollama lo deja corriendo en background; en Linux puede que necesites `ollama serve`).

### 2. Descargar el modelo

```bash
ollama pull gemma4:e4b
```

Es el modelo que usa el proyecto por defecto (`OLLAMA_MODEL`, ver [Modelo](#modelo)). Cualquier modelo con soporte de `format: json` sirve si prefieres otro.

### 3. Levantar el proyecto

```bash
cp .env.example .env
npm install
make dev
```

`make dev` levanta Postgres en Docker, aplica migraciones y datos de ejemplo (médicos/menú), y corre la app con hot-reload en `http://localhost:3000`. `Ctrl+C` detiene la app; Postgres queda corriendo hasta que ejecutes:

```bash
make down   # docker compose down — baja y elimina todos los containers
```

`.env` trae valores pensados para este flujo (Postgres en `localhost:5432`, Ollama en `localhost:11434`).

## Datos de catálogo (médicos / menú)

Las tablas `doctors` (nombre, especialidad, horario) y `products` (nombre, precio, ingredientes) alimentan al asistente: su contenido se inyecta en el system prompt de cada turno, así el modelo puede responder preguntas como "¿qué médicos hay?" o "¿qué tiene la pizza napolitana?" sin inventar datos. Al guardar una cita o pedido, el registro queda enlazado al catálogo: `records.doctor_id` apunta al médico (dominio `salud`), y cada ítem dentro de `records.payload.items` lleva su `productId` (dominio `restaurant`). La resolución es por coincidencia de nombre (`ILIKE`) contra `doctors`/`products`; si no hay match, el campo queda en `null`.

`npm run db:seed` (o el servicio `migrate` en Docker) inserta datos de ejemplo solo si las tablas están vacías — es seguro correrlo más de una vez.

## Modelo

Por defecto usa `gemma4:e4b` (`OLLAMA_MODEL`). Cualquier modelo con soporte de `format: json` en Ollama funciona; `qwen2.5:7b-instruct` es una alternativa con buen soporte de español y JSON estructurado si tu máquina tiene más VRAM.

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
