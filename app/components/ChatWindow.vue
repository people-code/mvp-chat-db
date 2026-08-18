<script setup lang="ts">
const { messages, isStreaming, lastSavedRecord, errorMessage, sendMessage } = useChat()

const scrollRef = ref<HTMLDivElement>()

watch(
  () => [messages.value.length, messages.value[messages.value.length - 1]?.content],
  () => {
    nextTick(() => {
      scrollRef.value?.scrollTo({ top: scrollRef.value.scrollHeight, behavior: 'smooth' })
    })
  }
)
</script>

<template>
  <div class="flex h-full flex-col">
    <div ref="scrollRef" class="flex-1 space-y-3 overflow-y-auto px-4 py-6">
      <div v-if="messages.length === 0" class="mt-10 text-center text-sm text-neutral-400">
        Escribe para comenzar la conversación.
      </div>

      <template v-for="(message, i) in messages" :key="i">
        <ChatMessage :role="message.role" :content="message.content" />
        <div v-if="message.role === 'assistant' && !message.content && isStreaming && i === messages.length - 1" class="text-xs text-neutral-400">
          escribiendo…
        </div>
      </template>

      <RecordSavedCard v-if="lastSavedRecord" :record="lastSavedRecord" />

      <div v-if="errorMessage" class="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
        {{ errorMessage }}
      </div>
    </div>

    <ChatInput :disabled="isStreaming" @send="sendMessage" />
  </div>
</template>
