<script setup lang="ts">
interface RecordRow {
  id: string
  conversationId: string
  domain: string
  summary: string
  payload: Record<string, unknown>
  status: string
  createdAt: string
}

const { data: records, status, error, refresh } = await useFetch<RecordRow[]>('/api/records')

const expandedId = ref<string | null>(null)

function toggle(id: string) {
  expandedId.value = expandedId.value === id ? null : id
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' })
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (Array.isArray(value)) {
    return value
      .map((item) =>
        item && typeof item === 'object' && 'nombre' in item
          ? `${(item as any).cantidad ?? ''}x ${(item as any).nombre}${(item as any).notas ? ` (${(item as any).notas})` : ''}`
          : String(item)
      )
      .join(', ')
  }
  return String(value)
}
</script>

<template>
  <div class="flex-1 overflow-y-auto px-4 py-4">
    <div class="mb-3 flex items-center justify-between">
      <h2 class="text-sm font-semibold text-neutral-800">Registros guardados</h2>
      <button
        type="button"
        class="rounded-lg border border-neutral-300 px-2.5 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-100"
        @click="refresh()"
      >
        Actualizar
      </button>
    </div>

    <div v-if="status === 'pending'" class="mt-10 text-center text-sm text-neutral-400">
      Cargando…
    </div>

    <div v-else-if="error" class="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
      No se pudieron cargar los registros.
    </div>

    <div v-else-if="!records?.length" class="mt-10 text-center text-sm text-neutral-400">
      Todavía no hay registros guardados.
    </div>

    <div v-else class="overflow-x-auto rounded-xl border border-neutral-200">
      <table class="w-full text-left text-sm">
        <thead class="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
          <tr>
            <th class="px-3 py-2 font-medium">Fecha</th>
            <th class="px-3 py-2 font-medium">Dominio</th>
            <th class="px-3 py-2 font-medium">Resumen</th>
            <th class="px-3 py-2 font-medium">Estado</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="record in records" :key="record.id">
            <tr
              class="cursor-pointer border-t border-neutral-100 hover:bg-neutral-50"
              @click="toggle(record.id)"
            >
              <td class="whitespace-nowrap px-3 py-2 text-neutral-500">{{ formatDate(record.createdAt) }}</td>
              <td class="whitespace-nowrap px-3 py-2 capitalize text-neutral-700">{{ record.domain }}</td>
              <td class="px-3 py-2 text-neutral-800">{{ record.summary }}</td>
              <td class="whitespace-nowrap px-3 py-2">
                <span class="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  {{ record.status }}
                </span>
              </td>
            </tr>
            <tr v-if="expandedId === record.id" class="border-t border-neutral-100 bg-neutral-50">
              <td colspan="4" class="px-3 py-2">
                <dl class="grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-3">
                  <template v-for="(value, key) in record.payload" :key="key">
                    <div class="flex gap-1">
                      <dt class="font-medium capitalize text-neutral-500">{{ key }}:</dt>
                      <dd class="text-neutral-700">{{ formatValue(value) }}</dd>
                    </div>
                  </template>
                </dl>
                <p class="mt-2 text-[11px] text-neutral-400">ID: {{ record.id }}</p>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>
