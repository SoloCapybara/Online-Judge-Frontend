<script setup lang="ts">
import * as monaco from 'monaco-editor'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  modelValue: string
  language?: string
}>(), {
  language: 'java',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const containerRef = ref<HTMLDivElement | null>(null)
let editor: monaco.editor.IStandaloneCodeEditor | null = null

onMounted(() => {
  if (!containerRef.value) {
    return
  }

  editor = monaco.editor.create(containerRef.value, {
    value: props.modelValue,
    language: props.language,
    theme: 'vs',
    automaticLayout: true,
    minimap: { enabled: false },
    fontSize: 14,
    lineHeight: 22,
    padding: { top: 16, bottom: 16 },
    roundedSelection: false,
    scrollBeyondLastLine: false,
  })

  editor.onDidChangeModelContent(() => {
    emit('update:modelValue', editor?.getValue() ?? '')
  })
})

watch(
  () => props.modelValue,
  (value) => {
    if (editor && value !== editor.getValue()) {
      editor.setValue(value)
    }
  },
)

watch(
  () => props.language,
  (language) => {
    const model = editor?.getModel()
    if (model && language) {
      monaco.editor.setModelLanguage(model, language)
    }
  },
)

onBeforeUnmount(() => {
  editor?.dispose()
})
</script>

<template>
  <div ref="containerRef" class="editor-container"></div>
</template>

<style scoped>
.editor-container {
  min-height: 480px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #dbe5f0;
}
</style>
