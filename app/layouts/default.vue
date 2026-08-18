<script setup lang="ts">
const config = useRuntimeConfig()

const tabs = [
  { to: '/', label: 'Chat' },
  { to: '/registros', label: 'Registros' },
  { to: '/recursos', label: 'Recursos' }
]
</script>

<template>
  <div class="flex h-screen justify-center bg-neutral-50">
    <div class="flex h-full w-full max-w-3xl flex-col bg-white shadow-sm">
      <header class="border-b border-neutral-200 px-4 py-3">
        <h1 class="text-sm font-semibold text-neutral-800">{{ config.public.appName }}</h1>
        <nav class="mt-2 flex gap-1">
          <NuxtLink
            v-for="tab in tabs"
            :key="tab.to"
            :to="tab.to"
            class="rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-500 hover:bg-neutral-100"
            exact-active-class="bg-neutral-900 text-white hover:bg-neutral-900"
          >
            {{ tab.label }}
          </NuxtLink>
        </nav>
      </header>
      <slot />
    </div>
  </div>
</template>
