<script setup lang="ts">
const props = defineProps<{ disabled?: boolean }>()
const emit = defineEmits<{ send: [text: string] }>()

const text = ref('')
const textareaRef = ref<HTMLTextAreaElement>()

function submit() {
  if (props.disabled) return
  const value = text.value
  if (!value.trim()) return
  emit('send', value)
  text.value = ''
  nextTick(() => {
    if (textareaRef.value) textareaRef.value.style.height = 'auto'
  })
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    submit()
  }
}

function autoGrow() {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${Math.min(el.scrollHeight, 160)}px`
}
</script>

<template>
  <div class="flex items-end gap-2 border-t border-neutral-200 bg-white p-3">
    <textarea
      ref="textareaRef"
      v-model="text"
      rows="1"
      :disabled="disabled"
      placeholder="Escribe un mensaje…"
      class="max-h-40 flex-1 resize-none rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 disabled:opacity-50"
      @keydown="onKeydown"
      @input="autoGrow"
    />
    <button
      type="button"
      :disabled="disabled || !text.trim()"
      class="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
      @click="submit"
    >
      Enviar
    </button>
  </div>
</template>
