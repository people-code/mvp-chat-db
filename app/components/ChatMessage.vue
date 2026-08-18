<script setup lang="ts">
const props = defineProps<{
  role: 'user' | 'assistant'
  content: string
}>()

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function renderMarkdown(text: string): string {
  let html = escapeHtml(text)
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
  html = html.replace(/`(.+?)`/g, '<code class="px-1 py-0.5 bg-black/10 rounded text-sm">$1</code>')
  html = html.replace(/\n/g, '<br>')
  return html
}

const rendered = computed(() => renderMarkdown(props.content))
</script>

<template>
  <div class="flex" :class="role === 'user' ? 'justify-end' : 'justify-start'">
    <div
      class="max-w-[80%] rounded-2xl px-4 py-2 text-sm leading-relaxed whitespace-pre-wrap"
      :class="role === 'user'
        ? 'bg-neutral-900 text-white rounded-br-sm'
        : 'bg-neutral-100 text-neutral-900 rounded-bl-sm'"
      v-html="rendered || '&nbsp;'"
    />
  </div>
</template>
