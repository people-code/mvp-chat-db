<script setup lang="ts">
import type { SavedRecord } from '../composables/useChat'

const props = defineProps<{ record: SavedRecord }>()

const fields = computed(() =>
  Object.entries(props.record.payload).filter(([, value]) => value !== null && value !== undefined)
)
</script>

<template>
  <div class="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
    <div class="flex items-center gap-2 font-medium">
      <span>✓</span>
      <span>Guardado</span>
    </div>
    <p class="mt-1">{{ record.summary }}</p>
    <dl class="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-emerald-800">
      <template v-for="[key, value] in fields" :key="key">
        <dt class="font-medium capitalize">{{ key }}</dt>
        <dd>{{ Array.isArray(value) ? value.map((v: any) => `${v.cantidad}x ${v.nombre}`).join(', ') : String(value) }}</dd>
      </template>
    </dl>
    <p class="mt-2 text-[11px] text-emerald-700/70">ID: {{ record.id }}</p>
  </div>
</template>
